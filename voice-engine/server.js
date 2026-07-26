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

    // 1. If contactId is provided, retrieve name, number, and prompt
    if (contactId) {
      const contact = await Contact.findById(contactId);
      if (!contact) {
        return res.status(404).json({ error: 'Contact not found' });
      }
      targetNumber = contact.phoneNumber;
      customPrompt = contact.customPrompt;

      // Mark contact as called
      contact.status = 'called';
      await contact.save();
    }

    if (!targetNumber) {
      return res.status(400).json({ error: 'Missing target phone number ("to" or "contactId").' });
    }

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
      url: `${publicHost}/twilio/incoming?username=${username}&customPrompt=${encodeURIComponent(customPrompt)}${contactId ? `&contactId=${contactId}` : ''}`,
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
