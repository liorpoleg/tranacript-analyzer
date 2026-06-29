from rest_framework import serializers
from .models import ProcessingJob


class ProcessingJobSerializer(serializers.ModelSerializer):
    episode_title = serializers.CharField(source='episode.title', read_only=True)
    triggered_by_username = serializers.CharField(source='triggered_by.username', read_only=True, allow_null=True)
    duration_seconds = serializers.FloatField(read_only=True)

    class Meta:
        model = ProcessingJob
        fields = [
            'id', 'episode', 'episode_title', 'job_type', 'status',
            'triggered_by', 'triggered_by_username', 'log_lines',
            'celery_task_id', 'started_at', 'completed_at', 'created_at', 'duration_seconds',
        ]
        read_only_fields = fields
