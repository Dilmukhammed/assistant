import React, { useState, useRef, useEffect } from 'react';
import { ReactComponent as SearchIcon } from '../assets/search-icon.svg';
// import { ReactComponent as MicIcon } from '../assets/mic-icon.svg'; // Old icon
import { ReactComponent as NewMicIcon } from '../assets/new-mic-icon.svg'; // New mic icon
import { ReactComponent as PaperPlaneIcon } from '../assets/paper-plane-icon.svg'; // Send icon

function SearchBar(props) { // Props will now include handleSearchSubmit
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [processingStatus, setProcessingStatus] = useState('idle'); // 'idle', 'recording', 'sending', 'success', 'error'
  const [transcribedText, setTranscribedText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };

  const handleSubmit = () => { // No longer async, as fetch is removed
    if (inputValue.trim() === '') {
      return; // Don't submit empty queries
    }

    if (props.handleSearchSubmit && typeof props.handleSearchSubmit === 'function') {
      props.handleSearchSubmit(inputValue); // Pass the query up to MainContent
    } else {
      console.warn('SearchBar: handleSearchSubmit prop is not a function or not provided.');
    }

    setInputValue(''); // Clear the input field after submission
  };

  const handleMicClick = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop(); // This will trigger 'onstop'
      }
      // setIsRecording will be set to false in onstop or if already not recording
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];
        setTranscribedText('');
        setErrorMessage('');
        setProcessingStatus('recording');
        setIsRecording(true);

        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorderRef.current.onstop = () => {
          setIsRecording(false);
          setProcessingStatus('sending');
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          console.log("Audio Blob URL:", URL.createObjectURL(audioBlob)); // Log blob URL

          // Simulate API Call
          setTimeout(() => {
            // Simulate 50/50 success/error
            if (Math.random() > 0.5) {
              const simulatedText = "This is a simulated transcription.";
              setProcessingStatus('success');
              setTranscribedText(simulatedText);
              setInputValue(simulatedText); // Update search bar input
              console.log('Simulated API Success: Transcription received.');
            } else {
              setProcessingStatus('error');
              setErrorMessage('Simulated error: Failed to process audio.');
              console.error('Simulated API Error.');
            }
            audioChunksRef.current = [];
          }, 2000);
        };

        mediaRecorderRef.current.start();
      } catch (error) {
        console.error("Error accessing microphone:", error);
        setErrorMessage("Microphone access denied or microphone not found.");
        setProcessingStatus('error');
        setIsRecording(false);
      }
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSubmit();
    }
  };

  // useEffect for cleanup
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      // Reset states on unmount if in a transient state
      if (['recording', 'sending'].includes(processingStatus)) {
        setProcessingStatus('idle');
        setIsRecording(false);
      }
    };
  }, [processingStatus]); // Add processingStatus to dependency array

  return (
    <div className="search-bar-container"> {/* Added a container for layout */}
      <div className="search-bar">
        <div className="search-icon">
          <SearchIcon />
        </div>
        <input
          type="text"
          placeholder={props.placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          disabled={processingStatus === 'sending'} // Disable input while sending
        />
        <div className={`mic-icon ${isRecording ? 'recording' : ''}`} onClick={handleMicClick}>
          <NewMicIcon />
        </div>
        <div className="send-icon" onClick={handleSubmit}>
          <PaperPlaneIcon />
        </div>
      </div>
      <div className="status-message">
        {processingStatus === 'sending' && <p>Sending audio...</p>}
        {processingStatus === 'error' && <p style={{ color: 'red' }}>{errorMessage}</p>}
        {/* Transcribed text is shown in the input field */}
      </div>
    </div>
  );
}

export default SearchBar;
