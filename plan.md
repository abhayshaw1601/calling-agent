# 🚀 Step-by-Step Blueprint: Building an AI Voice Agent (Twilio + Deepgram + Groq + ElevenLabs)

This roadmap breaks down how to build a **real-time AI voice call agent** from scratch with an **analytics dashboard**. 
It is written in **simple, easy-to-understand language** with step-by-step details, explanations of technical terms, and links/keywords to search in official documentation.

---

## 💡 How the AI Voice Agent Works (High-Level Summary)

Imagine a phone call with a super-fast AI assistant. Here is what happens in fractions of a second:

1. **User Speaks on Phone** ➔ Twilio captures the user's voice and streams raw audio over a **WebSocket** to your server (`voice-engine`).
2. **Speech to Text (Deepgram)** ➔ Your server forwards the live audio chunks to **Deepgram**, which converts spoken words into text transcriptions in real time.
3. **The AI Brain (Groq - LLaMA 3.1)** ➔ The transcribed text goes to **Groq Cloud** running `llama-3.1-8b-instant`. Groq generates ultra-fast AI responses (under 200ms) based on the conversation history.
4. **Text to Speech (ElevenLabs)** ➔ The AI's written text response is immediately sent to **ElevenLabs**, which turns the text back into 8kHz Mu-law human voice audio.
5. **Phone Hears AI** ➔ Your server sends the voice audio back to Twilio over WebSockets, and the user hears the AI speak on their phone.
6. **Interruption (Barge-in)** ➔ If the user speaks while the AI is talking, your server immediately detects speech over Deepgram, stops sending AI audio, and dispatches a `clear` event to Twilio to flush the phone speaker queue.
7. **Telemetry & Analytics (MongoDB & Next.js)** ➔ Every call's cost, duration, and transcript are saved to **MongoDB** and displayed on a visual **Next.js Dashboard**.

---

## 🛠️ The 4-Phase Implementation Guide

---

### Phase 1: The Phone-to-Server Audio Bridge (Bi-directional Stream)

**Goal:** Connect a real phone call from Twilio to your Express backend server using WebSockets so audio can flow live back and forth.

#### 📝 Detailed Steps:
1. **Initialize the Server**:
   * Create an Express app running on port `5050`.
   * Create a `.env` file for your secret keys (Twilio SID, Auth Token, Deepgram, Groq, ElevenLabs, MongoDB URI).
2. **Create the Twilio Webhook Endpoint (`/twilio/incoming`)**:
   * When someone calls your Twilio phone number, Twilio sends an HTTP POST request to this endpoint.
   * Respond with **TwiML XML** using the `<Connect><Stream url="wss://your-domain.com/media-stream" /></Connect>` tag. This tells Twilio: *"Upgrade this phone call to a live WebSocket audio stream."*
3. **Expose Localhost using ngrok**:
   * Run `ngrok http 5050` to get a public URL (e.g., `https://abc123.ngrok-free.app`).
   * Paste this URL in your Twilio Console under Voice Webhooks: `https://abc123.ngrok-free.app/twilio/incoming`.
4. **Create the WebSocket Listener (`/media-stream`)**:
   * Attach a WebSocket server (`ws`) to your Express server listening at `/media-stream`.
   * Handle incoming JSON messages from Twilio:
     * `connected`: Twilio connected to your WebSocket.
     * `start`: Contains call metadata (e.g., `callSid`, `streamSid`, phone number).
     * `media`: Contains small raw audio chunks encoded in **Base64** format (mulaw, 8000Hz).
     * `stop`: The call ended.
5. **Parse and Inspect Payloads**:
   * Log the `callSid` when a call starts so you can track session logs in your database.

#### 📖 Key Terms Explained:
* **WebSocket**: A 2-way pipe that stays open so data (like audio) can pass back and forth instantly.
* **TwiML**: Twilio's XML markup language used to give phone call instructions.
* **ngrok**: A safe tunnel that gives your local computer a temporary public web address.

---

### Phase 2: AI Brain, Speech Pipeline & Interruption Logic

**Goal:** Connect live phone audio to Speech-to-Text (Deepgram), pass text to Groq LLM, generate audio (ElevenLabs), and handle user interruptions ("Barge-in").

#### 📝 Detailed Steps:
1. **Step 2A: Speech-to-Text (STT) with Deepgram**
   * Open a WebSocket connection to Deepgram's streaming API (`wss://api.deepgram.com/v1/listen?encoding=mulaw&sample_rate=8000`).
   * Whenever Twilio sends a `media` audio packet, decode the base64 payload into raw binary bytes and send it straight to Deepgram's socket.
   * Listen for Deepgram's `transcript` events to get text as the user speaks.
2. **Step 2B: Brain / LLM with Groq (LLaMA 3.1 8B)**
   * Maintain a list array (`dialogueHistory`) containing past user and assistant messages.
   * When Deepgram confirms the user finished speaking a sentence, call Groq (`llama-3.1-8b-instant`) with `stream: true`.
   * Stream incoming text tokens as soon as Groq yields them.
3. **Step 2C: Text-to-Speech (TTS) with ElevenLabs**
   * Take Groq's text response tokens and send them to ElevenLabs' streaming TTS API.
   * **Crucial Format Setting:** Set ElevenLabs output audio format to **`ulaw_8000`** (8kHz, Mu-law).
4. **Step 2D: Sending Audio Back to the Phone Call**
   * Convert ElevenLabs' raw audio buffer into a Base64 string.
   * Wrap it in a Twilio WebSocket JSON payload:
     ```json
     {
       "event": "media",
       "streamSid": "YOUR_STREAM_SID",
       "media": { "payload": "BASE64_AUDIO_DATA" }
     }
     ```
   * Send it through the Twilio WebSocket so the user hears the AI speak.
5. **Step 2E: Handling User Interruptions ("Barge-In")**
   * If Deepgram detects speech while the AI is outputting audio:
     1. Stop sending pending audio chunks to Twilio.
     2. Send a Twilio `clear` event payload to instantly flush whatever audio is currently buffered on the phone speaker:
        ```json
        { "event": "clear", "streamSid": "YOUR_STREAM_SID" }
        ```

---

### Phase 3: Telemetry, Logging & Cost Calculation Matrix

**Goal:** Track call duration, token usage, text character count, and calculate vendor costs to save into MongoDB.

#### 📝 Detailed Steps:
1. **Database Schema (`CallLog.js`)**:
   * Store `callSid`, `phoneNumber`, `status`, `startTime`, `endTime`, `duration`, `costDetails`, and `transcript`.
2. **Cost Computation Logic**:
   * **Twilio Cost:** `$0.014 / minute`.
   * **Deepgram Cost:** `$0.0059 / minute`.
   * **Groq Cost:** `$0.00005 / 1k tokens` (or free tier).
   * **ElevenLabs Cost:** `$0.00003 / character`.

---

### Phase 4: Full-Stack Next.js Analytics Dashboard

**Goal:** Build a visual web dashboard (Next.js, Tailwind CSS, Recharts, shadcn/ui) to inspect call statistics, costs, and transcripts.

#### 📝 Detailed Steps:
1. **API Route (`src/app/api/analytics/route.ts`)**: Aggregate calls and total spend from MongoDB.
2. **Overview Page (`src/app/page.tsx`)**: Render KPI cards and Recharts visualizations.
3. **Calls Table (`src/app/calls/page.tsx`)**: Display call list with click-to-view modal transcripts.