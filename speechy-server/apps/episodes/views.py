from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from .models import Episode, EpisodeSummary
from .serializers import (
    EpisodeSerializer, TranscriptSerializer,
    EpisodeSummarySerializer, ContextualSummarySerializer,
)
from .services import get_episodes_for_user, parse_episode_excel, add_episode_to_show
from apps.processing.services import enqueue_job


class EpisodeViewSet(viewsets.ModelViewSet):
    serializer_class = EpisodeSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        return get_episodes_for_user(self.request.user)

    def list(self, request, *args, **kwargs):
        show_id = request.query_params.get('show')
        qs = self.get_queryset()
        if show_id:
            qs = qs.filter(primary_show_id=show_id)
        return Response({'data': EpisodeSerializer(qs, many=True).data, 'error': None})

    def retrieve(self, request, *args, **kwargs):
        return Response({'data': EpisodeSerializer(self.get_object()).data, 'error': None})

    def create(self, request, *args, **kwargs):
        s = EpisodeSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        episode = s.save()
        show_id = request.data.get('show')
        if show_id:
            add_episode_to_show(episode, show_id)
        return Response({'data': EpisodeSerializer(episode).data, 'error': None},
                        status=status.HTTP_201_CREATED)

    def partial_update(self, request, *args, **kwargs):
        s = EpisodeSerializer(self.get_object(), data=request.data, partial=True)
        s.is_valid(raise_exception=True)
        episode = s.save()
        return Response({'data': EpisodeSerializer(episode).data, 'error': None})

    def destroy(self, request, *args, **kwargs):
        self.get_object().delete()
        return Response({'data': None, 'error': None}, status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'], url_path='upload',
            parser_classes=[MultiPartParser, FormParser])
    def upload(self, request, pk=None):
        episode = self.get_object()
        file = request.FILES.get('file')
        if not file:
            return Response(
                {'data': None, 'error': {'code': 400, 'message': 'No file provided.'}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        transcript = parse_episode_excel(episode, file)
        translate_job = enqueue_job(episode, 'translate', request.user)
        summarize_job = enqueue_job(episode, 'summarize', request.user)
        from apps.processing.serializers import ProcessingJobSerializer
        return Response({
            'data': {
                'transcript_id': str(transcript.id),
                'row_count': len(transcript.rows),
                'translate_job': ProcessingJobSerializer(translate_job).data,
                'summarize_job': ProcessingJobSerializer(summarize_job).data,
            },
            'error': None,
        })

    @action(detail=True, methods=['post'], url_path='translate')
    def translate(self, request, pk=None):
        episode = self.get_object()
        job = enqueue_job(episode, 'translate', request.user)
        from apps.processing.serializers import ProcessingJobSerializer
        return Response({'data': ProcessingJobSerializer(job).data, 'error': None},
                        status=status.HTTP_202_ACCEPTED)

    @action(detail=True, methods=['post'], url_path='summarize')
    def summarize(self, request, pk=None):
        episode = self.get_object()
        job = enqueue_job(episode, 'summarize', request.user)
        from apps.processing.serializers import ProcessingJobSerializer
        return Response({'data': ProcessingJobSerializer(job).data, 'error': None},
                        status=status.HTTP_202_ACCEPTED)

    @action(detail=True, methods=['post'], url_path='contextual')
    def contextual(self, request, pk=None):
        episode = self.get_object()
        job = enqueue_job(episode, 'contextual_summary', request.user)
        from apps.processing.serializers import ProcessingJobSerializer
        return Response({'data': ProcessingJobSerializer(job).data, 'error': None},
                        status=status.HTTP_202_ACCEPTED)

    @action(detail=True, methods=['get'], url_path='transcripts')
    def transcripts(self, request, pk=None):
        episode = self.get_object()
        qs = episode.transcripts.all()
        return Response({'data': TranscriptSerializer(qs, many=True).data, 'error': None})

    # Backward-compat alias for any existing clients
    @action(detail=True, methods=['get'], url_path='translations')
    def translations(self, request, pk=None):
        return self.transcripts(request, pk=pk)

    @action(detail=True, methods=['get'], url_path='summary')
    def summary(self, request, pk=None):
        episode = self.get_object()
        try:
            return Response({'data': EpisodeSummarySerializer(episode.summary).data, 'error': None})
        except EpisodeSummary.DoesNotExist:
            return Response({'data': None, 'error': None})

    @action(detail=True, methods=['get'], url_path='contextual-summaries')
    def contextual_summaries(self, request, pk=None):
        episode = self.get_object()
        qs = episode.contextual_summaries.filter(user=request.user)
        return Response({'data': ContextualSummarySerializer(qs, many=True).data, 'error': None})
