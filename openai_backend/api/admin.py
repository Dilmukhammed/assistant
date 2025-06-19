from django.contrib import admin
from .models import Conversation, Idea

@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ('id', 'user_input_summary', 'gemini_response_summary', 'timestamp')
    list_filter = ('timestamp',)
    search_fields = ('user_input', 'gemini_response')

    def user_input_summary(self, obj):
        return (obj.user_input[:75] + '...') if len(obj.user_input) > 75 else obj.user_input
    user_input_summary.short_description = 'User Input'

    def gemini_response_summary(self, obj):
        if obj.gemini_response:
            return (obj.gemini_response[:75] + '...') if len(obj.gemini_response) > 75 else obj.gemini_response
        return None
    gemini_response_summary.short_description = 'Gemini Response'

@admin.register(Idea)
class IdeaAdmin(admin.ModelAdmin):
    list_display = ('title', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('title', 'description')
