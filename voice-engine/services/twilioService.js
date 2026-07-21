/**
 * Twilio Service
 * Handles building TwiML responses for Twilio voice calls, starting media streams,
 * and managing call actions (like ending a call or sending updates).
 */

/**
 * Generate TwiML instructions to stream audio over WebSockets to our server.
 * @param {string} streamUrl - The WebSocket URL for the audio stream
 * @returns {string} XML TwiML string
 */
const generateStreamTwiML = (streamUrl) => {
  // TODO: Construct and return a Twilio TwiML Voice response.
  // 1. Use the <Connect> verb to initiate a media <Stream> pointing to streamUrl.
  // 2. Add an optional initial greeting <Say> before the stream starts.
  return `
    <Response>
      <!-- ADD TwiML structure here -->
    </Response>
  `;
};

/**
 * Update active call status (e.g., terminate or redirect the call).
 * @param {string} callSid - Unique ID of the Twilio call
 * @param {object} options - Details/actions to perform
 */
const updateCall = async (callSid, options) => {
  // TODO: Use Twilio SDK client to update/end the active call.
};

module.exports = {
  generateStreamTwiML,
  updateCall
};
