import os
import google.generativeai as genai
from django.http import JsonResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response
from dotenv import load_dotenv

from rest_framework import viewsets
from .models import Idea, Conversation # Add Conversation import
from .serializers import IdeaSerializer, ConversationSerializer # Add ConversationSerializer import

class IdeaViewSet(viewsets.ModelViewSet):
    queryset = Idea.objects.all()
    serializer_class = IdeaSerializer

class ConversationViewSet(viewsets.ModelViewSet):
    queryset = Conversation.objects.all()
    serializer_class = ConversationSerializer

# Load environment variables
load_dotenv()
gemini_api_key = os.getenv("GEMINI_API_KEY")
if gemini_api_key:
    genai.configure(api_key=gemini_api_key)
else:
    # This else block is more for debugging during development.
    # In production, you'd likely want to handle this more gracefully,
    # perhaps by raising an error or logging.
    print("GEMINI_API_KEY not found. Please set it in your .env file.")

@api_view(['POST'])
def gemini_chat(request):
    if not gemini_api_key:
        return JsonResponse({"error": "GEMINI_API_KEY not configured"}, status=500)

    try:
        user_message = request.data.get('message')
        if not user_message:
            return JsonResponse({"error": "No message provided"}, status=400)

        model = genai.GenerativeModel('gemini-pro')
        # For chat history, you would typically pass a list of previous messages.
        # Example: history = [{"role": "user", "parts": ["Hello"]}, {"role": "model", "parts": ["Hi there!"]}]
        # For simplicity, this example starts a new chat session on each request.
        # You'll need to implement history management if required.

        chat_session = model.start_chat(history=[]) # Start with empty history for now
        response = chat_session.send_message(user_message)

        return JsonResponse({"reply": response.text})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
