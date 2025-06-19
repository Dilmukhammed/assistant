from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import IdeaViewSet, ConversationViewSet, GeminiQueryView # Import GeminiQueryView

router = DefaultRouter()
router.register(r'ideas', IdeaViewSet, basename='idea')
router.register(r'conversations', ConversationViewSet, basename='conversation')

urlpatterns = [
    path('', include(router.urls)),
    path('gemini-query/', GeminiQueryView.as_view(), name='gemini-query'),
]
