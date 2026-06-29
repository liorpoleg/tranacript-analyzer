import uuid
from django.db import models
from apps.users.models import Organization


class Show(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='shows')
    name = models.CharField(max_length=500)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name

    @property
    def episode_count(self):
        return self.episodes.count()

    @property
    def season_count(self):
        return self.seasons.count()


class Season(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    show = models.ForeignKey(Show, on_delete=models.CASCADE, related_name='seasons')
    number = models.PositiveIntegerField()
    title = models.CharField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['show', 'number']
        ordering = ['show', 'number']

    def __str__(self):
        return f'{self.show.name} — Season {self.number}'
