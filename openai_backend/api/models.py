from django.db import models
from django.utils import timezone

class Conversation(models.Model):
    user_input = models.TextField()
    gemini_response = models.TextField(blank=True, null=True) # Assuming response can be empty initially
    timestamp = models.DateTimeField(default=timezone.now)
    # Optional: Link to a user if you have user authentication
    # user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)

    def __str__(self):
        return f"Conversation at {self.timestamp.strftime('%Y-%m-%d %H:%M:%S')}"

    class Meta:
        ordering = ['-timestamp']

class Idea(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)
    # Optional: Link to a user
    # user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)

    def __str__(self):
        return self.title

    class Meta:
        ordering = ['-created_at']
