from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import IdeaViewSet, ConversationViewSet, gemini_chat # Import gemini_chat

router = DefaultRouter()
router.register(r'ideas', IdeaViewSet, basename='idea')
router.register(r'conversations', ConversationViewSet, basename='conversation')

urlpatterns = [
    path('', include(router.urls)),
    path('chat/', gemini_chat, name='gemini_chat'),
]
