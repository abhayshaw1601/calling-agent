const WebSocket = require('ws');

/**
 * Deepgram STT Service
 * Establishes a WebSocket connection with Deepgram to stream real-time audio from the user 
 * and convert it to text transcription.
 */

/**
 * Configures and opens a WebSocket connection to Deepgram's streaming API.
 * @param {Function} onTranscript - Callback triggered when a transcript chunk is received
 * @returns {WebSocket} Open WebSocket instance to Deepgram
 */
const initiateDeepgramStream = (onTranscript) => {
  // TODO: Create a WebSocket connection to:
  // wss://api.deepgram.com/v1/listen?encoding=mulaw&sample_rate=8000&channels=1&interim_results=true
  // Headers: { Authorization: `Token ${process.env.DEEPGRAM_API_KEY}` }
  
  // Set up event listeners:
  // - 'open': log success
  // - 'message': parse transcription data, trigger onTranscript callback
  // - 'error': log error
  // - 'close': handle cleanup
  
  return null; // Return the socket connection
};

module.exports = {
  initiateDeepgramStream
};
