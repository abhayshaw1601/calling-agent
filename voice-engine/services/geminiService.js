/**
 * Gemini LLM Service
 * Handles conversation context management and interacts with the Google Gemini API 
 * to generate streaming text responses.
 */

/**
 * Sends conversation logs and prompt to Gemini, and streams back text chunks.
 * @param {Array} history - The dialogue history array
 * @param {string} newPrompt - The latest user transcript
 * @param {Function} onChunk - Callback executed for every streaming token/word received
 * @returns {Promise<string>} The complete combined response text
 */
const streamGeminiResponse = async (history, newPrompt, onChunk) => {
  // TODO: Use Google Gen AI SDK to call gemini-2.5-flash (or preferred model)
  // 1. Format the history and newPrompt to match Gemini API structure
  // 2. Call the streaming API (e.g. ai.models.generateContentStream)
  // 3. Iterate over the stream chunk-by-chunk, triggering onChunk(chunkText)
  // 4. Return the full aggregated string
  return "";
};

module.exports = {
  streamGeminiResponse
};
