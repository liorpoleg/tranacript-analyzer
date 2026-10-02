import uuid
from django.core.exceptions import ValidationError
from django.db import models
from apps.users.models import Organization


class Show(models.Model):
    """A node in the recursive shows/seasons tree. A 'season' is just a Show whose parent is set."""

    MAX_DEPTH = 10

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='shows')
    parent = models.ForeignKey(
        'self', on_delete=models.CASCADE, null=True, blank=True, related_name='children'
    )
    name = models.CharField(max_length=500)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return self.name

    def clean(self):
        if self.parent_id:
            if self.parent_id == self.id:
                raise ValidationError('A show cannot be its own parent.')
            self.organization_id = self.parent.organization_id
            depth = 1
            node = self.parent
            while node is not None:
                if node.id == self.id:
                    raise ValidationError('A show cannot be its own ancestor.')
                if depth > self.MAX_DEPTH:
                    raise ValidationError(f'Nesting exceeds max depth of {self.MAX_DEPTH}.')
                node = node.parent
                depth += 1

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    @property
    def direct_episode_count(self):
        return self.episodes.count()

    @property
    def direct_children_count(self):
        return self.children.count()

    def get_root(self):
        """Walk up `parent` to the top-level ancestor (returns self if already a root)."""
        node = self
        while node.parent_id:
            node = node.parent
        return node


class ShowRole(models.TextChoices):
    OWNER = 'owner', 'Owner'
    EDITOR = 'editor', 'Editor'
    VIEWER = 'viewer', 'Viewer'


class ShowMembership(models.Model):
    """Per-node membership grant. A node with no rows of its own inherits from
    the nearest ancestor that has any (see apps.shows.permissions) — rows never
    merge across ancestors, the nearest node with any rows wins outright."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    show = models.ForeignKey(Show, on_delete=models.CASCADE, related_name='memberships')
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='show_memberships')
    role = models.CharField(max_length=20, choices=ShowRole.choices, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        'users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='+'
    )

    class Meta:
        unique_together = ['show', 'user']
        ordering = ['created_at']

    def __str__(self):
        return f'{self.user} — {self.role} on {self.show}'
