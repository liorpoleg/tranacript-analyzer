import uuid
from django.db import models
from django.contrib.postgres.fields import ArrayField
from apps.shows.models import Show
from apps.users.models import User


class Character(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # character_ref: show-defined ID (e.g. 'c1', 'c2'); same ref = same character concept
    character_ref = models.CharField(max_length=100, db_index=True)
    name = models.CharField(max_length=255)
    actor = models.CharField(max_length=255, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['character_ref', 'actor'],
                name='unique_character_ref_actor',
            )
        ]
        ordering = ['name']

    def __str__(self):
        return f'{self.name} ({self.actor})' if self.actor else self.name


class TranscriptLanguage(models.TextChoices):
    ORIGIN = 'origin', 'Origin'
    HEBREW = 'hebrew', 'Hebrew'
    ENGLISH = 'english', 'English'


class Episode(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # The top-level show this episode is filed under (for display) — always a root Show
    # (no parent), regardless of which node in the tree it was actually uploaded to.
    primary_show = models.ForeignKey(Show, on_delete=models.CASCADE, related_name='episodes')
    # Cross-listing into any node(s) in the tree (a show, or any nested "season"). Distinct
    # related_name from `primary_show`'s since both now target the same Show model.
    shows = models.ManyToManyField(Show, through='EpisodeShow', related_name='cross_listed_episodes')
    characters = models.ManyToManyField('Character', related_name='episodes', blank=True)
    episode_number = models.CharField(max_length=20, db_index=True)
    title = models.CharField(max_length=500)
    air_date = models.DateField(null=True, blank=True)
    original_language = models.CharField(max_length=10, default='auto')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['primary_show', 'episode_number']

    def __str__(self):
        return f'{self.primary_show.name} — {self.episode_number}: {self.title}'


class EpisodeShow(models.Model):
    episode = models.ForeignKey(Episode, on_delete=models.CASCADE)
    show = models.ForeignKey(Show, on_delete=models.CASCADE)
    episode_order = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        unique_together = ['episode', 'show']
        ordering = ['show', 'episode_order']


class Transcript(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    episode = models.ForeignKey(Episode, on_delete=models.CASCADE, related_name='transcripts')
    language = models.CharField(max_length=10, choices=TranscriptLanguage.choices)
    # Each item: {character_ref, character_name, text}
    rows = models.JSONField(default=list)
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
    brief_summary = models.TextField(blank=True)
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
    questions_snapshot = models.JSONField(default=list)
    summary_text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Contextual — {self.episode} for {self.user}'
