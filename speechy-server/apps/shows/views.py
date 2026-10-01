from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from .models import Show
from .serializers import ShowSerializer, ShowDetailSerializer
from .services import (
    get_shows_for_user, search_show, search_shows_by_name, get_root_counts_for_user,
    get_show_tree_with_counts, truncate_tree_depth, get_recursive_episode_ids,
)
from apps.episodes.models import Episode
from apps.episodes.serializers import EpisodeSerializer


class ShowViewSet(viewsets.ModelViewSet):
    serializer_class = ShowSerializer

    def get_queryset(self):
        return get_shows_for_user(self.request.user)

    def list(self, request, *args, **kwargs):
        search = request.query_params.get('search')
        if search:
            results = search_shows_by_name(request.user, search)
            return Response({'data': ShowSerializer(results, many=True).data, 'error': None})
        parent_id = request.query_params.get('parent')
        qs = self.get_queryset()
        if parent_id:
            qs = qs.filter(parent_id=parent_id)
            return Response({'data': ShowSerializer(qs, many=True).data, 'error': None})
        qs = qs.filter(parent__isnull=True)
        counts = get_root_counts_for_user(request.user)
        return Response({
            'data': ShowSerializer(qs, many=True, context={'recursive_counts': counts}).data,
            'error': None,
        })

    def retrieve(self, request, *args, **kwargs):
        show = self.get_object()
        return Response({'data': ShowDetailSerializer(show).data, 'error': None})

    def create(self, request, *args, **kwargs):
        s = ShowSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        data = dict(s.validated_data)
        data.setdefault('organization', request.user.organization)
        show = Show(**data)
        show.save()
        return Response({'data': ShowSerializer(show).data, 'error': None},
                        status=status.HTTP_201_CREATED)

    def partial_update(self, request, *args, **kwargs):
        s = ShowSerializer(self.get_object(), data=request.data, partial=True)
        s.is_valid(raise_exception=True)
        show = s.save()
        return Response({'data': ShowSerializer(show).data, 'error': None})

    def destroy(self, request, *args, **kwargs):
        self.get_object().delete()
        return Response({'data': None, 'error': None}, status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'], url_path='children')
    def children(self, request, pk=None):
        parent = self.get_object()
        s = ShowSerializer(data={**request.data, 'parent': parent.id})
        s.is_valid(raise_exception=True)
        data = dict(s.validated_data)
        data['organization'] = parent.organization
        child = Show(**data)
        child.save()
        return Response({'data': ShowSerializer(child).data, 'error': None},
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
            episode_ids = get_recursive_episode_ids(show.id)
            episodes = Episode.objects.filter(id__in=episode_ids).select_related('primary_show')
        else:
            episodes = show.cross_listed_episodes.all().select_related('primary_show')
        return Response({'data': EpisodeSerializer(episodes, many=True).data, 'error': None})

    @action(detail=True, methods=['get'], url_path='search')
    def search(self, request, pk=None):
        show = self.get_object()
        query = request.query_params.get('q', '')
        results = search_show(show, query)
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
