import React, { useState } from 'react';
import Logo from './Logo';
import FilterPills from './FilterPills';
import SearchBar from './SearchBar';
import ChatView from './ChatView'; // Import ChatView

function MainContent() {
  const [uiMode, setUiMode] = useState('search'); // 'search' or 'chat'
  const [chatMessages, setChatMessages] = useState([]);

  const handleSearchSubmit = async (query) => {
    const newUserMessage = { type: 'user', text: query };

    if (uiMode !== 'chat') {
      setUiMode('chat'); // Switch to chat mode on the first query
      setChatMessages([newUserMessage]); // Start new chat with user message
    } else {
      // If already in chat mode, append new user message
      setChatMessages(prevMessages => [...prevMessages, newUserMessage]);
    }

    try {
      const response = await fetch('/api/gemini-query/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query }),
      });

      if (!response.ok) {
        // Try to get error message from backend if available
        let errorText = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorText = errorData.error || errorData.message || errorText;
        } catch (e) {
          // response was not JSON, use default errorText
        }
        throw new Error(errorText);
      }
      const data = await response.json();

      const aiMessage = { type: 'ai', text: data.gemini_response || "No response from AI." };
      setChatMessages(prevMessages => [...prevMessages, aiMessage]);

    } catch (error) {
      console.error('Error querying backend:', error);
      const errorMessage = { type: 'ai', text: error.message || "Error: Could not connect to the AI." };
      setChatMessages(prevMessages => [...prevMessages, errorMessage]);
    }
  };

  return (
    <main className={`main-content ${uiMode === 'chat' ? 'chat-mode-active' : ''}`}>
      <div className={`center-container ${uiMode === 'chat' ? 'chat-layout' : ''}`}>
        {uiMode === 'search' && (
          <>
            <Logo />
            <FilterPills />
          </>
        )}

        {/* ChatView is rendered above SearchBar in chat mode */}
        {uiMode === 'chat' && (
          <ChatView messages={chatMessages} />
        )}

        <SearchBar
          handleSearchSubmit={handleSearchSubmit}
          placeholder={uiMode === 'search' ? "What is the benefit of using an AI-powered design expert?" : "Type your message..."}
        />
      </div>
    </main>
  );
}

export default MainContent;
