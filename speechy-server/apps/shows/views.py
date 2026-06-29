from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Show, Season
from .serializers import ShowSerializer, ShowDetailSerializer, SeasonSerializer
from .services import get_shows_for_user, create_show, create_season
from apps.episodes.serializers import EpisodeSerializer


class ShowViewSet(viewsets.ModelViewSet):
    serializer_class = ShowSerializer

    def get_queryset(self):
        return get_shows_for_user(self.request.user)

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        return Response({'data': ShowSerializer(qs, many=True).data, 'error': None})

    def retrieve(self, request, *args, **kwargs):
        show = self.get_object()
        return Response({'data': ShowDetailSerializer(show).data, 'error': None})

    def create(self, request, *args, **kwargs):
        s = ShowSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        data = s.validated_data
        data['organization'] = request.user.organization
        show = Show.objects.create(**data)
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

    @action(detail=True, methods=['get', 'post'], url_path='seasons')
    def seasons(self, request, pk=None):
        show = self.get_object()
        if request.method == 'GET':
            seasons = show.seasons.all()
            return Response({'data': SeasonSerializer(seasons, many=True).data, 'error': None})
        s = SeasonSerializer(data={**request.data, 'show': show.id})
        s.is_valid(raise_exception=True)
        season = s.save()
        return Response({'data': SeasonSerializer(season).data, 'error': None},
                        status=status.HTTP_201_CREATED)


class SeasonViewSet(viewsets.ModelViewSet):
    serializer_class = SeasonSerializer

    def get_queryset(self):
        return Season.objects.filter(
            show__organization=self.request.user.organization
        ).select_related('show')

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        return Response({'data': SeasonSerializer(qs, many=True).data, 'error': None})

    def retrieve(self, request, *args, **kwargs):
        return Response({'data': SeasonSerializer(self.get_object()).data, 'error': None})

    def create(self, request, *args, **kwargs):
        s = SeasonSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        season = s.save()
        return Response({'data': SeasonSerializer(season).data, 'error': None},
                        status=status.HTTP_201_CREATED)

    def partial_update(self, request, *args, **kwargs):
        s = SeasonSerializer(self.get_object(), data=request.data, partial=True)
        s.is_valid(raise_exception=True)
        season = s.save()
        return Response({'data': SeasonSerializer(season).data, 'error': None})

    def destroy(self, request, *args, **kwargs):
        self.get_object().delete()
        return Response({'data': None, 'error': None}, status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['get'], url_path='episodes')
    def episodes(self, request, pk=None):
        season = self.get_object()
        episodes = season.episodes.all().select_related('primary_show')
        return Response({'data': EpisodeSerializer(episodes, many=True).data, 'error': None})
