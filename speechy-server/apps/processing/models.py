import uuid
from django.db import models
from apps.episodes.models import Episode
from apps.users.models import User


class JobType(models.TextChoices):
    TRANSLATE = 'translate', 'Translate'
    SUMMARIZE = 'summarize', 'Summarize'
    CONTEXTUAL_SUMMARY = 'contextual_summary', 'Contextual Summary'


class JobStatus(models.TextChoices):
    PENDING = 'pending', 'Pending'
    RUNNING = 'running', 'Running'
    COMPLETED = 'completed', 'Completed'
    FAILED = 'failed', 'Failed'
    STOPPED = 'stopped', 'Stopped'

TERMINAL_STATUSES = {JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.STOPPED}


class ProcessingJob(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    episode = models.ForeignKey(Episode, on_delete=models.CASCADE, related_name='jobs')
    job_type = models.CharField(max_length=30, choices=JobType.choices, db_index=True)
    status = models.CharField(
        max_length=20, choices=JobStatus.choices, default=JobStatus.PENDING, db_index=True
    )
    triggered_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name='triggered_jobs'
    )
    log_lines = models.JSONField(default=list)
    celery_task_id = models.CharField(max_length=255, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.job_type} — {self.episode} [{self.status}]'

    @property
    def duration_seconds(self):
        if self.started_at and self.completed_at:
            return (self.completed_at - self.started_at).total_seconds()
        return None

    def append_log(self, message: str):
        self.log_lines.append(message)
        ProcessingJob.objects.filter(pk=self.pk).update(log_lines=self.log_lines)
