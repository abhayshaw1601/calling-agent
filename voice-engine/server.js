require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const twilio = require('twilio');
const connectDB = require('./config/db');
const { generateStreamTwiML } = require('./services/twilioService');
const { handleVoiceStream } = require('./websockets/streamHandler');
const CallLog = require('./models/CallLog');

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
// Usage: POST /call/start   Body: { "to": "+919876543210" }
app.post('/call/start', async (req, res) => {
  try {
    const { to } = req.body;
    const host = req.headers.host;

    if (!to) {
      return res.status(400).json({ error: 'Missing "to" phone number in request body.' });
    }

    // Tell Twilio to call the number and use /twilio/incoming for TwiML instructions
    const call = await twilioClient.calls.create({
      to: to,                                         // Phone number to call (e.g. your mobile)
      from: process.env.TRIAL_NUMBER,                 // Your Twilio phone number
      url: `https://${host}/twilio/incoming`,         // TwiML webhook URL
      method: 'POST',
    });

    console.log(`Outbound call initiated. Call SID: ${call.sid}`);
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
