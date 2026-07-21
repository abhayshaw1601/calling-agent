const { initiateDeepgramStream } = require('../services/deepgramService');
const { streamGeminiResponse } = require('../services/geminiService');
const { synthesizeTextToAudio } = require('../services/elevenLabsService');
const CallLog = require('../models/CallLog');

/**
 * Stream Handler
 * Handles real-time websocket connections from Twilio Media Streams,
 * routes speech to Deepgram, LLM text to ElevenLabs, and audio back to Twilio.
 * Manages barge-in (interruption) detection and pipelining.
 * 
 * @param {WebSocket} ws - The client websocket connection from Twilio
 */
const handleVoiceStream = (ws) => {
  console.log("New voice stream connection established.");

  let callSid = null;
  let streamSid = null;
  let deepgramSocket = null;
  
  // Track dialogue history
  const dialogueHistory = [];

  // TODO 1: Initialize Deepgram STT WebSocket connection
  // deepgramSocket = initiateDeepgramStream((transcriptText) => { ... });

  // Handle messages from Twilio WebSocket stream
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);

      switch (data.event) {
        case 'connected':
          console.log("Stream connected");
          break;

        case 'start':
          callSid = data.start.callSid;
          streamSid = data.start.streamSid;
          console.log(`Stream started: CallSid: ${callSid}, StreamSid: ${streamSid}`);
          
          // TODO 2: Initialize or update CallLog model in database
          break;

        case 'media':
          // Raw payload is mulaw audio base64 encoded
          const audioPayload = data.media.payload;
          
          // TODO 3: Pipe the incoming voice chunk to the Deepgram STT socket
          if (deepgramSocket && deepgramSocket.readyState === WebSocket.OPEN) {
            // Send binary or base64 chunk to Deepgram
          }
          break;

        case 'stop':
          console.log("Stream stopped");
          // TODO 4: Save final logs, calculate call costs, close sockets
          break;

        default:
          break;
      }
    } catch (err) {
      console.error("Error in stream message handling:", err);
    }
  });

  // Handle stream disconnection
  ws.on('close', () => {
    console.log("Voice stream connection closed.");
    // Clean up connections
  });
};

module.exports = {
  handleVoiceStream
};
