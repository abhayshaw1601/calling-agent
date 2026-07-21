const Groq = require('groq-sdk');

/**
 * Groq LLM Service
 * Interacts with Groq LPUs for lightning-fast streaming text responses (using LLaMA 3.1 8B / 70B models).
 */

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Sends conversation dialogue history and prompt to Groq, streaming back text chunks.
 * @param {Array} history - Array of { role: 'user' | 'assistant' | 'system', content: string }
 * @param {string} newPrompt - The latest user transcript
 * @param {Function} onChunk - Callback executed for every streaming text token/word received
 * @returns {Promise<string>} The complete aggregated response string
 */
const streamGroqResponse = async (history, newPrompt, onChunk) => {
  // TODO: Implement Groq streaming API call
  // 1. Format messages array: [...history, { role: 'user', content: newPrompt }]
  // 2. Call groq.chat.completions.create({
  //      messages: formattedMessages,
  //      model: "llama-3.1-8b-instant", // Ultra-fast model ideal for voice
  //      stream: true,
  //      temperature: 0.6,
  //    });
  // 3. Iterate through chunks using for await (const chunk of stream)
  // 4. Trigger onChunk(chunk.choices[0]?.delta?.content || "")
  // 5. Return full response text
  return "";
};

module.exports = {
  streamGroqResponse
};
