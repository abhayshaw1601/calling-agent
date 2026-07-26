const { DeepgramClient } = require('@deepgram/sdk');

const initiateDeepgramStream = (onTranscript) => {
  const deepgram = new DeepgramClient(process.env.DEEPGRAM_API_KEY);

  let connection = null;
  let isOpen = false;
  const bufferQueue = [];

  deepgram.listen.v1.connect({
    model: 'nova-2',
    language: 'en',
    smart_format: true,
    encoding: 'mulaw',  // call encoding type
    sample_rate: 8000,  // wait at 8kHz from twilio
    channels: 1,        // mono channel
    interim_results: true, // get interim results i.e. real time transcription
    utterance_end_ms: 1000, // end of speech
    vad_events: true,       // active voice detecting
  }).then((conn) => {
    connection = conn;

    connection.on('open', () => {
      console.log('Connected to Deepgram STT.');
      isOpen = true;
      // Send any queued audio buffers
      while (bufferQueue.length > 0) {
        const buf = bufferQueue.shift();
        if (connection.socket && connection.socket.readyState === 1) {
          connection.socket.send(buf);
        }
      }
    });

    connection.on('close', () => {
      console.log('Deepgram STT closed.');
      isOpen = false;
    });

    connection.on('message', (data) => {
      console.log('Deepgram STT message received:', JSON.stringify(data));
      if (data.type === 'Results') {
        const transcript = data.channel?.alternatives?.[0]?.transcript;
        if (transcript && data.is_final) {
          onTranscript(transcript);
        }
      }
    });

    // Start the WebSocket connection!
    connection.connect();
  }).catch((err) => {
    console.error('Error connecting to Deepgram:', err.message);
  });

  return {
    send: (data) => {
      if (isOpen && connection && connection.socket && connection.socket.readyState === 1) {
        connection.socket.send(data);
      } else {
        bufferQueue.push(data);
      }
    },
    close: () => {
      if (connection) {
        connection.close();
      }
    },
    get readyState() {
      if (isOpen && connection && connection.socket) {
        return connection.socket.readyState;
      }
      return 0; // CONNECTING
    }
  };
};

module.exports = {
  initiateDeepgramStream
};

