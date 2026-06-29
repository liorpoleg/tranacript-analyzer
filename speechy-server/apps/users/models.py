import uuid
import secrets
import hashlib
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin


class Organization(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    max_episodes = models.PositiveIntegerField(default=100)
    max_users = models.PositiveIntegerField(default=20)
    max_storage_mb = models.PositiveIntegerField(default=10000)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class Role(models.TextChoices):
    ADMIN = 'admin', 'Admin'
    MANAGER = 'manager', 'Manager'
    ANALYST = 'analyst', 'Analyst'


class UserManager(BaseUserManager):
    def create_user(self, username, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', Role.ADMIN)
        if not extra_fields.get('organization'):
            org, _ = Organization.objects.get_or_create(
                slug='default', defaults={'name': 'Default', 'slug': 'default'}
            )
            extra_fields['organization'] = org
        return self.create_user(username, email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name='users'
    )
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.ANALYST)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']

    objects = UserManager()

    class Meta:
        ordering = ['username']

    def __str__(self):
        return self.username


class APIKey(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='api_keys')
    name = models.CharField(max_length=255)
    key_prefix = models.CharField(max_length=8, db_index=True)
    key_hash = models.CharField(max_length=64)
    created_at = models.DateTimeField(auto_now_add=True)
    revoked_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.name} ({self.key_prefix}...)'

    @property
    def is_active(self):
        return self.revoked_at is None

    @staticmethod
    def generate():
        raw = secrets.token_urlsafe(32)
        prefix = raw[:8]
        key_hash = hashlib.sha256(raw.encode()).hexdigest()
        return raw, prefix, key_hash


class UserSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
    refresh_token_jti = models.CharField(max_length=255, db_index=True, unique=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    login_at = models.DateTimeField(auto_now_add=True)
    last_active_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True, db_index=True)

    class Meta:
        ordering = ['-login_at']

    def __str__(self):
        return f'{self.user.username} @ {self.ip_address}'


class AuditLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_logs'
    )
    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name='audit_logs', null=True, blank=True
    )
    action = models.CharField(max_length=100, db_index=True)
    resource_type = models.CharField(max_length=100, blank=True, db_index=True)
    resource_id = models.CharField(max_length=100, blank=True)
    details = models.JSONField(default=dict)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f'{self.action} by {self.user} at {self.timestamp}'
