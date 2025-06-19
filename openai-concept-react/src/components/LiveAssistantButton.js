import React, { useState, useEffect, useRef } from 'react';
import LiveApiService from '../services/liveApiService';
// Placeholder for a proper icon, using text for now.

function LiveAssistantButton() {
  const [isLiveActive, setIsLiveActive] = useState(false); // Overall session active
  const [isListening, setIsListening] = useState(false); // Mic is open and sending
  const [isSpeaking, setIsSpeaking] = useState(false); // Gemini is sending audio back
  const [transcript, setTranscript] = useState(''); // Live transcript
  const [statusMessage, setStatusMessage] = useState('Click to start live assistant');

  const audioContextRef = useRef(null);
  const audioStreamRef = useRef(null);
  const audioProcessorNodeRef = useRef(null);
  const audioSourceNodeRef = useRef(null);

  const playAudio = async (audioDataArrayBuffer) => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        // Re-initialize if closed or not existing, though ideally context persists while component is mounted and active.
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const audioContext = audioContextRef.current;
    try {
        const audioBuffer = await audioContext.decodeAudioData(audioDataArrayBuffer);
        const sourceNode = audioContext.createBufferSource();
        sourceNode.buffer = audioBuffer;
        sourceNode.connect(audioContext.destination);
        sourceNode.onended = () => {
            setIsSpeaking(false); // Reset speaking state when audio finishes
        };
        sourceNode.start();
    } catch (e) {
        console.error("Error playing audio:", e);
        setIsSpeaking(false);
        setStatusMessage("Error playing response audio.");
    }
  };

  const startMicrophone = async () => {
    if (isListening) return;

    try {
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      }
      const audioContext = audioContextRef.current;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 16000 } });
      audioStreamRef.current = stream;
      audioSourceNodeRef.current = audioContext.createMediaStreamSource(stream);

      const bufferSize = 4096;
      audioProcessorNodeRef.current = audioContext.createScriptProcessor(bufferSize, 1, 1);

      audioProcessorNodeRef.current.onaudioprocess = (event) => {
        if (!isLiveActive || !LiveApiService.chatSession || LiveApiService.chatSession.isClosed) { // Check isClosed
            if(audioProcessorNodeRef.current) audioProcessorNodeRef.current.onaudioprocess = null; // Stop processing if session died
            return;
        }

        const inputData = event.inputBuffer.getChannelData(0);
        // Assuming LiveApiService.sendAudio can handle Float32Array or the SDK does.
        // A copy is sent to avoid issues if the underlying buffer is reused.
        LiveApiService.sendAudio(inputData.slice());
      };

      audioSourceNodeRef.current.connect(audioProcessorNodeRef.current);
      // DO NOT connect audioProcessorNodeRef.current to audioContext.destination here to prevent echo.
      // The ScriptProcessorNode processes audio; it doesn't need to output to speakers for this use case.
      // If it was previously connected and needs explicit disconnection:
      // audioProcessorNodeRef.current.disconnect(audioContext.destination);


      setIsListening(true);
      setStatusMessage('Listening...');
    } catch (error) {
      console.error("Error starting microphone:", error);
      setStatusMessage(`Mic error: ${error.message}`);
      setIsListening(false);
      // Potentially call stopLiveSession or similar cleanup if mic fails critically
      if(isLiveActive) handleToggleLiveSession(); // Attempt to stop full session if mic fails
    }
  };

  const stopMicrophone = () => {
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }
    if (audioSourceNodeRef.current && audioProcessorNodeRef.current) { // Check both before disconnecting
        try {
            audioSourceNodeRef.current.disconnect(audioProcessorNodeRef.current);
        } catch(e) { console.warn("Error disconnecting source from processor:", e); }
        audioSourceNodeRef.current = null;
    }
    if (audioProcessorNodeRef.current) {
        try {
            // Disconnect from any connected nodes (should be none if not connected to destination)
            audioProcessorNodeRef.current.disconnect();
        } catch(e) { console.warn("Error disconnecting processor:", e); }
        audioProcessorNodeRef.current.onaudioprocess = null;
        audioProcessorNodeRef.current = null;
    }
    setIsListening(false);
    // setStatusMessage('Microphone stopped.'); // Or let higher level status take precedence
  };

  const handleToggleLiveSession = async () => {
    if (isLiveActive) {
      LiveApiService.closeSession(); // This will trigger onStateChange
      stopMicrophone();
      // setIsLiveActive(false); // onStateChange 'disconnected_live_api' handles this
      // setStatusMessage('Live assistant stopped. Click to start.'); // onStateChange handles this
      setTranscript('');
    } else {
      setIsLiveActive(true); // Optimistic UI update
      setStatusMessage('Initializing...');
      setTranscript('');

      const callbacks = {
          onMessage: (text) => setTranscript(prev => prev + text + '\n'),
          onAudio: (audioData) => {
              setIsSpeaking(true);
              playAudio(audioData);
          },
          onError: (error) => {
              setStatusMessage(`Error: ${error}`);
              console.error("Live Assistant Error Callback:", error);
              setIsLiveActive(false);
              setIsListening(false);
              stopMicrophone();
              // LiveApiService.closeSession(); // Service might do this internally on error
          },
          onStateChange: (state) => {
              setStatusMessage(`Status: ${state}`);
              if (state === 'error' || state === 'disconnected_live_api') {
                  setIsLiveActive(false);
                  setIsListening(false);
                  stopMicrophone();
              } else if (state === 'connected_live_api') {
                  startMicrophone();
              }
          }
      };

      const connected = await LiveApiService.initializeAndConnect(callbacks);
      if (!connected) { // If initializeAndConnect itself fails before state changes can occur
        setIsLiveActive(false);
        setStatusMessage('Failed to connect. Click to retry.');
        // Ensure callbacks are cleared or service is reset if needed
      }
    }
  };

  // Effect for cleanup on unmount
  useEffect(() => {
    return () => {
      LiveApiService.closeSession();
      stopMicrophone(); // Ensure microphone is stopped
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(e => console.warn("Error closing AudioContext:", e));
      }
    };
  }, []); // Empty dependency array: setup and cleanup once per component lifecycle.

  // Determine button text based on state
  let buttonText = '▶️ Start Live Assistant';
  if (isLiveActive) {
    if (isListening) {
      buttonText = '🎙️ Listening... (Stop)';
    } else if (statusMessage === 'Status: connecting_live_api' || statusMessage === 'Initializing...' || statusMessage === 'Status: fetching_token' || statusMessage === 'Status: initializing_gemini') {
      buttonText = '🔵 Connecting...';
    }
    else {
      buttonText = '🔵 Active (Disconnect)';
    }
  }
  const isConnecting = statusMessage === 'Initializing...' || statusMessage === 'Status: fetching_token' || statusMessage === 'Status: initializing_gemini' || statusMessage === 'Status: connecting_live_api';


  return (
    <div className="live-assistant-container"> {/* Removed inline styles, will be handled by App.css */}
      <button
        onClick={handleToggleLiveSession}
        className={`live-assistant-toggle-button ${isLiveActive ? 'active' : ''} ${isListening ? 'listening' : ''} ${statusMessage.toLowerCase().includes('error') ? 'error-state' : ''}`}
        title={statusMessage} // Tooltip for detailed status
        disabled={isConnecting} // Disable button while connecting
      >
        {buttonText}
      </button>
      <div className="live-status-indicators">
        {/* More specific status indicators */}
        {isLiveActive && !isListening && !isSpeaking && !statusMessage.toLowerCase().includes('error') && !isConnecting && <span className="status-text">Connected & Idle</span>}
        {isSpeaking && <span className="speaking-indicator"><em>Assistant is speaking...</em></span>}
        {statusMessage.toLowerCase().includes('error') && <span className="error-message">{statusMessage}</span>}
        {!isLiveActive && !statusMessage.toLowerCase().includes('error') && !isConnecting && <span className="status-text">Idle. Click to start.</span>}
        {isConnecting && <span className="status-text">{statusMessage}</span>} {/* Show detailed connecting status */}

      </div>
      {transcript && (
        <div className="live-transcript-area">
          <strong>Transcript:</strong><br />
          {transcript}
        </div>
      )}
    </div>
  );
}

export default LiveAssistantButton;
