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
        incoming_messages = request.data.get('messages')

        if not incoming_messages or not isinstance(incoming_messages, list):
            return JsonResponse({"error": "No messages list provided or invalid format"}, status=400)

        if not incoming_messages: # Should be caught by above, but good for clarity
             return JsonResponse({"error": "Messages list is empty"}, status=400)

        # Separate the latest message from the history
        # The last message in the list is the current one to be sent
        latest_message_obj = incoming_messages[-1]
        history_messages_objs = incoming_messages[:-1]

        if not isinstance(latest_message_obj, dict) or latest_message_obj.get('type') != 'user':
            return JsonResponse({"error": "Last message must be an object from user"}, status=400)

        user_message_text = latest_message_obj.get('text')
        if user_message_text is None: # Check for None specifically, empty string might be valid
            return JsonResponse({"error": "Latest user message text is missing"}, status=400)

        # Transform history for Gemini API
        transformed_history = []
        for msg in history_messages_objs:
            if not isinstance(msg, dict) or 'type' not in msg or 'text' not in msg:
                # Skip malformed messages in history or return error
                # For now, skip
                continue
            role = "user" if msg.get('type') == 'user' else "model"
            transformed_history.append({
                "role": role,
                "parts": [msg.get('text', '')] # Use get with default for text
            })

        model = genai.GenerativeModel('gemini-1.5-flash')
        chat_session = model.start_chat(history=transformed_history) # Use transformed history
        response = chat_session.send_message(user_message_text) # Send only the new message text

        return JsonResponse({"reply": response.text})
    except Exception as e:
        # Log the full exception for debugging
        # import traceback
        # print(traceback.format_exc()) # Uncomment for detailed server-side logs
        return JsonResponse({"error": str(e)}, status=500)
