require('dotenv').config();
require('dns').setDefaultResultOrder('ipv4first');
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const twilio = require('twilio');
const connectDB = require('./config/db');
const { generateStreamTwiML } = require('./services/twilioService');
const { handleVoiceStream } = require('./websockets/streamHandler');
const CallLog = require('./models/CallLog');
const User = require('./models/User');
const Contact = require('./models/Contact');


const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 5050;

// Initialize Twilio REST client for making outbound calls
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

connectDB();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Twilio Webhook Route: Triggered when a phone call comes in (inbound)
// Also used as the TwiML URL for outbound calls when the recipient picks up
app.post('/twilio/incoming', async (req, res) => {
  const host = req.headers.host;
  const streamUrl = `wss://${host}/media-stream`;

  const callSid = req.body.CallSid;
  const fromNumber = req.body.From || 'Unknown';
  const username = req.query.username;
  const contactId = req.query.contactId;
  const customPrompt = req.query.customPrompt;

  console.log(`Call connected. CallSid: ${callSid}. Directing to stream: ${streamUrl}`);

  try {
    // Create call log entry in MongoDB
    await CallLog.findOneAndUpdate(
      { callSid },
      {
        callSid,
        phoneNumber: fromNumber,
        status: 'in-progress',
        startTime: new Date(),
        username: username,
        contactId: contactId,
        customPrompt: customPrompt
      },
      { upsert: true, new: true }
    );
  } catch (dbErr) {
    console.error("Failed to create CallLog in DB:", dbErr.message);
  }

  const twiml = generateStreamTwiML(streamUrl);
  res.type('text/xml');
  res.send(twiml);
});


// Helper to optimize raw user prompt via Groq before starting call
const optimizeSystemPrompt = async (rawPrompt, contactName = 'Customer') => {
  const defaultPrompt = `You are a helpful sales assistant calling ${contactName}. Start the call by saying: Hello ${contactName}, I am calling from CloudVault.`;
  if (!rawPrompt || rawPrompt.trim() === '') {
    return defaultPrompt;
  }

  try {
    const Groq = require('groq-sdk');
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    console.log(`Optimizing prompt: "${rawPrompt}" for contact: "${contactName}"...`);

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a professional prompt engineering expert specialized in conversational AI voice agents. Your task is to take a raw user instruction for a phone call agent and rewrite it into a highly detailed, professional, structured SYSTEM PROMPT for a conversational voice agent. The optimized prompt MUST instruct the agent on personality, tone, rules (keep responses short, 1-2 sentences, conversational), and explicitly specify that the agent must greet the customer by name. For example, if the prompt is about a free trial, the system prompt should specify: 'Start the call by greeting: Hello [name], I am calling from [company] for [purpose]'. Do not output any intro, explanation, stage directions, thinking, quotes, or meta-text. Output ONLY the final system prompt."
        },
        {
          role: "user",
          content: `Optimize this raw instruction for a call to a contact named "${contactName}": "${rawPrompt}"`
        }
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.3,
    });

    const optimized = completion.choices[0].message?.content?.trim();
    if (optimized) {
      console.log(`Successfully optimized prompt. Length: ${optimized.length}`);
      return optimized;
    }
  } catch (err) {
    console.error("Error in optimizeSystemPrompt:", err.message);
  }

  return rawPrompt;
};


// outbound call route for calling any provided number
// Usage: POST /call/start   Body: { "to": "+91 1234567890" }

app.post('/call/start', async (req, res) => {
  try {
    const { to, username, contactId, customPrompt: directPrompt } = req.body;
    const host = req.headers.host;

    if (!username) {
      return res.status(400).json({ error: 'Missing "username" in request body.' });
    }

    let targetNumber = to;
    let customPrompt = directPrompt || '';
    let contactName = 'Customer';

    // 1. If contactId is provided, retrieve name, number, and prompt
    if (contactId) {
      const contact = await Contact.findById(contactId);
      if (!contact) {
        return res.status(404).json({ error: 'Contact not found' });
      }
      targetNumber = contact.phoneNumber;
      customPrompt = contact.customPrompt;
      contactName = contact.name;

      // Mark contact as called
      contact.status = 'called';
      await contact.save();
    }

    if (!targetNumber) {
      return res.status(400).json({ error: 'Missing target phone number ("to" or "contactId").' });
    }

    // Run prompt optimization before making the call!
    const optimizedPrompt = await optimizeSystemPrompt(customPrompt, contactName);

    // 2. Fetch user to verify balance
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.balance <= 0) {
      return res.status(403).json({ error: 'Insufficient funds. Please top up your wallet.' });
    }

    // 3. Start call — use NGROK_URL env var for the public webhook Twilio can reach
    const publicHost = process.env.NGROK_URL || `https://${host}`;
    const call = await twilioClient.calls.create({
      to: targetNumber,
      from: process.env.TRIAL_NUMBER,
      url: `${publicHost}/twilio/incoming?username=${username}&customPrompt=${encodeURIComponent(optimizedPrompt)}${contactId ? `&contactId=${contactId}` : ''}`,
      method: 'POST',
    });

    console.log(`Outbound call initiated for user ${username}. Call SID: ${call.sid}`);
    res.status(200).json({ success: true, callSid: call.sid });

  } catch (error) {
    console.error('Error initiating outbound call:', error.message);
    res.status(500).json({ error: error.message });
  }
});



// WebSocket Server: Route incoming Media Streams to our Stream Handler
wss.on('connection', (ws, req) => {
  if (req.url === '/media-stream') {
    handleVoiceStream(ws);
  } else {
    ws.close(4004, 'Not Found');
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Voice Engine server is running on port ${PORT}`);
});
