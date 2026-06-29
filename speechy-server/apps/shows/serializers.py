from rest_framework import serializers
from .models import Show, Season


class SeasonSerializer(serializers.ModelSerializer):
    episode_count = serializers.SerializerMethodField()

    class Meta:
        model = Season
        fields = ['id', 'show', 'number', 'title', 'episode_count', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_episode_count(self, obj):
        return obj.episodes.count()


class ShowSerializer(serializers.ModelSerializer):
    season_count = serializers.SerializerMethodField()
    episode_count = serializers.SerializerMethodField()
    organization_name = serializers.CharField(source='organization.name', read_only=True)

    class Meta:
        model = Show
        fields = [
            'id', 'name', 'description', 'organization', 'organization_name',
            'is_active', 'season_count', 'episode_count', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'organization', 'created_at', 'updated_at']

    def get_season_count(self, obj):
        return obj.seasons.count()

    def get_episode_count(self, obj):
        return obj.episodes.count()


class ShowDetailSerializer(ShowSerializer):
    seasons = SeasonSerializer(many=True, read_only=True)

    class Meta(ShowSerializer.Meta):
        fields = ShowSerializer.Meta.fields + ['seasons']
