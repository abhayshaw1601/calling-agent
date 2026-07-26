const https = require('https');

/**
 * Converts text into a raw audio buffer using standard Node.js https module.
 * This guarantees respect for dns.setDefaultResultOrder('ipv4first') to avoid IPv6 timeouts.
 * @param {string} text - The input text to synthesize
 * @returns {Promise<Buffer>} Raw Mulaw audio buffer
 */
const synthesizeTextToAudio = (text) => {
  return new Promise((resolve, reject) => {
    try {
      const voiceId = process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB';
      const path = `/v1/text-to-speech/${voiceId}/stream?output_format=ulaw_8000`;
      
      const postData = JSON.stringify({
        text: text,
        model_id: 'eleven_flash_v2_5',
        voice_settings: {
          stability: 0.75,
          similarity_boost: 0.10,
        }
      });

      const options = {
        hostname: 'api.elevenlabs.io',
        port: 443,
        path: path,
        method: 'POST',
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        if (res.statusCode !== 200) {
          let errData = '';
          res.on('data', (chunk) => { errData += chunk; });
          res.on('end', () => {
            reject(new Error(`ElevenLabs TTS failed: ${res.statusCode} - ${errData}`));
          });
          return;
        }

        const chunks = [];
        res.on('data', (chunk) => { chunks.push(chunk); });
        res.on('end', () => {
          resolve(Buffer.concat(chunks));
        });
      });

      req.on('error', (e) => {
        console.error("Error in ElevenLabs TTS connection:", e);
        reject(e);
      });

      req.write(postData);
      req.end();
    } catch (error) {
      console.error("Error in ElevenLabs TTS Initialization:", error);
      reject(error);
    }
  });
};

module.exports = {
  synthesizeTextToAudio
};
