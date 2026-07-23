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

### Phase 3: Telemetry, Database Models & Cost Computation Matrix
**Goal:** Track call duration, text character count, token usage, calculate vendor costs, and save logs to MongoDB.

#### 📝 Detailed Steps:
1. **Define Schema (`CallLog.js` / `CallLog.ts`)**:
   * Attributes: `callSid`, `phoneNumber`, `status` (`initiated`, `in-progress`, `completed`, `failed`), `startTime`, `endTime`, `duration` (seconds), `transcript` array, and `costDetails`.
2. **Setup Live Cost Calculation Matrix**:
   * **Twilio:** `$0.014 / minute`.
   * **Deepgram:** `$0.0059 / minute`.
   * **Groq/LLM:** `$0.00005 / 1k tokens` (or track exact token usage).
   * **ElevenLabs:** `$0.00003 / character`.
3. **Capture Telemetry in `streamHandler.js`**:
   * Create database log on `start`.
   * Append roles (`user`/`assistant`) and text to the `transcript` array as conversation streams.
   * On `stop`/close, calculate final costs and update the database entry to `completed`.

---

### Phase 4: User Authentication & Mock Wallet Billing System
**Goal:** Restrict calling features behind a user login and prevent calls when the user runs out of balance.

#### 📝 Detailed Steps:
1. **User Schema (`User.js` / `User.ts`)**:
   * Store `username`, `password` (hashed with `bcrypt`), and a `balance` field (type: Number, default: `20.00`).
2. **Setup Simple Authentication**:
   * Use **NextAuth.js (Auth.js)** with Credentials Provider in the Next.js app to restrict dashboard access to logged-in users.
3. **Build Mock Payment Top-Up**:
   * Create an API endpoint (`POST /api/wallet/topup`) that increases the logged-in user's balance in the database (e.g., clicking "Add $20" increments the balance by 20).
4. **Prevent Calling on Insufficient Funds**:
   * Before dialing a call in the backend, verify `user.balance > 0`. If not, refuse to dial.
   * Upon completing a call, deduct the calculated `totalCost` from the user's `balance`.

---

### Phase 5: Campaign Management (CSV Upload & Custom Prompts)
**Goal:** Allow users to upload contact sheets and assign custom prompts for each call.

#### 📝 Detailed Steps:
1. **Contact Schema (`Contact.js` / `Contact.ts`)**:
   * Attributes: `name`, `phoneNumber`, `customPrompt` (instructions for the AI), `status` (`pending`, `called`, `failed`), and associated `callSid`.
2. **CSV Parser**:
   * Install `papaparse` in the Next.js app.
   * Create an upload widget allowing users to drop a `.csv` file containing headers: `Name`, `PhoneNumber`, and `CustomPrompt`.
   * Parse the file client-side and save contacts to MongoDB.
3. **Outbound Call Trigger with Custom Prompts**:
   * Modify the call trigger API to take a `contactId` or `customPrompt`.
   * Pass the `customPrompt` to the voice stream handler, appending it to the system instructions so the LLM behaves specifically for that caller.

---

### Phase 6: Next.js Analytics Dashboard & Live Charts
**Goal:** Build the visual control center to monitor everything.

#### 📝 Detailed Steps:
1. **Wallet Card**: Display the user's remaining balance with a "Top-up" button.
2. **Campaign List**: Render the table of contacts with statuses and a "Call Now" button for each pending contact.
3. **Call Logs & Transcripts**: Add a view to browse previous calls, read live transcript arrays, and inspect detailed cost breakdowns.
4. **Interactive Charts**: Render Recharts visualization showing call volumes, total accumulated costs, and cost split per vendor.