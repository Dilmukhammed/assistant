from rest_framework import serializers
from .models import Idea, Conversation # Add Conversation import

class IdeaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Idea
        fields = ['id', 'title', 'description', 'created_at']
        read_only_fields = ['created_at']

class ConversationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Conversation
        fields = ['id', 'user_input', 'gemini_response', 'timestamp']
        read_only_fields = ['timestamp']
