require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const twilio = require('twilio');
const connectDB = require('./config/db');
const { generateStreamTwiML } = require('./services/twilioService');
const { handleVoiceStream } = require('./websockets/streamHandler');
const CallLog = require('./models/CallLog');
const User = require('./models/User');

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
// Usage: POST /call/start   Body: { "to": "+91 1234567890", "username": "testuser" }
app.post('/call/start', async (req, res) => {
  try {
    const { to, username } = req.body;
    const host = req.headers.host;
    if (!username) {
      return res.status(400).json({ error: 'Missing "username" in request body.' });
    }

    if (!to) {
      return res.status(400).json({ error: 'Missing "to" phone number in request body.' });
    }

    // 1. Fetch user to verify balance
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 2. Prevent dialing if balance is empty
    if (user.balance <= 0) {
      return res.status(403).json({ error: 'Insufficient funds. Please top up your wallet.' });
    }

    // 3. Start call and save initial CallLog in DB
    const call = await twilioClient.calls.create({
      to: to,
      from: process.env.TRIAL_NUMBER,
      url: `https://${host}/twilio/incoming?username=${username}`, // Pass username to incoming webhook
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
