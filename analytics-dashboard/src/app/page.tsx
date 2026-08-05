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
    <div className="bg-canvas-bg text-on-surface min-h-screen selection:bg-accent-blue selection:text-secondary">
      
      {/* 1. Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-outline-variant/60 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shrink-0 border border-outline-variant/40">
              <img src="/logo.png" alt="SnowVoice AI" className="w-full h-full object-cover" />
            </div>
            <span className="text-lg font-bold tracking-tight text-primary">
              SnowVoice AI
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 font-body-md text-body-md text-on-surface-variant font-medium">
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#demo" className="hover:text-primary transition-colors">Interactive Demo</a>
            <a href="#pricing" className="hover:text-primary transition-colors">Infrastructure Rates</a>
          </nav>

          <div className="flex items-center gap-3">
            {session ? (
              <Link 
                href="/dashboard" 
                className="px-4 py-2 bg-primary text-on-primary font-semibold text-label-md rounded-lg hover:bg-inverse-surface active:scale-[0.98] transition-all shadow-sm"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="font-semibold text-label-md text-on-surface-variant hover:text-primary transition-colors px-3 py-2">
                  Sign In
                </Link>
                <Link 
                  href="/signup" 
                  className="px-4 py-2 bg-primary text-on-primary font-semibold text-label-md rounded-lg hover:bg-inverse-surface active:scale-[0.98] transition-all shadow-sm"
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
        {/* Glow vector backgrounds */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-accent-blue/40 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-accent-purple/35 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          
          {/* Left Column: Copy */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-secondary/20 bg-accent-blue/50 text-[11px] text-secondary font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-trend-up animate-pulse" />
              Outbound Voice Campaigns
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter leading-tight text-primary">
              Outbound Voice Campaigns.<br />
              <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
                Powered by Conversational AI.
              </span>
            </h1>

            <p className="text-base text-on-surface-variant leading-relaxed max-w-[60ch]">
              Initiate thousands of natural, low-latency calls. Automate outbound sales, follow-ups, and support loops with automated real-time billing.
            </p>

            <div className="flex items-center gap-4 pt-2">
              <Link 
                href="/signup" 
                className="px-6 py-3 bg-primary hover:bg-inverse-surface text-on-primary font-semibold text-body-md rounded-lg active:scale-[0.98] transition-all shadow-md"
              >
                Start Campaign
              </Link>
              <a 
                href="#demo" 
                className="px-6 py-3 border border-outline-variant bg-white hover:bg-surface-container-low text-primary font-semibold text-body-md rounded-lg transition-all"
              >
                Watch Call Live
              </a>
            </div>
          </div>

          {/* Right Column: Visual Mockup */}
          <div className="lg:col-span-6 relative flex justify-center">
            <div className="relative border border-outline-variant/60 bg-surface-card p-2 rounded-2xl shadow-soft max-w-[500px] w-full">
              <Image 
                src="/hero-mockup.png" 
                alt="SnowVoice AI Live Telemetry Dashboard Mockup" 
                width={500} 
                height={281} 
                className="rounded-xl border border-surface-container object-cover aspect-video"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. Interactive Call Demo & Simulation Console */}
      <section id="demo" className="py-20 border-t border-outline-variant/30 bg-surface-container-low/30 relative">
        <div className="max-w-5xl mx-auto px-6 text-center space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-primary">Live Voice Synthesis</h2>
            <p className="text-on-surface-variant max-w-xl mx-auto font-body-md">
              Witness our AI agent conduct a campaign call in real-time, showcasing sub-second response latency and cost telemetry.
            </p>
          </div>

          {/* Live Simulator Interface Card */}
          <div className="border border-outline-variant bg-surface-card rounded-2xl shadow-soft p-6 text-left max-w-3xl mx-auto space-y-6">
            
            {/* Header / Cost Telemetry */}
            <div className="flex items-center justify-between pb-4 border-b border-surface-container">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-trend-up animate-pulse" />
                <span className="text-[10px] text-on-surface-variant uppercase font-semibold font-mono tracking-wider">Active Stream (Twilio SIP)</span>
              </div>
              <div className="flex gap-4 font-mono text-xs">
                <div>
                  <span className="text-on-surface-variant/60">Latency:</span> <span className="text-secondary font-bold">~640ms</span>
                </div>
                <div>
                  <span className="text-on-surface-variant/60">Cost:</span> <span className="text-trend-up font-bold">${liveCost.toFixed(4)}</span>
                </div>
              </div>
            </div>

            {/* Conversation Log Box */}
            <div className="space-y-4 h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-surface-variant">
              {SIMULATED_CALL_LOG.slice(0, activeDialogIndex + 1).map((log, idx) => (
                <div 
                  key={idx} 
                  className={`flex flex-col max-w-[80%] ${log.role === 'agent' ? 'mr-auto items-start' : 'ml-auto items-end text-right'}`}
                >
                  <span className="text-[9px] text-on-surface-variant/60 uppercase tracking-widest font-mono mb-1">
                    {log.role === 'agent' ? 'AI Assistant (ElevenLabs)' : 'User (Callee)'}
                  </span>
                  <div className={`p-3.5 rounded-2xl text-xs font-semibold leading-relaxed ${
                    log.role === 'agent' 
                      ? 'bg-accent-blue/50 text-secondary border border-secondary/10 rounded-tl-none' 
                      : 'bg-surface-container-low text-primary border border-outline-variant/30 rounded-tr-none'
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
      <section id="features" className="py-20 border-t border-outline-variant/30">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-primary">Built For High-Performance Voice Apps</h2>
            <p className="text-on-surface-variant max-w-xl mx-auto font-body-md">
              Our low-latency calling pipeline integrates state-of-the-art AI infrastructure into a unified campaign workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Cell 1: Latency */}
            <div className="md:col-span-7 p-8 rounded-2xl border border-outline-variant bg-surface-card relative overflow-hidden group hover:shadow-soft transition-shadow">
              <div className="absolute top-0 right-0 w-24 h-24 bg-accent-blue rounded-full blur-2xl opacity-40 pointer-events-none" />
              <h3 className="text-lg font-bold text-primary mb-2">Sub-Second Response Latency</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                By piping Deepgram's streaming WebSockets directly to Groq's low-latency Llama-3.1 model, the agent responds within milliseconds of the customer finishing a sentence.
              </p>
            </div>

            {/* Cell 2: Audio Synthesis */}
            <div className="md:col-span-5 p-8 rounded-2xl border border-outline-variant bg-surface-card relative overflow-hidden group hover:shadow-soft transition-shadow">
              <div className="absolute top-0 right-0 w-20 h-20 bg-accent-yellow rounded-full blur-2xl opacity-40 pointer-events-none" />
              <h3 className="text-lg font-bold text-primary mb-2">Human-Grade Voice Synthesis</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Seamless ElevenLabs integration generates high-fidelity, emotion-matched voices optimized for telephonic audio standards.
              </p>
            </div>

            {/* Cell 3: Twilio */}
            <div className="md:col-span-5 p-8 rounded-2xl border border-outline-variant bg-surface-card relative overflow-hidden group hover:shadow-soft transition-shadow">
              <div className="absolute top-0 right-0 w-20 h-20 bg-accent-purple rounded-full blur-2xl opacity-40 pointer-events-none" />
              <h3 className="text-lg font-bold text-primary mb-2">SIP WebSockets Stream</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Hooks natively into Twilio's Media Stream API. No proxy call servers or routing relays are used, preserving maximum audio clarity.
              </p>
            </div>

            {/* Cell 4: Wallet Billing */}
            <div className="md:col-span-7 p-8 rounded-2xl border border-outline-variant bg-surface-card relative overflow-hidden group hover:shadow-soft transition-shadow">
              <div className="absolute top-0 right-0 w-24 h-24 bg-accent-mint rounded-full blur-2xl opacity-45 pointer-events-none" />
              <h3 className="text-lg font-bold text-primary mb-2">Granular Micro-billing</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Credits are debited in real time based on milliseconds of audio streamed, characters synthesized, and tokens computed. No hidden monthly platform subscriptions.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 5. Infrastructure Pricing Section */}
      <section id="pricing" className="py-20 border-t border-outline-variant/30 bg-surface-container-low/30">
        <div className="max-w-4xl mx-auto px-6 space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-primary">Pay-As-You-Go Infrastructure</h2>
            <p className="text-on-surface-variant max-w-lg mx-auto font-body-md">
              Our rates are completely transparent. Charges are computed down to the millisecond of active call runtime.
            </p>
          </div>

          <div className="border border-outline-variant bg-surface-card rounded-2xl overflow-hidden shadow-soft">
            <div className="divide-y divide-surface-container font-mono text-xs">
              {[
                { service: "Twilio Outbound Trunk", rate: "$0.0150 / minute", tag: "carrier", color: "bg-accent-yellow text-on-tertiary-fixed border-outline-variant/30" },
                { service: "Deepgram STT (Nova 2)", rate: "$0.0040 / minute", tag: "speech-to-text", color: "bg-accent-mint text-trend-up border-trend-up/20" },
                { service: "Groq LLM Llama 3.1 8b", rate: "$0.0500 / 1M tokens", tag: "reasoning", color: "bg-accent-blue text-secondary border-secondary/20" },
                { service: "ElevenLabs TTS Speech", rate: "$0.0900 / minute", tag: "voice-synthesis", color: "bg-accent-purple text-on-secondary-container border-outline-variant/30" }
              ].map((pricing, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 hover:bg-surface-container-low transition-colors gap-3">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${pricing.color}`}>{pricing.tag}</span>
                    <span className="font-semibold text-primary">{pricing.service}</span>
                  </div>
                  <span className="text-secondary font-bold">{pricing.rate}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 6. CTA Footer Section */}
      <section className="py-20 border-t border-outline-variant/30 text-center relative overflow-hidden bg-white">
        <div className="absolute inset-0 bg-accent-blue/15 blur-[120px] pointer-events-none" />
        <div className="max-w-3xl mx-auto px-6 space-y-6 z-10 relative">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-primary">
            Scale Your Outbound Operations Today.
          </h2>
          <p className="text-on-surface-variant text-sm max-w-md mx-auto">
            Top up your wallet instantly using UPI, Netbanking, or cards via Razorpay. Only pay for what you stream.
          </p>
          <div className="flex justify-center pt-2">
            <Link 
              href={session ? "/dashboard" : "/signup"} 
              className="px-8 py-4 font-semibold text-on-primary bg-primary hover:bg-inverse-surface active:scale-[0.98] transition-all rounded-lg shadow-md"
            >
              {session ? "Go to Dashboard" : "Get Started"}
            </Link>
          </div>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="border-t border-outline-variant/40 py-8 bg-surface-container-lowest text-center text-xs text-on-surface-variant/70">
        <p>© 2026 SnowVoice AI Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}
