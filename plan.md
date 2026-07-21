# 🚀 Step-by-Step Blueprint: Building an AI Voice Agent

This roadmap breaks down how to build a **real-time AI voice call agent** with an **analytics dashboard**. 
It is written in **simple, easy-to-understand language** with step-by-step details, explanations of technical terms, and links/keywords to search in official documentation.

---

## 💡 How the AI Voice Agent Works (High-Level Summary)

Imagine a phone call with a super-fast AI assistant. Here is what happens in fractions of a second:

1. **User Speaks on Phone** ➔ Twilio captures the user's voice and streams raw audio over a **WebSocket** to your server (`voice-engine`).
2. **Speech to Text (Deepgram)** ➔ Your server forwards the live audio chunks to **Deepgram**, which converts spoken words into text transcriptions in real time.
3. **The AI Brain (Gemini)** ➔ The transcribed text goes to **Google Gemini**. Gemini generates an AI answer based on the conversation history.
4. **Text to Speech (ElevenLabs)** ➔ The AI's written text response is immediately sent to **ElevenLabs**, which turns the text back into human voice audio.
5. **Phone Hears AI** ➔ Your server sends the voice audio back to Twilio, and the user hears the AI speak on their phone.
6. **Interruption (Barge-in)** ➔ If the user speaks while the AI is talking, your server immediately stops the AI and clears the phone speaker queue so the AI doesn't talk over the user.
7. **Telemetry & Analytics (MongoDB & Next.js)** ➔ Every call's cost, duration, and transcript are saved to **MongoDB** and displayed on a visual **Next.js Dashboard**.

---

## 🛠️ The 4-Phase Implementation Guide

---

### Phase 1: The Phone-to-Server Audio Bridge (Bi-directional Stream)

**Goal:** Connect a real phone call from Twilio to your Express backend server using WebSockets so audio can flow live back and forth.

#### 📝 Detailed Steps:
1. **Initialize the Server**:
   * Create an Express app running on port `5050`.
   * Create a `.env` file for your secret keys (Twilio SID, Auth Token, MongoDB URI, etc.).
2. **Create the Twilio Webhook Endpoint (`/twilio/incoming`)**:
   * When someone calls your Twilio phone number, Twilio sends an HTTP POST request to this endpoint.
   * Respond with **TwiML XML** using the `<Connect><Stream url="wss://your-domain.com/media-stream" /></Connect>` tag. This tells Twilio: *"Upgrade this phone call to a live WebSocket audio stream."*
3. **Expose Localhost using ngrok**:
   * Twilio is on the internet and cannot reach `localhost:5050`.
   * Run `ngrok http 5050` to get a public URL (e.g. `https://abc123.ngrok-free.app`).
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
* **WebSocket**: A 2-way pipe that stays open so data (like audio) can pass back and forth instantly without making new HTTP requests every time.
* **TwiML**: Twilio's XML markup language used to give phone call instructions.
* **ngrok**: A safe tunnel that gives your local computer a temporary public internet web address.

#### 📚 Official Documentation & Search Terms:
* *Twilio:* Search **"Twilio Media Streams TwiML <Stream>"** and **"Twilio WebSocket Media Formats"**.
* *ngrok:* Search **"ngrok HTTP tunnels setup guide"**.

---

### Phase 2: AI Brain, Speech Pipeline & Interruption Logic

**Goal:** Connect the live phone audio to Speech-to-Text (Deepgram), pass the text to the LLM (Gemini), generate audio (ElevenLabs), and handle user interruptions ("Barge-in").

#### 📝 Detailed Steps:
1. **Step 2A: Speech-to-Text (STT) with Deepgram**
   * Open a WebSocket connection to Deepgram's streaming API (`wss://api.deepgram.com/v1/listen?encoding=mulaw&sample_rate=8000`).
   * Whenever Twilio sends a `media` audio packet, decode the base64 payload into raw binary bytes and send it straight to Deepgram's socket.
   * Listen for Deepgram's `transcript` events to get text as the user speaks.
2. **Step 2B: Brain / LLM with Google Gemini**
   * Maintain a list array (`dialogueHistory`) containing past user and assistant messages for memory.
   * When Deepgram confirms the user finished speaking a sentence, append it to `dialogueHistory` and call `gemini-2.5-flash` with streaming enabled.
   * Stream incoming text tokens (words/phrases) as soon as Gemini yields them.
3. **Step 2C: Text-to-Speech (TTS) with ElevenLabs**
   * Take Gemini's text response tokens and send them to ElevenLabs' streaming TTS API.
   * **Crucial Format Setting:** Set ElevenLabs output audio format to **`ulaw_8000`** (8kHz, Mu-law). Phone lines only understand 8kHz Mu-law audio!
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
   * What if the AI is speaking, but the user starts talking?
   * If Deepgram detects speech while the AI is outputting audio:
     1. Stop sending pending audio chunks to Twilio.
     2. Send a Twilio `clear` event payload to instantly flush whatever audio is currently buffered on the phone line speaker:
        ```json
        { "event": "clear", "streamSid": "YOUR_STREAM_SID" }
        ```
     3. Cancel any in-flight Gemini LLM generation or ElevenLabs audio request.

#### 📖 Key Terms Explained:
* **Mu-law (µ-law) 8kHz**: The standard compressed audio format used by traditional telephone networks globally.
* **Barge-in**: The ability for a human caller to interrupt an AI while it's speaking.
* **Base64**: A way to convert binary raw audio files into standard text characters so they can be sent inside JSON.

#### 📚 Official Documentation & Search Terms:
* *Deepgram:* Search **"Deepgram WebSocket Streaming API parameters"** (`encoding=mulaw`, `sample_rate=8000`).
* *Google Gemini:* Search **"Google Gen AI SDK generateContentStream"**.
* *ElevenLabs:* Search **"ElevenLabs Text to Speech WebSocket / ulaw_8000 output format"**.

---

### Phase 3: Telemetry, Logging & Cost Calculation Matrix

**Goal:** Track every call's duration, token usage, text character count, and calculate vendor costs to save into MongoDB.

#### 📝 Detailed Steps:
1. **Database Schema (`CallLog.js`)**:
   * Create a Mongoose schema containing:
     * `callSid`: Unique identifier for the call.
     * `phoneNumber`: Caller's phone number.
     * `status`: `initiated`, `in-progress`, `completed`, or `failed`.
     * `startTime`, `endTime`, `duration` (in seconds).
     * `costDetails`: Sub-costs for `twilioCost`, `deepgramCost`, `geminiCost`, `elevenlabsCost`, and `totalCost`.
     * `transcript`: Array of `{ role, text, timestamp }`.
2. **Cost Computation Logic**:
   * **Twilio Cost:** `$0.014 / minute` (calculate based on duration seconds).
   * **Deepgram Cost:** `$0.0059 / minute` (calculate based on streaming duration).
   * **Gemini Cost:** `$0.000075 / 1k input tokens` + `$0.0003 / 1k output tokens`.
   * **ElevenLabs Cost:** `$0.00003 / character` (based on total characters sent to TTS).
3. **Database Saving Lifecycle**:
   * **Call Starts (`start` event)**: Create initial record in MongoDB with status `in-progress`.
   * **During Call**: Append transcript messages to the database array as each turn finishes.
   * **Call Ends (`stop` event or socket close)**: Calculate call duration, run cost formulas, update total costs, and set status to `completed`.

#### 📖 Key Terms Explained:
* **Telemetry**: Automated recording and gathering of data (costs, time, tokens) from remote systems.
* **Mongoose**: A library that makes it simple to model and store data in MongoDB using JavaScript objects.

#### 📚 Official Documentation & Search Terms:
* *MongoDB:* Search **"Mongoose Schema Timestamps and Subdocuments"**.
* *Pricing docs:* Search **"Twilio Programmable Voice Pricing"**, **"Deepgram Pricing Page"**, **"ElevenLabs API Character Pricing"**.

---

### Phase 4: Full-Stack Next.js Analytics Dashboard

**Goal:** Build a visual web dashboard (Next.js, Tailwind CSS, Recharts, shadcn/ui) to inspect call statistics, costs, and transcripts.

#### 📝 Detailed Steps:
1. **Setup Next.js Project (`analytics-dashboard`)**:
   * Next.js App Router app on port `3000`.
   * Configure `MONGO_URI` in `.env.local` to connect to the exact same MongoDB database used by the voice engine.
2. **Create Global DB Helper (`src/lib/db.ts`)**:
   * Use connection caching to prevent creating too many database connections during hot reloads or serverless API requests.
3. **Build API Route (`src/app/api/analytics/route.ts`)**:
   * Query MongoDB to return:
     * Total number of calls.
     * Total money spent.
     * Average duration per call.
     * Daily cost time-series array for line charts.
     * Vendor cost split (Twilio vs Deepgram vs Gemini vs ElevenLabs) for pie charts.
4. **Build the Overview Page (`src/app/page.tsx`)**:
   * Render metric KPI cards (Total Calls, Average Duration, Total Cost).
   * Embed `CostChart.tsx` (using Recharts `<LineChart>`).
   * Embed `VendorPie.tsx` (using Recharts `<PieChart>`).
5. **Build Call History Table Page (`src/app/calls/page.tsx`)**:
   * Display a table listing past calls (Call SID, Phone Number, Status, Duration, Cost).
   * Add a row click event that opens a **Dialog Modal** showing the step-by-step conversation transcript between the User and AI.

#### 📚 Official Documentation & Search Terms:
* *Next.js:* Search **"Next.js App Router Data Fetching & API Routes"**.
* *Recharts:* Search **"Recharts ResponsiveContainer LineChart and PieChart examples"**.
* *Tailwind / Shadcn:* Search **"shadcn ui Data Table and Dialog components"**.

---

## 📊 Summary Checklist of Key Metrics to Monitor

When your dashboard is live, monitor these 3 main health indicators:

1. **PTT Latency (Post-Transcription Time):** How many milliseconds it takes between when the user stops talking and when the AI starts speaking. (Target: under 1.5 seconds).
2. **Vendor Cost Breakdown:** Which service takes the biggest percentage of your budget (usually ElevenLabs TTS is the largest portion).
3. **Call Completion Rate:** Percentage of calls that completed successfully vs failed/dropped calls.