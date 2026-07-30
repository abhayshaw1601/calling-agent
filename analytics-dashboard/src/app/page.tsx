'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';

const SIMULATED_CALL_LOG = [
  { role: 'agent', text: "Hello! This is Alex from CloudVault. I noticed you signed up for our trials recently." },
  { role: 'user', text: "Oh, hi! Yes, I was looking for a secure database backup tool." },
  { role: 'agent', text: "Perfect. We offer automated, encrypted backups that run hourly. Would you like to enable a free 30-day trial?" },
  { role: 'user', text: "That sounds great, does it support MongoDB and PostgreSQL?" },
  { role: 'agent', text: "Absolutely, it connects natively to both with one-click setup. I can configure it for you right now." },
  { role: 'user', text: "Yes, please do that. Thank you!" },
  { role: 'agent', text: "All set! Check your email for verification. Have a great day!" }
];

export default function LandingPage() {
  const [activeDialogIndex, setActiveDialogIndex] = useState(0);
  const [liveCost, setLiveCost] = useState(0.0000);
  const { data: session } = useSession();

  // Simulate call transcript typing & live cost ticking
  useEffect(() => {
    const dialogTimer = setInterval(() => {
      setActiveDialogIndex((prev) => (prev < SIMULATED_CALL_LOG.length - 1 ? prev + 1 : 0));
    }, 4000);

    const costTimer = setInterval(() => {
      setLiveCost((prev) => {
        const next = prev + 0.0004;
        return next > 0.045 ? 0.0000 : next;
      });
    }, 200);

    return () => {
      clearInterval(dialogTimer);
      clearInterval(costTimer);
    };
  }, []);

  return (
    <div className="bg-neutral-950 text-neutral-100 min-h-screen selection:bg-blue-500/30 selection:text-blue-200">
      
      {/* 1. Glassmorphic Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-neutral-50 to-neutral-400 bg-clip-text text-transparent">
              VoiceAgent AI
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-neutral-400 hover:text-neutral-100 transition-colors">Features</a>
            <a href="#demo" className="text-sm text-neutral-400 hover:text-neutral-100 transition-colors">Interactive Demo</a>
            <a href="#pricing" className="text-sm text-neutral-400 hover:text-neutral-100 transition-colors">Infrastructure Rates</a>
          </nav>

          <div className="flex items-center gap-4">
            {session ? (
              <Link 
                href="/dashboard" 
                className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition-all px-4 py-2 rounded-lg shadow-lg shadow-blue-500/20"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-neutral-400 hover:text-neutral-100 transition-colors px-3 py-1.5">
                  Sign In
                </Link>
                <Link 
                  href="/signup" 
                  className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition-all px-4 py-2 rounded-lg shadow-lg shadow-blue-500/20"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-20 pb-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Copy */}
          <div className="lg:col-span-6 space-y-6 text-left z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-950/20 text-xs text-blue-400 font-semibold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
              Outbound Voice Campaigns
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter leading-none text-neutral-50">
              Outbound Voice Campaigns.<br />
              <span className="bg-gradient-to-r from-blue-500 to-blue-300 bg-clip-text text-transparent">
                Powered by Conversational AI.
              </span>
            </h1>

            <p className="text-base text-neutral-400 leading-relaxed max-w-[65ch]">
              Initiate thousands of natural, low-latency calls. Automate outbound sales, support, and surveys with real-time billing.
            </p>

            <div className="flex items-center gap-4 pt-4">
              <Link 
                href="/signup" 
                className="px-6 py-3 font-semibold text-white bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition-all rounded-lg shadow-lg shadow-blue-500/30 text-center"
              >
                Start Campaign
              </Link>
              <a 
                href="#demo" 
                className="px-6 py-3 font-semibold text-neutral-300 hover:text-neutral-50 hover:bg-neutral-900 border border-neutral-800 transition-all rounded-lg text-center"
              >
                Watch Call Live
              </a>
            </div>
          </div>

          {/* Right Column: Visual Mockup */}
          <div className="lg:col-span-6 relative flex justify-center">
            <div className="absolute inset-0 bg-blue-500/10 blur-[120px] rounded-full" />
            <div className="relative border border-neutral-800 bg-neutral-950 p-2 rounded-2xl shadow-2xl shadow-blue-500/5 max-w-[500px] w-full">
              <Image 
                src="/hero-mockup.png" 
                alt="VoiceAgent AI Live Telemetry Dashboard Mockup" 
                width={500} 
                height={281} 
                className="rounded-xl border border-neutral-900 opacity-90 object-cover aspect-video"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. Interactive Call Demo & Simulation Console */}
      <section id="demo" className="py-20 border-t border-neutral-900 bg-neutral-950/40 relative">
        <div className="max-w-5xl mx-auto px-6 text-center space-y-8">
          <div className="space-y-3">
            <h2 className="text-3xl font-bold tracking-tight">Live Voice Synthesis</h2>
            <p className="text-neutral-400 max-w-xl mx-auto">
              Witness our AI agent conduct a call in real time, showing sub-second response latency and cost telemetry.
            </p>
          </div>

          {/* Live Simulator Interface */}
          <div className="border border-neutral-800 bg-neutral-950 rounded-2xl shadow-2xl p-6 text-left max-w-3xl mx-auto space-y-6">
            
            {/* Header / Cost Telemetry */}
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-neutral-400 uppercase font-semibold font-mono tracking-wider">Active Stream (Twilio SIP)</span>
              </div>
              <div className="flex gap-4 font-mono text-xs">
                <div>
                  <span className="text-neutral-500">Latency:</span> <span className="text-blue-400 font-bold">~640ms</span>
                </div>
                <div>
                  <span className="text-neutral-500">Cost:</span> <span className="text-emerald-400 font-bold">${liveCost.toFixed(4)}</span>
                </div>
              </div>
            </div>

            {/* Conversation Log Box */}
            <div className="space-y-4 h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-neutral-800">
              {SIMULATED_CALL_LOG.slice(0, activeDialogIndex + 1).map((log, idx) => (
                <div 
                  key={idx} 
                  className={`flex flex-col max-w-[80%] ${log.role === 'agent' ? 'mr-auto items-start' : 'ml-auto items-end text-right'}`}
                >
                  <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-mono mb-1">
                    {log.role === 'agent' ? 'AI Assistant (ElevenLabs)' : 'User (Callee)'}
                  </span>
                  <div className={`p-3.5 rounded-xl text-sm font-medium leading-relaxed ${
                    log.role === 'agent' 
                      ? 'bg-blue-950/30 text-blue-100 border border-blue-900/40 rounded-tl-none' 
                      : 'bg-neutral-900 text-neutral-200 border border-neutral-800 rounded-tr-none'
                  }`}>
                    {log.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Feature Grid (Bento Layout) */}
      <section id="features" className="py-20 border-t border-neutral-900">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold tracking-tight">Built For High-Performance Voice Apps</h2>
            <p className="text-neutral-400 max-w-xl mx-auto">
              Our low-latency calling pipeline integrates state-of-the-art AI networks into a unified campaign workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Cell 1: Latency */}
            <div className="md:col-span-7 p-8 rounded-2xl border border-neutral-800 bg-neutral-900/30 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 blur-xl group-hover:bg-blue-500/20 transition-colors" />
              <h3 className="text-lg font-bold text-neutral-100 mb-2">Sub-Second Response Latency</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">
                By piping Deepgram's streaming WebSockets directly to Groq's low-latency Llama-3.1 model, the agent responds within milliseconds of the customer finishing a sentence.
              </p>
            </div>

            {/* Cell 2: Audio Synthesis */}
            <div className="md:col-span-5 p-8 rounded-2xl border border-neutral-800 bg-neutral-900/30 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 blur-xl group-hover:bg-amber-500/20 transition-colors" />
              <h3 className="text-lg font-bold text-neutral-100 mb-2">Human-Grade Voice Synthesis</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Seamless ElevenLabs integration generates high-fidelity, emotion-matched voices optimized for telephonic audio standards.
              </p>
            </div>

            {/* Cell 3: Twilio */}
            <div className="md:col-span-5 p-8 rounded-2xl border border-neutral-800 bg-neutral-900/30 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/10 blur-xl group-hover:bg-red-500/20 transition-colors" />
              <h3 className="text-lg font-bold text-neutral-100 mb-2">SIP WebSockets Stream</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Hooks natively into Twilio's Media Stream API. No proxy call servers or routing relays are used, which preserves maximum audio clarity.
              </p>
            </div>

            {/* Cell 4: Wallet Billing */}
            <div className="md:col-span-7 p-8 rounded-2xl border border-neutral-800 bg-neutral-900/30 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 blur-xl group-hover:bg-emerald-500/20 transition-colors" />
              <h3 className="text-lg font-bold text-neutral-100 mb-2">Granular Micro-billing</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Credits are debited in real time based on milliseconds of audio streamed, characters synthesized, and tokens computed. No hidden monthly platform subscriptions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Infrastructure Pricing Section */}
      <section id="pricing" className="py-20 border-t border-neutral-900 bg-neutral-950/40">
        <div className="max-w-4xl mx-auto px-6 space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold tracking-tight">Pay-As-You-Go Infrastructure</h2>
            <p className="text-neutral-400 max-w-lg mx-auto">
              Our rates are completely transparent. Charges are computed down to the millisecond of active call runtime.
            </p>
          </div>

          <div className="border border-neutral-800 bg-neutral-950 rounded-2xl overflow-hidden shadow-2xl">
            <div className="divide-y divide-neutral-900 font-mono text-sm">
              {[
                { service: "Twilio Outbound Trunk", rate: "$0.0140 / minute", tag: "carrier" },
                { service: "Deepgram STT (Nova 2)", rate: "$0.0059 / minute", tag: "speech-to-text" },
                { service: "Groq LLM Llama 3.1 8b", rate: "$0.00005 / 1k tokens", tag: "reasoning" },
                { service: "ElevenLabs TTS Speech", rate: "$0.00003 / character", tag: "voice-synthesis" }
              ].map((pricing, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 hover:bg-neutral-900/30 transition-colors gap-3">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-neutral-800 text-neutral-400 uppercase tracking-widest">{pricing.tag}</span>
                    <span className="font-semibold text-neutral-200">{pricing.service}</span>
                  </div>
                  <span className="text-blue-400 font-semibold">{pricing.rate}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 6. CTA Footer Section */}
      <section className="py-20 border-t border-neutral-900 text-center relative overflow-hidden bg-neutral-950">
        <div className="absolute inset-0 bg-blue-600/5 blur-[150px]" />
        <div className="max-w-3xl mx-auto px-6 space-y-8 z-10 relative">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-neutral-100">
            Scale Your Outbound Operations Today.
          </h2>
          <p className="text-neutral-400 text-base max-w-md mx-auto">
            Top up your wallet instantly using UPI, Netbanking, or cards via Razorpay. Only pay for what you stream.
          </p>
          <div className="flex justify-center pt-2">
            <Link 
              href={session ? "/dashboard" : "/signup"} 
              className="px-8 py-4 font-semibold text-white bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition-all rounded-lg shadow-xl shadow-blue-500/20"
            >
              {session ? "Go to Dashboard" : "Get Started"}
            </Link>
          </div>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="border-t border-neutral-900 py-8 bg-neutral-950 text-center text-xs text-neutral-600">
        <p>© 2026 VoiceAgent AI Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}
