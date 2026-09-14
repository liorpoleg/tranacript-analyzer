from celery.result import AsyncResult
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import ProcessingJob, JobStatus, TERMINAL_STATUSES
from .serializers import ProcessingJobSerializer
from apps.shows.services import get_recursive_episode_ids


class ProcessingJobViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ProcessingJobSerializer

    def get_queryset(self):
        return ProcessingJob.objects.filter(
            episode__primary_show__organization=self.request.user.organization
        ).select_related('episode', 'triggered_by')

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        episode_id = request.query_params.get('episode')
        show_id = request.query_params.get('show')
        if episode_id:
            qs = qs.filter(episode_id=episode_id)
        if show_id:
            qs = qs.filter(episode_id__in=get_recursive_episode_ids(show_id))
        return Response({'data': ProcessingJobSerializer(qs, many=True).data, 'error': None})

    def retrieve(self, request, *args, **kwargs):
        return Response({'data': ProcessingJobSerializer(self.get_object()).data, 'error': None})

    @action(detail=True, methods=['post'], url_path='stop')
    def stop(self, request, pk=None):
        job = self.get_object()
        if job.status in TERMINAL_STATUSES:
            return Response(
                {'data': None, 'error': {'code': 400, 'message': 'Job is already in a terminal state.'}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if job.celery_task_id:
            AsyncResult(job.celery_task_id).revoke(terminate=True)
        job.status = JobStatus.STOPPED
        job.save(update_fields=['status'])
        job.append_log('Job stopped by user.')
        return Response({'data': ProcessingJobSerializer(job).data, 'error': None})
