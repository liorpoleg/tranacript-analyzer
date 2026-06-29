import uuid
from django.db import models
from django.contrib.postgres.fields import ArrayField
from apps.shows.models import Show, Season
from apps.users.models import User


class Language(models.TextChoices):
    HEBREW = 'he', 'Hebrew'
    ENGLISH = 'en', 'English'


class Episode(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    primary_show = models.ForeignKey(Show, on_delete=models.CASCADE, related_name='episodes')
    seasons = models.ManyToManyField(Season, through='EpisodeSeason', related_name='episodes')
    episode_number = models.CharField(max_length=20)
    title = models.CharField(max_length=500)
    air_date = models.DateField(null=True, blank=True)
    featured_characters = ArrayField(
        models.CharField(max_length=200), default=list, blank=True
    )
    original_language = models.CharField(max_length=10, default='auto')
    raw_excel_path = models.CharField(max_length=1000, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['primary_show', 'episode_number']

    def __str__(self):
        return f'{self.primary_show.name} — {self.episode_number}: {self.title}'


class EpisodeSeason(models.Model):
    episode = models.ForeignKey(Episode, on_delete=models.CASCADE)
    season = models.ForeignKey(Season, on_delete=models.CASCADE)
    episode_order = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        unique_together = ['episode', 'season']
        ordering = ['season', 'episode_order']


class EpisodeTranslation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    episode = models.ForeignKey(Episode, on_delete=models.CASCADE, related_name='translations')
    language = models.CharField(max_length=5, choices=Language.choices)
    # Each item: {row_id, original_text, translated_text, row_summary}
    translated_rows = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['episode', 'language']
        ordering = ['episode', 'language']

    def __str__(self):
        return f'{self.episode} — {self.language}'


class EpisodeSummary(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    episode = models.OneToOneField(Episode, on_delete=models.CASCADE, related_name='summary')
    summary_text = models.TextField()
    key_topics = ArrayField(models.CharField(max_length=300), default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'Summary — {self.episode}'


class ContextualSummary(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    episode = models.ForeignKey(
        Episode, on_delete=models.CASCADE, related_name='contextual_summaries'
    )
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='contextual_summaries'
    )
    # Snapshot of questions text at generation time; used to detect staleness
    questions_snapshot = models.JSONField(default=list)
    summary_text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Contextual — {self.episode} for {self.user}'
