# AI Voice Agent Campaign Manager

![Next.js](https://img.shields.io/badge/Next.js-v14.2.3-black?style=flat-square)
![Node.js](https://img.shields.io/badge/Node.js-Active-green?style=flat-square)
![Twilio](https://img.shields.io/badge/Twilio-Voice_API-red?style=flat-square)
![Deepgram](https://img.shields.io/badge/Deepgram-STT-blue?style=flat-square)
![Groq](https://img.shields.io/badge/Groq-Llama_3.1-orange?style=flat-square)
![ElevenLabs](https://img.shields.io/badge/ElevenLabs-TTS-yellow?style=flat-square)
![Razorpay](https://img.shields.io/badge/Razorpay-Payments-blue?style=flat-square)
![MongoDB](https://img.shields.io/badge/MongoDB-Persisted-green?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-gray?style=flat-square)

A production-ready outbound calling and campaign management system. It features a Next.js 14 Web UI to manage contacts and view call analytics, combined with a Node.js voice engine orchestrating real-time, low-latency, two-way conversational voice calls using Twilio, Deepgram STT, Groq LLM, and ElevenLabs TTS.

## Tech Stack Details

* **Next.js (v14.2.3)**: High-performance dashboard for viewing call analytics, metrics, and managing campaigns.
* **Node.js**: The real-time backend voice engine driving high-performance SIP audio connections.
* **Twilio**: Cloud communications platform handles outbound dialing and handles WebSocket media streams.
* **Deepgram**: Ultra-low-latency real-time voice speech-to-text transcription.
* **Groq (Llama 3.1)**: Conversational LLM reasoning engine to deliver human-like response streaming.
* **ElevenLabs**: High-fidelity text-to-speech audio synthesis.
* **Razorpay**: Secure payment gateway for wallet top-ups and credits.
* **MongoDB (Mongoose)**: Document database for user accounts, balances, and persistent call log history.

---

## Architecture Overview

The system consists of three main components running in a Dockerized environment:
1. **Next.js Dashboard**: Enables user login, Razorpay wallet top-ups, campaign CSV parsing, manual contact creation, and real-time visualization of call spend metrics.
2. **Node.js Voice Engine**: Orchestrates the active SIP call WebSocket stream and manages API calls to AI providers.
3. **MongoDB Database**: Serves as the shared state store for contacts, user balances, and finalized call logs/billing.

```mermaid
graph TD
    User[Caller / Phone Recipient] <-->|SIP Audio / Public PSTN| Twilio[Twilio Voice API]
    Twilio <-->|WebSocket Stream / mulaw 8000Hz| Engine[Voice Engine Node.js Server]
    Engine <-->|REST API| Groq[Groq API Llama 3.1 8b]
    Engine <-->|WebSocket STT| Deepgram[Deepgram STT API]
    Engine <-->|REST API / TTS| ElevenLabs[ElevenLabs TTS API]
    Dashboard[Next.js Analytics Dashboard] <-->|Read/Write| MongoDB[(MongoDB)]
    Dashboard <-->|Create Orders / Verify Signature| Razorpay[Razorpay Payment API]
    Engine <-->|Read/Write| MongoDB
    Dashboard <-->|Trigger Outbound Call| Engine
```

---

## Call Flow Sequence

The diagram below details the end-to-end flow from campaign call initiation to active voice streaming and call termination billing.

```mermaid
sequenceDiagram
    autonumber
    participant UI as Dashboard / Campaigns
    participant Engine as Voice Engine (Node.js)
    participant Groq as Groq (Llama-3.1-8b)
    participant Twilio as Twilio REST/PSTN
    participant User as Recipient (Phone)
    participant Deepgram as Deepgram STT
    participant ElevenLabs as ElevenLabs TTS

    UI->>Engine: POST /call/start (contact details + raw prompt)
    Engine->>Groq: Request system prompt optimization
    Groq-->>Engine: Optimized system prompt
    Engine->>Twilio: Initiate Outbound Call (passes optimized prompt in webhook query)
    Twilio->>User: Call recipient's phone (Rings & Connected)
    User->>Twilio: Answer call
    Twilio->>Engine: Establish WebSocket Media Stream
    Engine->>Groq: Generate dynamic greeting text from prompt instructions
    Groq-->>Engine: Dynamic greeting string
    Engine->>ElevenLabs: Synthesize greeting text to mulaw audio
    ElevenLabs-->>Engine: Audio buffer
    Engine->>Twilio: Send audio payload (Plays to Recipient)
    Engine->>Deepgram: Open STT connection
    Loop Conversation
        User->>Twilio: Speak ("Hello...")
        Twilio->>Engine: Raw audio stream via WebSocket
        Engine->>Deepgram: Stream binary audio
        Deepgram-->>Engine: Real-time transcription results
        Engine->>Groq: Query LLM (history + latest transcript + custom prompt)
        Groq-->>Engine: Stream LLM text response
        Engine->>ElevenLabs: Synthesize sentence-by-sentence text to audio
        ElevenLabs-->>Engine: Mulaw audio stream buffers
        Engine->>Twilio: Send audio media packets
        Twilio->>User: Plays voice agent response
    End
    User->>Twilio: Hangs up call
    Twilio->>Engine: Stream stopped webhook
    Engine->>MongoDB: Finalize logs, calculate costs, debit wallet balance
```

### Wallet Top-Up Sequence (Razorpay)

The diagram below details the step-by-step payment processing and secure wallet balance top-up flow.

```mermaid
sequenceDiagram
    autonumber
    participant User as User (Browser)
    participant UI as Dashboard Wallet Page
    participant API as Next.js API Routes
    participant RZP as Razorpay Gateway
    participant DB as MongoDB (User Balance)

    User->>UI: Select credit amount (e.g. $10)
    UI->>API: POST /api/payment/order { amount: 10 }
    API->>API: Fetch live USD to INR exchange rate
    API->>RZP: Create Order (amountInINR * 100 paise)
    RZP-->>API: Return Order ID
    API-->>UI: Return Order Details & metadata
    UI->>User: Launch Razorpay Standard Checkout Popup
    User->>RZP: Choose UPI/Card/Netbanking & pay
    RZP-->>UI: Return Payment Signature, Payment ID & Order ID
    UI->>API: POST /api/payment/verify { signature, payment_id, order_id }
    API->>API: Cryptographically verify signature
    API->>RZP: Fetch Order metadata from Razorpay API
    API->>DB: Securely increment user balance by usdAmount
    DB-->>API: Return updated balance
    API-->>UI: Return success & new balance
    UI->>User: Show success & update real-time UI balance
```

---

## Setup Guide

### Prerequisites
* Docker and Docker Compose installed on your system
* ngrok installed (for local webhook tunneling)
* Twilio account with a purchased phone number
* Deepgram, Groq, and ElevenLabs API keys

### Step 1: Clone and Configure Environment

1. Clone this repository to your local directory.
2. Configure the voice engine environment variables. Create a file named `voice-engine/.env` with the following variables:
   ```env
   PORT=5050
   MONGO_URI=mongodb://mongodb:27017/voice-agent-telemetry
   NGROK_AUTHTOKEN=your_ngrok_authtoken
   NGROK_URL=your_ngrok_public_url
   TWILIO_ACCOUNT_SID=your_twilio_account_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_API_KEY=your_twilio_api_key
   TWILIO_API_SECRET=your_twilio_api_secret
   TRIAL_NUMBER=your_twilio_phone_number
   DEEPGRAM_API_KEY=your_deepgram_api_key
   GROQ_API_KEY=your_groq_api_key
   ELEVENLABS_API_KEY=your_elevenlabs_api_key
   ELEVENLABS_VOICE_ID=pNInz6obpgDQGcFmaJgB
   ```
3. Configure the dashboard environment variables. Create a file named `analytics-dashboard/.env.local` containing:
   ```env
   MONGO_URI=mongodb://localhost:27017/voice-agent-telemetry
   VOICE_ENGINE_URL=http://localhost:5050
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_nextauth_jwt_signing_secret
   
   # Razorpay API Credentials
   NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   ```

### Step 2: Spin Up the Stack with Docker Compose

Build the images and run the containerized stack:
```bash
docker compose up --build -d
```
This command spins up the following services:
* **mongodb**: Dedicated database container running on port 27017.
* **voice-engine**: Node.js microservice running on port 5050.
* **analytics-dashboard**: Next.js 14 app running on port 3000.
* **ngrok**: Tunneling utility establishing local webhooks to Twilio.

Verify all containers are up and running:
```bash
docker compose ps
```

### Step 3: Seed Database and Create Test User

From the root directory, navigate to the `analytics-dashboard` folder and seed the database with the default testing credentials:
```bash
cd analytics-dashboard
npm install
node seed.js
```
This will seed the database with the default user:
* **Username**: `testuser`
* **Password**: `password123`
* **Starting Balance**: `$20.00`

### Step 4: Login and Make Outbound Calls

1. Open your browser and navigate to `http://localhost:3000`.
2. Log in using the seeded credentials.
3. Access the **Campaigns** tab (`/campaigns`) to manually add single contacts or upload a CSV containing target recipients.
4. Click **Call Now** next to a contact. The system will optimize the raw instruction, establish the SIP connection to the phone, generate a custom greeting, and initiate live voice dialogue.
