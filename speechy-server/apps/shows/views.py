from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from .models import Show, ShowMembership, ShowRole
from .serializers import ShowSerializer, ShowDetailSerializer, ShowMembershipSerializer
from .permissions import IsShowViewerOrAbove, IsShowEditorOrAbove, IsShowOwner, get_members_with_source
from .services import (
    get_shows_for_user, search_show, search_shows_by_name, get_root_counts_for_user,
    get_show_tree_with_counts, truncate_tree_depth, get_recursive_episode_ids_for_user,
)
from apps.episodes.models import Episode
from apps.episodes.serializers import EpisodeSerializer
from apps.users.services import log_action


class ShowViewSet(viewsets.ModelViewSet):
    serializer_class = ShowSerializer

    def get_queryset(self):
        return get_shows_for_user(self.request.user)

    def get_permissions(self):
        if self.action in ('partial_update', 'destroy', 'children'):
            classes = [IsAuthenticated, IsShowOwner]
        elif self.action == 'upload':
            classes = [IsAuthenticated, IsShowEditorOrAbove]
        elif self.action == 'members':
            classes = [IsAuthenticated, IsShowOwner] if self.request.method == 'POST' else [IsAuthenticated, IsShowViewerOrAbove]
        elif self.action == 'member_detail':
            classes = [IsAuthenticated, IsShowOwner]
        elif self.action in ('list', 'retrieve', 'tree', 'episodes', 'search'):
            classes = [IsAuthenticated, IsShowViewerOrAbove]
        else:
            classes = [IsAuthenticated]
        return [c() for c in classes]

    def list(self, request, *args, **kwargs):
        search = request.query_params.get('search')
        if search:
            results = search_shows_by_name(request.user, search)
            return Response({
                'data': ShowSerializer(results, many=True, context={'request': request}).data,
                'error': None,
            })
        parent_id = request.query_params.get('parent')
        qs = self.get_queryset()
        if parent_id:
            qs = qs.filter(parent_id=parent_id)
            return Response({
                'data': ShowSerializer(qs, many=True, context={'request': request}).data,
                'error': None,
            })
        qs = qs.filter(parent__isnull=True)
        counts = get_root_counts_for_user(request.user)
        return Response({
            'data': ShowSerializer(
                qs, many=True, context={'recursive_counts': counts, 'request': request}
            ).data,
            'error': None,
        })

    def retrieve(self, request, *args, **kwargs):
        show = self.get_object()
        return Response({'data': ShowDetailSerializer(show, context={'request': request}).data, 'error': None})

    def create(self, request, *args, **kwargs):
        s = ShowSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        data = dict(s.validated_data)
        data.setdefault('organization', request.user.organization)
        with transaction.atomic():
            show = Show(**data)
            show.save()
            ShowMembership.objects.create(
                show=show, user=request.user, role=ShowRole.OWNER, created_by=request.user,
            )
        log_action(request.user, 'show.create', resource_type='show', resource_id=show.id)
        return Response({'data': ShowSerializer(show, context={'request': request}).data, 'error': None},
                        status=status.HTTP_201_CREATED)

    def partial_update(self, request, *args, **kwargs):
        s = ShowSerializer(self.get_object(), data=request.data, partial=True)
        s.is_valid(raise_exception=True)
        show = s.save()
        return Response({'data': ShowSerializer(show, context={'request': request}).data, 'error': None})

    def destroy(self, request, *args, **kwargs):
        self.get_object().delete()
        return Response({'data': None, 'error': None}, status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'], url_path='children')
    def children(self, request, pk=None):
        parent = self.get_object()
        # .dict() flattens QueryDict's list-valued raw storage back to single values first
        # (a bare {**request.data} on a multipart/form POST wraps every value in a list).
        raw = request.data.dict() if hasattr(request.data, 'dict') else request.data
        s = ShowSerializer(data={**raw, 'parent': parent.id})
        s.is_valid(raise_exception=True)
        data = dict(s.validated_data)
        data['organization'] = parent.organization
        child = Show(**data)
        child.save()
        return Response({'data': ShowSerializer(child, context={'request': request}).data, 'error': None},
                        status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'], url_path='tree')
    def tree(self, request, pk=None):
        show = self.get_object()
        max_depth = int(request.query_params.get('depth', Show.MAX_DEPTH))
        tree, _nodes = get_show_tree_with_counts(show.id)
        if tree:
            tree = truncate_tree_depth(tree, max_depth)
        return Response({'data': tree, 'error': None})

    @action(detail=True, methods=['get'], url_path='episodes')
    def episodes(self, request, pk=None):
        show = self.get_object()
        if request.query_params.get('include_descendants') == 'true':
            episode_ids = get_recursive_episode_ids_for_user(request.user, show)
            episodes = Episode.objects.filter(id__in=episode_ids).select_related('primary_show')
        else:
            episodes = show.cross_listed_episodes.all().select_related('primary_show')
        # Pagination is opt-in (triggered by `page`/`page_size` being present) so existing
        # callers that want the full flat list (the chat episode selectors) are unaffected.
        if 'page' in request.query_params or 'page_size' in request.query_params:
            page = self.paginate_queryset(episodes)
            return self.get_paginated_response(
                EpisodeSerializer(page, many=True, context={'request': request}).data
            )
        return Response({
            'data': EpisodeSerializer(episodes, many=True, context={'request': request}).data,
            'error': None,
        })

    @action(detail=True, methods=['get'], url_path='search')
    def search(self, request, pk=None):
        show = self.get_object()
        query = request.query_params.get('q', '')
        results = search_show(request.user, show, query)
        return Response({'data': results, 'error': None})

    @action(detail=True, methods=['post'], url_path='upload',
            parser_classes=[MultiPartParser, FormParser])
    def upload(self, request, pk=None):
        show = self.get_object()
        file = request.FILES.get('file')
        if not file:
            return Response(
                {'data': None, 'error': {'code': 400, 'message': 'No file provided.'}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        from apps.episodes.services import parse_show_excel
        from apps.processing.services import enqueue_job
        episodes = parse_show_excel(file, show, show.get_root())
        for ep in episodes:
            enqueue_job(ep, 'translate', request.user)
            enqueue_job(ep, 'summarize', request.user)
        return Response({
            'data': {
                'episodes_created': len(episodes),
                'episode_ids': [str(ep.id) for ep in episodes],
            },
            'error': None,
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get', 'post'], url_path='members')
    def members(self, request, pk=None):
        show = self.get_object()
        if request.method == 'GET':
            qs, source, inherited = get_members_with_source(show)
            data = ShowMembershipSerializer(qs, many=True).data
            for row in data:
                row['inherited'] = inherited
                row['inherited_from_show_name'] = source.name if inherited else None
            return Response({'data': data, 'error': None})

        from apps.users.models import User
        user_id = request.data.get('user')
        role = request.data.get('role')
        if role not in ShowRole.values:
            return Response(
                {'data': None, 'error': {'code': 400, 'message': f'role must be one of {ShowRole.values}.'}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        target_user = get_object_or_404(User, pk=user_id)
        if target_user.organization_id != show.organization_id:
            return Response(
                {'data': None, 'error': {'code': 400, 'message': 'User is not in this show\'s organization.'}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        membership, created = ShowMembership.objects.update_or_create(
            show=show, user=target_user, defaults={'role': role, 'created_by': request.user},
        )
        log_action(
            request.user, 'show.member_add', resource_type='show', resource_id=show.id,
            details={'target_user': str(target_user.id), 'role': role},
        )
        return Response(
            {'data': ShowMembershipSerializer(membership).data, 'error': None},
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    @action(detail=True, methods=['patch', 'delete'], url_path=r'members/(?P<member_id>[^/.]+)')
    def member_detail(self, request, pk=None, member_id=None):
        show = self.get_object()
        membership = get_object_or_404(ShowMembership, pk=member_id, show=show)
        if request.method == 'DELETE':
            target_user_id = str(membership.user_id)
            membership.delete()
            log_action(
                request.user, 'show.member_remove', resource_type='show', resource_id=show.id,
                details={'target_user': target_user_id},
            )
            return Response({'data': None, 'error': None}, status=status.HTTP_204_NO_CONTENT)

        role = request.data.get('role')
        if role not in ShowRole.values:
            return Response(
                {'data': None, 'error': {'code': 400, 'message': f'role must be one of {ShowRole.values}.'}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        membership.role = role
        membership.save(update_fields=['role'])
        log_action(
            request.user, 'show.member_role_change', resource_type='show', resource_id=show.id,
            details={'target_user': str(membership.user_id), 'role': role},
        )
        return Response({'data': ShowMembershipSerializer(membership).data, 'error': None})
