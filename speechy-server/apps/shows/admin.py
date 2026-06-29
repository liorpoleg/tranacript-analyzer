from django.contrib import admin
from .models import Show, Season


@admin.register(Show)
class ShowAdmin(admin.ModelAdmin):
    list_display = ['name', 'organization', 'is_active', 'created_at']
    list_filter = ['organization', 'is_active']
    search_fields = ['name']


@admin.register(Season)
class SeasonAdmin(admin.ModelAdmin):
    list_display = ['__str__', 'show', 'number', 'created_at']
    list_filter = ['show']
