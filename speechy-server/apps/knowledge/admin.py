from django.contrib import admin
from .models import KnowledgeFile, Question


@admin.register(KnowledgeFile)
class KnowledgeFileAdmin(admin.ModelAdmin):
    list_display = ['original_filename', 'show', 'created_at']
    list_filter = ['show']


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ['text', 'show', 'order_index', 'is_active']
    list_filter = ['show', 'is_active']
