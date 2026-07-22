/**
 * Converts text into a raw audio buffer.
 * @param {string} text - The input text to synthesize
 * @returns {Promise<Buffer>} Raw Mulaw audio buffer
 */

const synthesizeTextToAudio = async (text) => {
  try {
    const voiceId = process.env.ELEVENLABS_VOICE_ID || '4O1sYUnmtThcBoSBrri7';
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream?output_format=ulaw_8000`;

    // sending request to ElevenLabs
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_flash_v2_5',
        voice_settings: {
          stability: 0.75,
          similarity_boost: 0.10,
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ElevenLabs TTS failed: ${response.statusText} - ${errorText}`);
    }

    // reading the binary audio response stream as an array buffer
    const arrayBuffer = await response.arrayBuffer();

    // convert arraybuffer to node.js buffer and return it
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error("Error in ElevenLabs TTS Synthesis:", error);
    throw error;
  }
};

module.exports = {
  synthesizeTextToAudio
};
