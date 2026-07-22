const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Sends conversation dialogue history and prompt to groq, streaming back text chunks.
 * @param {Array} history - array of { role: 'user' | 'assistant' | 'system', content: string }
 * @param {string} newPrompt - the latest user transcript
 * @param {Function} onChunk - callback executed for every streaming text token/word received
 * @returns {Promise<string>} the complete aggregated response string
 */
const streamGroqResponse = async (history, newPrompt, onChunk) => {

  try {
    // format the conversation messages, appending the new message
    const messages = [
      {
        role: "system",
        content: "You are a helpful, extremely concise conversational AI voice assistant. Speak naturally, keep answers under 2 sentences, and avoid using list bullet points or markdown syntax since your output will be read aloud."
      },
      ...history,
      { role: "user", content: newPrompt }
    ];

    // Call groq streaming API
    const chatCompletion = await groq.chat.completions.create({
      messages: messages,
      model: "llama-3.1-8b-instant",
      temperature: 0.5,
      max_tokens: 150,
      stream: true,
    });

    // iterate through chunks using async
    let fullResponse = "";

    for await (const chunk of chatCompletion) {
      const text = chunk.choices[0].delta?.content || "";
      if (text) {
        fullResponse += text;
        onChunk(text);
      }
    }

    // Return full response text
    return fullResponse;
  } catch (error) {
    console.error("Error in Groq stream:", error);
    throw error;
  }
};

module.exports = {
  streamGroqResponse
};
