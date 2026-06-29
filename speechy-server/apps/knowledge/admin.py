from django.contrib import admin
from .models import KnowledgeFile, Question


@admin.register(KnowledgeFile)
class KnowledgeFileAdmin(admin.ModelAdmin):
    list_display = ['original_filename', 'show', 'season', 'created_at']
    list_filter = ['show', 'season']


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ['text', 'show', 'season', 'order_index', 'is_active']
    list_filter = ['show', 'season', 'is_active']
