from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import IdeaViewSet, ConversationViewSet, gemini_chat, get_live_api_token_view # Add get_live_api_token_view

router = DefaultRouter()
router.register(r'ideas', IdeaViewSet, basename='idea')
router.register(r'conversations', ConversationViewSet, basename='conversation')

urlpatterns = [
    path('', include(router.urls)),
    path('chat/', gemini_chat, name='gemini_chat'),
    path('get_live_api_token/', get_live_api_token_view, name='get_live_api_token'), # New endpoint
]
