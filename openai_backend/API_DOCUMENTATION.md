# API Documentation for OpenAI Concept Backend

This document outlines the available API endpoints for the Django backend.

## Base URL

All API endpoints are prefixed with `/api/`.

## Endpoints

### Ideas

-   **`GET /api/ideas/`**
    -   Description: Retrieve a list of all ideas.
    -   Response: Array of Idea objects.
-   **`POST /api/ideas/`**
    -   Description: Create a new idea.
    -   Request Body:
        ```json
        {
            "title": "string",
            "description": "string"
        }
        ```
    -   Response: The created Idea object.
-   **`GET /api/ideas/{id}/`**
    -   Description: Retrieve a specific idea by its ID.
    -   Response: The Idea object.
-   **`PUT /api/ideas/{id}/`**
    -   Description: Update a specific idea by its ID.
    -   Request Body: (similar to POST)
    -   Response: The updated Idea object.
-   **`PATCH /api/ideas/{id}/`**
    -   Description: Partially update a specific idea by its ID.
    -   Request Body: (similar to POST, fields are optional)
    -   Response: The updated Idea object.
-   **`DELETE /api/ideas/{id}/`**
    -   Description: Delete a specific idea by its ID.
    -   Response: HTTP 204 No Content.

### Conversations

-   **`GET /api/conversations/`**
    -   Description: Retrieve a list of all conversation entries.
    -   Response: Array of Conversation objects.
-   **`POST /api/conversations/`**
    -   Description: Create a new conversation entry.
    -   Request Body:
        ```json
        {
            "user_input": "string",
            "gemini_response": "string (optional)"
        }
        ```
    -   Response: The created Conversation object.
-   **`GET /api/conversations/{id}/`**
    -   Description: Retrieve a specific conversation entry by ID.
    -   Response: The Conversation object.
-   **`PUT /api/conversations/{id}/`**
    -   Description: Update a specific conversation entry.
    -   Request Body: (similar to POST)
    -   Response: The updated Conversation object.
-   **`PATCH /api/conversations/{id}/`**
    -   Description: Partially update a specific conversation entry.
    -   Request Body: (similar to POST, fields are optional)
    -   Response: The updated Conversation object.
-   **`DELETE /api/conversations/{id}/`**
    -   Description: Delete a specific conversation entry.
    -   Response: HTTP 204 No Content.

### Gemini API Placeholder

-   **`POST /api/gemini-query/`**
    -   Description: Placeholder endpoint for querying the Gemini API. This currently returns a mocked response and does not actually call any external API.
    -   Request Body:
        ```json
        {
            "query": "string"
        }
        ```
    -   Response:
        ```json
        {
            "user_query": "string (your input)",
            "gemini_response": "string (mocked response)",
            "message": "This is a placeholder response. Gemini API not actually called."
        }
        ```

## Django Admin

The `Idea` and `Conversation` models are registered with the Django admin interface, available at `/admin/`. You will need to create a superuser account (`python manage.py createsuperuser`) to access it.

## Next Steps

1.  **Full Gemini API Integration:** Replace the placeholder in `GeminiQueryView` with actual calls to the Gemini API SDK, including API key management.
2.  **Frontend Integration:** Connect the React frontend's search bar to the `/api/gemini-query/` endpoint. Display conversation history. Allow creation/viewing of Ideas.
3.  **User Authentication:** Implement user accounts and associate Ideas and Conversations with specific users.
4.  **Error Handling & Validation:** Enhance error handling and input validation across all API endpoints.
5.  **Testing:** Write unit and integration tests for the API.
6.  **Deployment:** Configure the Django application for production deployment.
```
