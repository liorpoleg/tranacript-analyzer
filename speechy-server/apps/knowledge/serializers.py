from rest_framework import serializers
from .models import KnowledgeFile, Question


class KnowledgeFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = KnowledgeFile
        fields = ['id', 'show', 'season', 'original_filename', 'file_path', 'created_at']
        read_only_fields = ['id', 'file_path', 'created_at']


class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ['id', 'show', 'season', 'text', 'order_index', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']
