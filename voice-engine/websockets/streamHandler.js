const WebSocket = require('ws');
const { initiateDeepgramStream } = require('../services/deepgramService');
const { streamGroqResponse } = require('../services/groqService');
const { synthesizeTextToAudio } = require('../services/elevenLabsService');
const CallLog = require('../models/CallLog');

/**
 * @param {WebSocket} ws - The client websocket connection from Twilio
*/
const handleVoiceStream = (ws) => {
  console.log("New Twilio voice stream connection established.");

  let callSid = null;
  let streamSid = null;
  let deepgramSocket = null;
  let isAiSpeaking = false;

  // dialogue context history
  const dialogueHistory = [];

  // helper to process user speech and generate AI response
  const handleUserSpeech = async (transcriptText) => {
    try {
      console.log(`Processing finalized user speech: "${transcriptText}"`);

      // Add user message to history
      dialogueHistory.push({ role: 'user', content: transcriptText });

      let sentenceBuffer = "";

      // Stream response from Groq
      const fullResponse = await streamGroqResponse(
        dialogueHistory,
        transcriptText,
        async (textToken) => {
          sentenceBuffer += textToken;

          // Split response into natural phrases using punctuation markers
          // This keeps speech synthesis natural while minimizing delay
          if (/[.?!,;\n]/.test(textToken)) {
            const phraseToSpeak = sentenceBuffer.trim();
            sentenceBuffer = ""; // Reset buffer for next phrase

            if (phraseToSpeak.length > 0) {
              try {
                isAiSpeaking = true;
                console.log(`Synthesizing phrase: "${phraseToSpeak}"`);

                // Get audio bytes from ElevenLabs
                const audioBuffer = await synthesizeTextToAudio(phraseToSpeak);

                // Send base64 audio payload back to Twilio stream
                if (ws.readyState === WebSocket.OPEN) {
                  ws.send(JSON.stringify({
                    event: 'media',
                    streamSid: streamSid,
                    media: {
                      payload: audioBuffer.toString('base64'),
                    },
                  }));
                }
              } catch (ttsError) {
                console.error("Failed to synthesize phrase:", ttsError.message);
              }
            }
          }
        }
      );

      // Once full response completes, add it to history
      console.log(`AI full response finished: "${fullResponse}"`);
      dialogueHistory.push({ role: 'assistant', content: fullResponse });
      isAiSpeaking = false;

    } catch (err) {
      console.error("Error generating AI response stream:", err);
      isAiSpeaking = false;
    }
  };

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

          // Initialize Deepgram STT stream connection
          deepgramSocket = initiateDeepgramStream((transcriptText) => {
            // INTERRUPT THE AI IF THE USER SPEAKS WHILE AI IS SPEAKING
            if (isAiSpeaking) {
              console.log("Barge-in detected! Silencing AI.");
              ws.send(JSON.stringify({
                event: 'clear',
                streamSid: streamSid
              }));
              isAiSpeaking = false;
            }

            // Trigger AI reasoning
            handleUserSpeech(transcriptText);
          });
          break;

        case 'media':
          // Raw payload is base64 encoded mulaw 8000Hz audio from phone mic
          const audioPayload = data.media.payload;

          // Decode base64 and pipe binary chunk to Deepgram socket
          if (deepgramSocket && deepgramSocket.readyState === WebSocket.OPEN) {
            deepgramSocket.send(Buffer.from(audioPayload, 'base64'));
          }
          break;

        case 'stop':
          console.log(`Stream stopped for CallSid: ${callSid}`);
          if (deepgramSocket) {
            deepgramSocket.close();
          }
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
    if (deepgramSocket) {
      deepgramSocket.close();
    }
  });
};

module.exports = {
  handleVoiceStream
};
