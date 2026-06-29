from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import Organization, User, APIKey, UserSession, AuditLog


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'max_episodes', 'max_users', 'created_at']
    search_fields = ['name', 'slug']


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'organization', 'role', 'is_active']
    list_filter = ['role', 'is_active', 'organization']
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal', {'fields': ('email',)}),
        ('Organization', {'fields': ('organization', 'role')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
    )
    add_fieldsets = (
        (None, {'fields': ('username', 'email', 'password1', 'password2', 'organization', 'role')}),
    )
    search_fields = ['username', 'email']
    ordering = ['username']


@admin.register(APIKey)
class APIKeyAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'key_prefix', 'is_active', 'created_at']
    list_filter = ['user']


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['action', 'user', 'resource_type', 'resource_id', 'timestamp']
    list_filter = ['action', 'resource_type']
    readonly_fields = ['id', 'timestamp']
