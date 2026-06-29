from django.contrib import admin
from .models import ProcessingJob


@admin.register(ProcessingJob)
class ProcessingJobAdmin(admin.ModelAdmin):
    list_display = ['id', 'episode', 'job_type', 'status', 'triggered_by', 'created_at']
    list_filter = ['job_type', 'status']
    readonly_fields = ['id', 'created_at', 'started_at', 'completed_at', 'celery_task_id']
