// openai-concept-react/src/services/liveApiService.js

import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai';
// Modality might be needed later for response_modalities, if not just text.
// import { Modality } from '@google/genai';

const LiveApiService = {
  googleAI: null,
  chatSession: null,

  // --- Configuration ---
  MODEL_NAME: "gemini-2.5-flash-preview-native-audio-dialog",
  // API_KEY will be the ephemeral token, fetched dynamically

  // --- Callbacks ---
  onMessageCallback: null, // For text messages, transcripts
  onAudioCallback: null,   // For audio data from Gemini
  onErrorCallback: null,   // For errors during the session
  onStateChangeCallback: null, // For connection state changes (connecting, connected, disconnected)

  // --- Initialization and Connection ---
  async initializeAndConnect(callbacks) {
    if (callbacks) {
      this.onMessageCallback = callbacks.onMessage || console.log;
      this.onAudioCallback = callbacks.onAudio || console.log;
      this.onErrorCallback = callbacks.onError || console.error;
      this.onStateChangeCallback = callbacks.onStateChange || console.log;
    } else {
      // Default callbacks if none provided
      this.onMessageCallback = console.log;
      this.onAudioCallback = console.log;
      this.onErrorCallback = console.error;
      this.onStateChangeCallback = console.log;
    }

    this.onStateChangeCallback('fetching_token');
    try {
      const response = await fetch('/api/get_live_api_token/'); // Fetch from our backend
      if (!response.ok) {
        let errorMsg = `Failed to fetch ephemeral token: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
        } catch (e) {
          // Ignore if response is not JSON
        }
        throw new Error(errorMsg);
      }
      const data = await response.json();
      const ephemeralToken = data.ephemeral_token;

      if (!ephemeralToken) {
        throw new Error('Ephemeral token is missing in the response from backend.');
      }

      this.onStateChangeCallback('initializing_gemini');
      // Initialize with the ephemeral token.
      // The SDK expects the token itself as the API key for this client instance.
      this.googleAI = new GoogleGenAI(ephemeralToken);

      // Basic generation config (can be expanded or might be set by token constraints)
      // const generationConfig = {
      //   temperature: 0.9,
      // };

      // Safety settings (example, adjust as needed or rely on token constraints)
      // const safetySettings = [
      //   { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      //   // ... other categories
      // ];

      this.onStateChangeCallback('connecting_live_api');

      const liveConnectConfig = {
         // Using string values for modalities as per common JS SDK patterns.
         // If the SDK provides an enum like Modality.TEXT, that would be preferred.
         responseModalities: ['TEXT', 'AUDIO'],
         // sessionResumption: {}, // Optional: for session resumption capabilities
      };

      this.chatSession = await this.googleAI.live.connect({
        model: this.MODEL_NAME,
        config: liveConnectConfig,
      });

      this.onStateChangeCallback('connected_live_api');
      this._setupSessionEventHandlers(); // Helper to add listeners

      return true;

    } catch (error) {
      this.onErrorCallback(`Live API Initialization Error: ${error.message}`);
      this.onStateChangeCallback('error');
      console.error("Error initializing Live API service:", error);
      this.closeSession(); // Clean up
      return false;
    }
  },

  _setupSessionEventHandlers() {
    if (!this.chatSession) return;

    this.chatSession.addEventListener('message', (event) => {
      // Placeholder: Actual event structure from SDK needs to be handled here.
      // This assumes event.message might contain text or audio.
      // console.log("Live API - message event:", event);
      if (event.message && typeof event.message.text === 'string') {
        this.onMessageCallback(event.message.text);
      }
      if (event.message && event.message.audio) { // Assuming audio is identifiable
         this.onAudioCallback(event.message.audio);
      }
    });

    this.chatSession.addEventListener('error', (event) => {
      // console.error("Live API - error event:", event);
      this.onErrorCallback(`Live API Session Error: ${event.error?.message || event.toString()}`);
      this.onStateChangeCallback('error');
      this.closeSession(); // Clean up on error
    });

    this.chatSession.addEventListener('close', () => {
      // console.log("Live API - close event");
      this.onStateChangeCallback('disconnected_live_api');
      this.chatSession = null; // Ensure session is marked as null after close
    });
  },

  // --- Sending Audio ---
  async sendAudio(audioChunk) {
    if (!this.chatSession || this.chatSession.isClosed) {
      this.onErrorCallback('Cannot send audio: Session is not active or closed.');
      // console.warn('Attempted to send audio but session is not active.');
      return;
    }
    try {
      // audioChunk should be in the format expected by the SDK (e.g., Blob, ArrayBuffer, Uint8Array)
      await this.chatSession.sendAudio(audioChunk);
    } catch (error) {
      this.onErrorCallback(`Error sending audio: ${error.message}`);
      console.error("Error sending audio chunk:", error);
    }
  },

  // --- Closing Session ---
  closeSession() {
    if (this.chatSession) {
      if (!this.chatSession.isClosed) {
        try {
          this.chatSession.close();
        } catch (e) {
          // console.error("Error during chatSession.close():", e);
        }
      }
      this.chatSession = null;
      this.onStateChangeCallback('disconnected_live_api'); // Notify after ensuring session is null
    }
    // this.googleAI = null; // googleAI instance might be reusable if re-initialized with a new token.
                           // However, for ephemeral tokens, usually a new client per token is fine.
  },
};

export default LiveApiService;
