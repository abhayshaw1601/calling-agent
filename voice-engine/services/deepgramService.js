const { createClient } = require('@deepgram/sdk');

const initiateDeepgramStream = (onTranscript) => {
  const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

  const connection = deepgram.listen.live({
    model: 'nova-2',
    language: 'en',
    smart_format: true,
    encoding: 'mulaw',  //call encoding type
    sample_rate: 8000,  // wait at 8kHz from twilio
    channels: 1,        // mono channel
    interim_results: true, //get interim results i.e. real time transcription
    utterance_end_ms: 1000, //end of speech
    vad_events: true,       // active voice detecting 
  });

  connection.on('open', () => console.log('Connected to Deepgram STT.'));
  connection.on('close', () => console.log('Deepgram STT closed.'));

  connection.on('transcript', (data) => {
    const transcript = data.channel.alternatives[0].transcript;   // get the transcript from deepgram
    if (transcript && data.is_final) {      // get final results
      onTranscript(transcript); // pass the transcript to the onTranscript callback
    }
  });

  return connection;
};

module.exports = {
  initiateDeepgramStream
};

