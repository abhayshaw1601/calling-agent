const WebSocket = require('ws');
const { initiateDeepgramStream } = require('../services/deepgramService');
const { streamGroqResponse } = require('../services/groqService');
const { synthesizeTextToAudio } = require('../services/elevenLabsService');
const CallLog = require('../models/CallLog');
const User = require('../models/User');


/**
 * @param {WebSocket} ws - The client websocket connection from Twilio
*/
const handleVoiceStream = (ws) => {
  console.log("New Twilio voice stream connection established.");

  let callSid = null;
  let streamSid = null;
  let deepgramSocket = null;
  let isAiSpeaking = false;
  let startTime = null;
  let customPrompt = "";
  let isCallFinalized = false;


  // only elevenlabs and groq are token based where as twillio and deepgram is min based so we will keep track of it by timing
  let totalCharacters = 0; //elevenlabs TTS char cost
  let totalTokens = 0; // groq LLM input+output tokens cost


  // dialogue context history
  const dialogueHistory = [];

  // helper to process user speech and generate AI response
  const handleUserSpeech = async (transcriptText) => {
    try {
      console.log(`Processing finalized user speech: "${transcriptText}"`);

      // 1. Add user message to local history
      dialogueHistory.push({ role: 'user', content: transcriptText });

      // 2. Save user transcript chunk to MongoDB
      if (callSid) {
        await CallLog.updateOne(
          { callSid },
          {
            $push: {
              transcript: {
                role: 'user',
                text: transcriptText,
                timestamp: new Date()
              }
            }
          }
        ).catch(err => console.error("Error saving user transcript chunk:", err.message));
      }

      let sentenceBuffer = "";

      // Stream response from Groq
      const fullResponse = await streamGroqResponse(
        dialogueHistory,
        transcriptText,
        customPrompt,
        async (textToken) => {
          sentenceBuffer += textToken;

          // 3. Track Groq LLM tokens (estimated: 1.33 tokens per word)
          if (textToken) {
            const estimatedTokens = textToken.trim().split(/\s+/).filter(Boolean).length * 1.33;
            totalTokens += estimatedTokens;
          }

          // Split response into natural phrases using punctuation markers
          if (/[.?!,;\n]/.test(textToken)) {
            const phraseToSpeak = sentenceBuffer.trim();
            sentenceBuffer = ""; // Reset buffer for next phrase

            if (phraseToSpeak.length > 0) {
              try {
                isAiSpeaking = true;
                console.log(`Synthesizing phrase: "${phraseToSpeak}"`);

                // 4. Track ElevenLabs characters synthesized
                totalCharacters += phraseToSpeak.length;

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

      // 5. Save assistant response transcript to MongoDB
      if (callSid) {
        await CallLog.updateOne(
          { callSid },
          {
            $push: {
              transcript: {
                role: 'assistant',
                text: fullResponse,
                timestamp: new Date()
              }
            }
          }
        ).catch(err => console.error("Error saving assistant transcript chunk:", err.message));
      }

    } catch (err) {
      console.error("Error generating AI response stream:", err);
      isAiSpeaking = false;
    }
  };

  const finalizeCallLog = async () => {
    if (isCallFinalized || !callSid || !startTime) return;
    isCallFinalized = true;

    const endTime = new Date();
    const duration = Math.max(0, Math.round((endTime - startTime) / 1000)); // In seconds

    // Rates from plan.md
    const twilioCost = (duration / 60) * 0.014;
    const deepgramCost = (duration / 60) * 0.0059;
    const groqCost = (totalTokens / 1000) * 0.00005; // Groq LLM token cost
    const elevenlabsCost = totalCharacters * 0.00003;
    const totalCost = twilioCost + deepgramCost + groqCost + elevenlabsCost;

    console.log(`Finalizing Call ${callSid}: Duration: ${duration}s, Cost: $${totalCost.toFixed(5)}`);

    // 1. Find the CallLog to get the associated username
    const log = await CallLog.findOne({ callSid });
    const username = log?.username;

    try {
      await CallLog.updateOne(
        { callSid },
        {
          status: 'completed',
          endTime,
          duration,
          costDetails: {
            twilioCost,
            deepgramCost,
            groqCost,
            elevenlabsCost,
            totalCost
          }
        }
      );

      // 2. Debit user wallet
      if (username) {
        await User.updateOne(
          { username },
          { $inc: { balance: -totalCost } }
        );
        console.log(`Wallet debited for user ${username}. Amount charged: $${totalCost.toFixed(5)}`);
      } else {
        console.log(`Call finalized without username (Inbound/System call). Skipping wallet debit.`);
      }


    } catch (err) {
      console.error("Failed to finalize CallLog & deduct balance:", err.message);
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
          startTime = Date.now();

          console.log(`Stream started: CallSid: ${callSid}, StreamSid: ${streamSid} at ${startTime}`);

          try {
            const log = await CallLog.findOne({ callSid });
            if (log && log.customPrompt) {
              customPrompt = log.customPrompt;
              console.log(`Loaded custom instructions for Call ${callSid}: "${customPrompt}"`);
            }
          } catch (err) {
            console.error("Error loading custom prompt:", err.message);
          }

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

          // Trigger dynamic initial greeting from the AI agent based on the custom prompt
          const triggerInitialGreeting = async () => {
            try {
              // Wait 1 second for the stream connection to be fully ready
              await new Promise(r => setTimeout(r, 1000));
              
              const systemInstruction = customPrompt || "You are a friendly sales agent for a cloud storage company called CloudVault. Greet the customer warmly and offer them a free 30-day trial of our premium plan. Keep responses under 2 sentences.";
              
              console.log("Generating dynamic initial greeting via Groq...");
              
              const Groq = require('groq-sdk');
              const groqInstance = new Groq({ apiKey: process.env.GROQ_API_KEY });
              
              const chatCompletion = await groqInstance.chat.completions.create({
                messages: [
                  { role: "system", content: systemInstruction },
                  { role: "user", content: "You just initiated an outbound call and the customer answered. Generate your initial opening line. Do not include any stage directions, quotes, or meta-text, just output the exact words you would speak to the customer." }
                ],
                model: "llama-3.1-8b-instant",
                temperature: 0.5,
                max_tokens: 60,
              });
              
              const greetingText = chatCompletion.choices[0].message?.content?.trim() || "Hello! How can I help you today?";
              console.log(`Generated greeting: "${greetingText}"`);
              
              dialogueHistory.push({ role: 'assistant', content: greetingText });
              
              // Save greeting to DB call log transcript
              if (callSid) {
                await CallLog.updateOne(
                  { callSid },
                  {
                    $push: {
                      transcript: {
                        role: 'assistant',
                        text: greetingText,
                        timestamp: new Date()
                      }
                    }
                  }
                ).catch(err => console.error("Error saving dynamic greeting:", err.message));
              }
              
              isAiSpeaking = true;
              const audioBuffer = await synthesizeTextToAudio(greetingText);
              totalCharacters += greetingText.length;
              
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                  event: 'media',
                  streamSid: streamSid,
                  media: {
                    payload: audioBuffer.toString('base64'),
                  },
                }));
              }
              isAiSpeaking = false;
            } catch (err) {
              console.error("Failed to trigger initial greeting:", err.message);
              isAiSpeaking = false;
            }
          };
          triggerInitialGreeting();
          break;

        case 'media':
          // Raw payload is base64 encoded mulaw 8000Hz audio from phone mic
          const audioPayload = data.media.payload;

          // Decode base64 and pipe binary chunk to Deepgram socket
          if (deepgramSocket) {
            if (deepgramSocket.readyState === WebSocket.OPEN) {
              deepgramSocket.send(Buffer.from(audioPayload, 'base64'));
            } else {
              console.log(`Deepgram socket not open yet. Current state: ${deepgramSocket.readyState}`);
            }
          }
          break;

        case 'stop':
          console.log(`Stream stopped for CallSid: ${callSid}`);
          if (deepgramSocket) {
            deepgramSocket.close();
          }
          await finalizeCallLog();
          break;

        default:
          break;
      }
    } catch (err) {
      console.error("Error in Twilio stream message handling:", err);
    }
  });

  // Handle stream disconnection
  ws.on('close', async () => {
    console.log("Twilio voice stream connection closed.");
    if (deepgramSocket) {
      deepgramSocket.close();
    }
    await finalizeCallLog();
  });
};

module.exports = {
  handleVoiceStream
};
