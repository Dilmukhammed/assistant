import os
import datetime # Make sure datetime is imported
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

@api_view(['GET']) # This endpoint can be a GET request as it's just fetching a token
def get_live_api_token_view(request):
    if not gemini_api_key: # Check if API key is configured
        return JsonResponse({"error": "GEMINI_API_KEY not configured"}, status=500)

    try:
        # Initialize client with v1alpha for auth_tokens
        # genai.configure(api_key=gemini_api_key) should have been called already at module level
        client = genai.Client(
            http_options={'api_version': 'v1alpha'}
            # The main API key is used by the client implicitly due to genai.configure()
        )

        now = datetime.datetime.now(tz=datetime.timezone.utc)

        token_config = {
            'uses': 1,
            'expire_time': now + datetime.timedelta(minutes=30),
            'new_session_expire_time': now + datetime.timedelta(minutes=1),
            'http_options': {'api_version': 'v1alpha'} # Added as per user example for the create call
        }

        # Optional: Add live_connect_constraints if needed for more security
        # token_config['live_connect_constraints'] = {
        #     'model': 'gemini-1.5-flash-latest', # Or your specific live model
        #     'config': {
        #         'session_resumption':{}, # Enable session resumption
        #     }
        # }

        ephemeral_token = client.auth_tokens.create(config=token_config)

        if not ephemeral_token or not ephemeral_token.name:
            return JsonResponse({"error": "Failed to create ephemeral token"}, status=500)

        return JsonResponse({"ephemeral_token": ephemeral_token.name})

    except Exception as e:
        # Consider logging the error for server-side debugging
        # import traceback
        # print(traceback.format_exc()) # Uncomment for detailed server-side logs
        return JsonResponse({"error": f"Error creating ephemeral token: {str(e)}"}, status=500)
