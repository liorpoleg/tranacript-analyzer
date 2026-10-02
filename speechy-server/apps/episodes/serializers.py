from rest_framework import serializers
from .models import Episode, EpisodeShow, Transcript, EpisodeSummary, ContextualSummary, Character


class CharacterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Character
        fields = ['id', 'character_ref', 'name', 'actor']
        read_only_fields = ['id']


class EpisodeShowSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='show.name', read_only=True)
    parent_name = serializers.CharField(source='show.parent.name', read_only=True, default=None)

    class Meta:
        model = EpisodeShow
        fields = ['show', 'name', 'parent_name', 'episode_order']


class EpisodeSerializer(serializers.ModelSerializer):
    primary_show_name = serializers.CharField(source='primary_show.name', read_only=True)
    show_memberships = EpisodeShowSerializer(
        source='episodeshow_set', many=True, read_only=True
    )
    characters = CharacterSerializer(many=True, read_only=True)
    has_origin_transcript = serializers.SerializerMethodField()
    has_translation_he = serializers.SerializerMethodField()
    has_translation_en = serializers.SerializerMethodField()
    has_summary = serializers.SerializerMethodField()
    brief_summary = serializers.SerializerMethodField()
    my_role = serializers.SerializerMethodField()

    class Meta:
        model = Episode
        fields = [
            'id', 'primary_show', 'primary_show_name', 'episode_number', 'title',
            'air_date', 'original_language', 'characters',
            'show_memberships', 'has_origin_transcript',
            'has_translation_he', 'has_translation_en', 'has_summary', 'brief_summary',
            'my_role', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_my_role(self, obj):
        request = self.context.get('request')
        if request is None:
            return None
        from apps.shows.permissions import get_episode_effective_role
        return get_episode_effective_role(request.user, obj)

    def get_has_origin_transcript(self, obj):
        return obj.transcripts.filter(language='origin').exists()

    def get_has_translation_he(self, obj):
        return obj.transcripts.filter(language='hebrew').exists()

    def get_has_translation_en(self, obj):
        return obj.transcripts.filter(language='english').exists()

    def get_has_summary(self, obj):
        return hasattr(obj, 'summary')

    def get_brief_summary(self, obj):
        return obj.summary.brief_summary if hasattr(obj, 'summary') else ''


class TranscriptSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transcript
        fields = ['id', 'episode', 'language', 'rows', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class EpisodeSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = EpisodeSummary
        fields = ['id', 'episode', 'summary_text', 'brief_summary', 'key_topics', 'created_at', 'updated_at']
        read_only_fields = fields


class ContextualSummarySerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = ContextualSummary
        fields = ['id', 'episode', 'user', 'username', 'questions_snapshot', 'summary_text', 'created_at']
        read_only_fields = fields
