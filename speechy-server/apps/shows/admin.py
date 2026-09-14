from django.contrib import admin
from .models import Show


@admin.register(Show)
class ShowAdmin(admin.ModelAdmin):
    list_display = ['name', 'parent', 'organization', 'is_active', 'created_at']
    list_filter = ['organization', 'is_active']
    search_fields = ['name']
