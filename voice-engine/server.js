require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const connectDB = require('./config/db');
const { generateStreamTwiML } = require('./services/twilioService');
const { handleVoiceStream } = require('./websockets/streamHandler');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 5050;

// Connect to Database
connectDB();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Twilio Webhook Route: Triggered when a call comes in
app.post('/twilio/incoming', (req, res) => {
  const host = req.headers.host;
  const streamUrl = `wss://${host}/media-stream`;
  
  console.log(`Incoming call received. Directing to stream URL: ${streamUrl}`);
  
  const twiml = generateStreamTwiML(streamUrl);
  res.type('text/xml');
  res.send(twiml);
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
