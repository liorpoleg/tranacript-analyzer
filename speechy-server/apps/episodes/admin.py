from django.contrib import admin
from .models import Episode, EpisodeSeason, EpisodeTranslation, EpisodeSummary, ContextualSummary


@admin.register(Episode)
class EpisodeAdmin(admin.ModelAdmin):
    list_display = ['title', 'episode_number', 'primary_show', 'air_date', 'created_at']
    list_filter = ['primary_show']
    search_fields = ['title', 'episode_number']


@admin.register(EpisodeTranslation)
class EpisodeTranslationAdmin(admin.ModelAdmin):
    list_display = ['episode', 'language', 'created_at']
    list_filter = ['language']


@admin.register(EpisodeSummary)
class EpisodeSummaryAdmin(admin.ModelAdmin):
    list_display = ['episode', 'created_at']


@admin.register(ContextualSummary)
class ContextualSummaryAdmin(admin.ModelAdmin):
    list_display = ['episode', 'user', 'created_at']
    list_filter = ['user']
