import uuid
from django.core.exceptions import ValidationError
from django.db import models
from apps.shows.models import Show, Season


class KnowledgeFile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    show = models.ForeignKey(
        Show, on_delete=models.CASCADE, related_name='knowledge_files', null=True, blank=True
    )
    season = models.ForeignKey(
        Season, on_delete=models.CASCADE, related_name='knowledge_files', null=True, blank=True
    )
    original_filename = models.CharField(max_length=500)
    file_path = models.CharField(max_length=1000)
    content_text = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.original_filename

    def clean(self):
        if not self.show and not self.season:
            raise ValidationError('KnowledgeFile must belong to a show or season.')
        if self.show and self.season:
            raise ValidationError('KnowledgeFile cannot belong to both a show and a season.')

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)


class Question(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    show = models.ForeignKey(
        Show, on_delete=models.CASCADE, related_name='questions', null=True, blank=True
    )
    season = models.ForeignKey(
        Season, on_delete=models.CASCADE, related_name='questions', null=True, blank=True
    )
    text = models.TextField()
    order_index = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order_index', 'created_at']

    def __str__(self):
        return self.text[:80]

    def clean(self):
        if not self.show and not self.season:
            raise ValidationError('Question must belong to a show or season.')
        if self.show and self.season:
            raise ValidationError('Question cannot belong to both a show and a season.')

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)
