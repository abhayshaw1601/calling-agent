const WebSocket = require('ws');
const { initiateDeepgramStream } = require('../services/deepgramService');
const { streamGroqResponse } = require('../services/groqService');
const { synthesizeTextToAudio } = require('../services/elevenLabsService');
const CallLog = require('../models/CallLog');

/**
 * Twilio Stream Handler
 * Handles real-time websocket connections from Twilio Media Streams,
 * routes speech to Deepgram, LLM text to Groq, ElevenLabs TTS audio back to Twilio.
 * Manages barge-in (interruption) detection and audio queue clearing.
 * 
 * @param {WebSocket} ws - The client websocket connection from Twilio
 */
const handleVoiceStream = (ws) => {
  console.log("New Twilio voice stream connection established.");

  let callSid = null;
  let streamSid = null;
  let deepgramSocket = null;
  let isAiSpeaking = false;
  
  // Dialogue context history
  const dialogueHistory = [];

  // TODO 1: Initialize Deepgram STT WebSocket connection
  // deepgramSocket = initiateDeepgramStream((transcriptText) => {
  //   if (isAiSpeaking) {
  //     // BARGE-IN DETECTED: Clear Twilio audio queue
  //     ws.send(JSON.stringify({ event: 'clear', streamSid }));
  //     isAiSpeaking = false;
  //   }
  //   // Trigger streamGroqResponse(...) and pipe audio back
  // });

  // Handle messages from Twilio WebSocket stream
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);

      switch (data.event) {
        case 'connected':
          console.log("Twilio Media Stream connected.");
          break;

        case 'start':
          callSid = data.start.callSid;
          streamSid = data.start.streamSid;
          console.log(`Stream started: CallSid: ${callSid}, StreamSid: ${streamSid}`);
          
          // TODO 2: Initialize CallLog record in database
          break;

        case 'media':
          // Raw payload is base64 encoded mulaw 8000Hz audio
          const audioPayload = data.media.payload;
          
          // TODO 3: Decode base64 and pipe binary chunk to Deepgram socket
          if (deepgramSocket && deepgramSocket.readyState === WebSocket.OPEN) {
            // deepgramSocket.send(Buffer.from(audioPayload, 'base64'));
          }
          break;

        case 'stop':
          console.log(`Stream stopped for CallSid: ${callSid}`);
          // TODO 4: Save final telemetry logs, calculate call costs, close sockets
          break;

        default:
          break;
      }
    } catch (err) {
      console.error("Error in Twilio stream message handling:", err);
    }
  });

  // Handle stream disconnection
  ws.on('close', () => {
    console.log("Twilio voice stream connection closed.");
    if (deepgramSocket) deepgramSocket.close();
  });
};

module.exports = {
  handleVoiceStream
};
