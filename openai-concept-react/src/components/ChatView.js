// src/components/ChatView.js
import React from 'react';

function ChatView({ messages }) {
  if (!messages || messages.length === 0) {
    return null; // Or some placeholder like "No messages yet"
  }

  return (
    <div className="chat-view">
      {messages.map((msg, index) => (
        <div key={index} className={`chat-message ${msg.type}`}>
          <p>{msg.text}</p>
        </div>
      ))}
    </div>
  );
}

export default ChatView;
