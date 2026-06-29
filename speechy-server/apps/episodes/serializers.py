from rest_framework import serializers
from .models import Episode, EpisodeSeason, EpisodeTranslation, EpisodeSummary, ContextualSummary


class EpisodeSeasonSerializer(serializers.ModelSerializer):
    season_number = serializers.IntegerField(source='season.number', read_only=True)
    show_name = serializers.CharField(source='season.show.name', read_only=True)

    class Meta:
        model = EpisodeSeason
        fields = ['season', 'season_number', 'show_name', 'episode_order']


class EpisodeSerializer(serializers.ModelSerializer):
    primary_show_name = serializers.CharField(source='primary_show.name', read_only=True)
    season_memberships = EpisodeSeasonSerializer(
        source='episodeseason_set', many=True, read_only=True
    )
    has_translation_he = serializers.SerializerMethodField()
    has_translation_en = serializers.SerializerMethodField()
    has_summary = serializers.SerializerMethodField()

    class Meta:
        model = Episode
        fields = [
            'id', 'primary_show', 'primary_show_name', 'episode_number', 'title',
            'air_date', 'featured_characters', 'original_language', 'raw_excel_path',
            'season_memberships', 'has_translation_he', 'has_translation_en', 'has_summary',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'raw_excel_path', 'created_at', 'updated_at']

    def get_has_translation_he(self, obj):
        return obj.translations.filter(language='he').exists()

    def get_has_translation_en(self, obj):
        return obj.translations.filter(language='en').exists()

    def get_has_summary(self, obj):
        return hasattr(obj, 'summary')


class EpisodeTranslationSerializer(serializers.ModelSerializer):
    class Meta:
        model = EpisodeTranslation
        fields = ['id', 'episode', 'language', 'translated_rows', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class EpisodeSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = EpisodeSummary
        fields = ['id', 'episode', 'summary_text', 'key_topics', 'created_at', 'updated_at']
        read_only_fields = fields


class ContextualSummarySerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = ContextualSummary
        fields = ['id', 'episode', 'user', 'username', 'questions_snapshot', 'summary_text', 'created_at']
        read_only_fields = fields
