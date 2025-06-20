import React, { useState } from 'react';
import Logo from './Logo';
import FilterPills from './FilterPills';
import SearchBar from './SearchBar';
import ChatView from './ChatView'; // Import ChatView
import LiveAssistantButton from './LiveAssistantButton'; // Import the new component

function MainContent() {
  const [uiMode, setUiMode] = useState('search'); // 'search' or 'chat'
  const [chatMessages, setChatMessages] = useState([]);

  const handleSearchSubmit = async (query) => {
    const newUserMessage = { type: 'user', text: query };
    let messagesForApi;

    // Construct messagesForApi based on current state and new message
    if (uiMode !== 'chat') {
      setUiMode('chat'); // Switch to chat mode on the first query
      messagesForApi = [newUserMessage];
    } else {
      // Important: Use the current chatMessages state to build the new array for the API
      // setChatMessages is async, so chatMessages variable won't be updated yet in this scope
      messagesForApi = [...chatMessages, newUserMessage];
    }

    // Update the state with the new messages array that includes the user's new message
    setChatMessages(messagesForApi);

    try {
      // Now use 'messagesForApi' in the fetch call
      const response = await fetch('/api/chat/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: messagesForApi }), // MODIFIED LINE
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

      const aiMessage = { type: 'ai', text: data.reply || "No response from AI." };
      // Append AI message to the existing messages (which now include the last user message)
      setChatMessages(prevMessages => [...prevMessages, aiMessage]);

    } catch (error) {
      console.error('Error querying backend:', error);
      const errorMessage = { type: 'ai', text: error.message || "Error: Could not connect to the AI." };
      // Append error message to the existing messages
      setChatMessages(prevMessages => [...prevMessages, errorMessage]);
    }
  };

  return (
    <main className="main-content">
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
      <LiveAssistantButton /> {/* Add the LiveAssistantButton here */}
    </main>
  );
}

export default MainContent;
