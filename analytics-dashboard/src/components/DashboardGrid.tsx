'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import CostChart from './CostChart';
import VendorPie from './VendorPie';


interface DashboardGridProps {
  stats: {
    totalCalls: number;
    totalDuration: number;
    totalCost: number;
    dailyCostTimeSeries: Array<{ date: string; cost: number; calls: number }>;
    vendorCosts: {
      twilioCost: number;
      deepgramCost: number;
      groqCost: number;
      elevenlabsCost: number;
    };
  };
  recentCalls: Array<{
    _id: string;
    phoneNumber: string;
    status: string;
    duration: number;
    costDetails: { totalCost: number };
    startTime: string;
  }>;
}

export default function DashboardGrid({ stats, recentCalls }: DashboardGridProps) {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Compute metrics
  const twilioMinutes = (stats.vendorCosts.twilioCost / 0.015).toFixed(1);
  const deepgramHours = (stats.vendorCosts.deepgramCost / 0.24).toFixed(1); // assuming $0.004/min = $0.24/hour
  const groqTokens = (stats.vendorCosts.groqCost / 0.05 * 1000000).toFixed(0); // assuming $0.05 per 1M tokens
  const elevenlabsHours = (stats.vendorCosts.elevenlabsCost / 5.4).toFixed(1); // assuming $0.09/min = $5.40/hour

  const openModal = (id: string) => setActiveModal(id);
  const closeModal = () => setActiveModal(null);

  return (
    <div className="space-y-gutter relative z-0">
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
        {/* Card 1: Twilio */}
        <div 
          onClick={() => openModal('twilio')}
          className="surface-card rounded-xl p-card-padding shadow-soft border border-outline-variant flex flex-col cursor-pointer hover:shadow-md transition-shadow relative group"
        >
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">open_in_full</span>
          </div>
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Twilio (PSTN)</p>
              <h3 className="font-metric-lg text-metric-lg text-on-surface mt-1">${stats.vendorCosts.twilioCost.toFixed(3)}</h3>
            </div>
            <div className="w-8 h-8 rounded bg-accent-yellow flex items-center justify-center">
              <span className="material-symbols-outlined text-on-tertiary-fixed text-[18px]">call</span>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <span className="font-label-md text-label-md text-trend-up flex items-center font-semibold">
              <span className="material-symbols-outlined text-[14px]">trending_up</span> {twilioMinutes}m
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">total call time</span>
          </div>
          {/* Sparkline mini graphic placeholder */}
          <div className="mt-auto h-12 w-full relative">
            <svg className="w-full h-full preserve-aspect-none" fill="none" stroke="currentColor" style={{ padding: '2px' }} viewBox="0 0 100 30">
              <path className="text-outline stroke-2 draw-line" d="M0,15 Q10,20 20,15 T40,25 T60,20 T80,28 T100,25" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
          </div>
        </div>

        {/* Card 2: Deepgram */}
        <div 
          onClick={() => openModal('deepgram')}
          className="surface-card rounded-xl p-card-padding shadow-soft border border-outline-variant flex flex-col cursor-pointer hover:shadow-md transition-shadow relative group"
        >
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">open_in_full</span>
          </div>
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Deepgram (STT)</p>
              <h3 className="font-metric-lg text-metric-lg text-on-surface mt-1">${stats.vendorCosts.deepgramCost.toFixed(3)}</h3>
            </div>
            <div className="w-8 h-8 rounded bg-accent-mint flex items-center justify-center">
              <span className="material-symbols-outlined text-trend-up text-[18px]">graphic_eq</span>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <span className="font-label-md text-label-md text-trend-up flex items-center font-semibold">
              <span className="material-symbols-outlined text-[14px]">trending_up</span> {deepgramHours}h
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">audio processed</span>
          </div>
          <div className="mt-auto h-12 w-full relative">
            <svg className="w-full h-full preserve-aspect-none" fill="none" stroke="currentColor" style={{ padding: '2px' }} viewBox="0 0 100 30">
              <path className="text-trend-up stroke-2 draw-line" d="M0,20 Q10,15 20,20 T40,10 T60,18 T80,12 T100,15" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
          </div>
        </div>

        {/* Card 3: Groq */}
        <div 
          onClick={() => openModal('groq')}
          className="surface-card rounded-xl p-card-padding shadow-soft border border-outline-variant flex flex-col cursor-pointer hover:shadow-md transition-shadow relative group"
        >
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">open_in_full</span>
          </div>
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Groq (Llama 3.1)</p>
              <h3 className="font-metric-lg text-metric-lg text-on-surface mt-1">${stats.vendorCosts.groqCost.toFixed(3)}</h3>
            </div>
            <div className="w-8 h-8 rounded bg-accent-blue flex items-center justify-center">
              <span className="material-symbols-outlined text-secondary text-[18px]">memory</span>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <span className="font-label-md text-label-md text-trend-up flex items-center font-semibold">
              <span className="material-symbols-outlined text-[14px]">trending_up</span> {parseInt(groqTokens).toLocaleString()}
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">tokens generated</span>
          </div>
          <div className="mt-auto h-12 w-full relative">
            <svg className="w-full h-full preserve-aspect-none" fill="none" stroke="currentColor" style={{ padding: '2px' }} viewBox="0 0 100 30">
              <path className="text-secondary stroke-2 draw-line" d="M0,22 Q10,25 20,18 T40,15 T60,8 T80,12 T100,5" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
          </div>
        </div>

        {/* Card 4: ElevenLabs */}
        <div 
          onClick={() => openModal('elevenlabs')}
          className="surface-card rounded-xl p-card-padding shadow-soft border border-outline-variant flex flex-col cursor-pointer hover:shadow-md transition-shadow relative group"
        >
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">open_in_full</span>
          </div>
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">ElevenLabs (TTS)</p>
              <h3 className="font-metric-lg text-metric-lg text-on-surface mt-1">${stats.vendorCosts.elevenlabsCost.toFixed(3)}</h3>
            </div>
            <div className="w-8 h-8 rounded bg-accent-purple flex items-center justify-center">
              <span className="material-symbols-outlined text-on-secondary-fixed-variant text-[18px]">record_voice_over</span>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <span className="font-label-md text-label-md text-trend-up flex items-center font-semibold">
              <span className="material-symbols-outlined text-[14px]">trending_up</span> {elevenlabsHours}h
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">voice synthesized</span>
          </div>
          <div className="mt-auto h-12 w-full relative">
            <svg className="w-full h-full preserve-aspect-none" fill="none" stroke="currentColor" style={{ padding: '2px' }} viewBox="0 0 100 30">
              <path className="text-secondary stroke-2 draw-line" d="M0,25 Q10,20 20,25 T40,15 T60,20 T80,5 T100,10" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
          </div>
        </div>
      </div>

      {/* Recharts Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-gutter">
        <div className="lg:col-span-4 bg-surface-card rounded-xl p-card-padding shadow-soft border border-outline-variant">
          <div className="mb-4">
            <h3 className="font-headline-md text-headline-md font-semibold text-on-surface">Daily Spend Trend</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Day-to-day cost timeline across all API providers</p>
          </div>
          <CostChart data={stats.dailyCostTimeSeries} />
        </div>

        <div className="lg:col-span-3 bg-surface-card rounded-xl p-card-padding shadow-soft border border-outline-variant">
          <div className="mb-4">
            <h3 className="font-headline-md text-headline-md font-semibold text-on-surface">Cost Split by Vendor</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Visual breakdown of API infrastructure spend</p>
          </div>
          <VendorPie data={stats.vendorCosts} />
        </div>
      </div>

      {/* Bento Layout: Activity & Remaining calls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        {/* Recent Activity Log */}
        <div className="lg:col-span-2 bg-surface-card rounded-xl p-card-padding shadow-soft border border-outline-variant flex flex-col h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-headline-md text-headline-md font-semibold text-on-surface">Recent Activity Log</h3>
            <Link href="/calls" className="font-label-md text-label-md text-secondary hover:underline font-semibold">View All</Link>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {recentCalls.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-on-surface-variant text-sm py-10">
                <span className="material-symbols-outlined text-[36px] mb-2 text-on-surface-variant/40">history</span>
                No call logs available yet. Start outbound voice campaigns!
              </div>
            ) : (
              recentCalls.map((call) => {
                const callDate = new Date(call.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const callStatus = call.status === 'completed';
                return (
                  <div key={call._id} className="flex items-start gap-4 pb-4 border-b border-surface-container last:border-0">
                    <div className={`w-2px h-2px rounded-full mt-2 shrink-0 ${callStatus ? 'bg-trend-up w-2 h-2' : 'bg-trend-down w-2 h-2'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <p className="font-body-md text-body-md font-medium text-on-surface truncate">
                          {callStatus ? 'Outbound Call Completed' : `Call Failed (${call.status})`}
                        </p>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">{callDate}</span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Phone: <span className="font-medium text-on-surface">{call.phoneNumber}</span></p>
                      {callStatus && (
                        <div className="flex gap-2 mt-2">
                          <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-md text-[10px]">
                            Duration: {Math.floor(call.duration / 60)}m {call.duration % 60}s
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-md text-[10px]">
                            Cost: ${call.costDetails.totalCost.toFixed(4)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Live Call / Active Capacity status */}
        <div className="bg-surface-card rounded-xl p-card-padding shadow-soft border border-outline-variant flex flex-col h-[400px]">
          <h3 className="font-headline-md text-headline-md font-semibold text-on-surface mb-6 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-trend-up animate-pulse"></span>
            System Status
          </h3>
          <div className="flex-1 flex flex-col justify-center items-center relative">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
              <svg className="w-64 h-64 absolute animate-spin-slow" viewBox="0 0 100 100">
                <circle className="text-secondary" cx="50" cy="50" fill="none" r="25" stroke="currentColor" strokeWidth="1"></circle>
                <circle className="text-secondary" cx="50" cy="50" fill="none" r="35" stroke="currentColor" strokeDasharray="4,4" strokeWidth="1"></circle>
                <circle className="text-outline-variant" cx="50" cy="50" fill="none" r="45" stroke="currentColor" strokeWidth="1"></circle>
              </svg>
            </div>
            <div className="text-center z-10 bg-surface-card w-32 h-32 rounded-full shadow-soft border border-outline-variant flex flex-col items-center justify-center p-4">
              <h4 className="font-metric-lg text-[32px] leading-none font-bold text-secondary">0</h4>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mt-1 font-semibold">Active Calls</p>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            <div className="flex justify-between items-center font-body-sm text-body-sm">
              <span className="text-on-surface-variant">Concurrency Limit</span>
              <span className="font-semibold text-on-surface">0 / 100</span>
            </div>
            <div className="w-full bg-surface-container rounded-full h-1.5">
              <div className="bg-secondary h-1.5 rounded-full" style={{ width: '0%' }}></div>
            </div>
            <div className="flex justify-between items-center font-body-sm text-body-sm pt-2">
              <span className="text-on-surface-variant flex items-center gap-1 font-medium">
                <span className="material-symbols-outlined text-[14px]">speed</span> Avg Latency
              </span>
              <span className="font-semibold text-trend-up">280ms</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modals for detailed performance breakdown */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-tertiary/40 backdrop-blur-sm">
          <div className="bg-surface-card w-full max-w-xl p-8 rounded-2xl shadow-xl border border-outline-variant relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface transition-colors"
              onClick={closeModal}
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            {activeModal === 'twilio' && (
              <>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-lg bg-accent-yellow flex items-center justify-center">
                    <span className="material-symbols-outlined text-on-tertiary-fixed text-[24px]">call</span>
                  </div>
                  <div>
                    <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">Twilio (PSTN) Usage</h2>
                    <p className="font-body-md text-body-md text-on-surface-variant">Detailed performance breakdown</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant">
                    <p className="font-label-md text-label-md text-on-surface-variant mb-1 font-semibold">Total Minutes</p>
                    <p className="font-headline-md text-[18px] font-bold text-on-surface">{twilioMinutes} mins</p>
                  </div>
                  <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant">
                    <p className="font-label-md text-label-md text-on-surface-variant mb-1 font-semibold">Accumulated Cost</p>
                    <p className="font-headline-md text-[18px] font-bold text-on-surface">${stats.vendorCosts.twilioCost.toFixed(4)}</p>
                  </div>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Twilio API voice connections dial cellular/PSTN networks at a baseline rate of <strong>$0.015 per minute</strong>.
                </p>
              </>
            )}

            {activeModal === 'deepgram' && (
              <>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-lg bg-accent-mint flex items-center justify-center">
                    <span className="material-symbols-outlined text-trend-up text-[24px]">graphic_eq</span>
                  </div>
                  <div>
                    <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">Deepgram (STT) Usage</h2>
                    <p className="font-body-md text-body-md text-on-surface-variant">Detailed performance breakdown</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant">
                    <p className="font-label-md text-label-md text-on-surface-variant mb-1 font-semibold">Processed Audio</p>
                    <p className="font-headline-md text-[18px] font-bold text-on-surface">{(stats.vendorCosts.deepgramCost / 0.004).toFixed(1)} mins</p>
                  </div>
                  <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant">
                    <p className="font-label-md text-label-md text-on-surface-variant mb-1 font-semibold">Accumulated Cost</p>
                    <p className="font-headline-md text-[18px] font-bold text-on-surface">${stats.vendorCosts.deepgramCost.toFixed(4)}</p>
                  </div>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Deepgram STT transcriber converts real-time conversational user audio streams to text at a rate of <strong>$0.004 per minute</strong>.
                </p>
              </>
            )}

            {activeModal === 'groq' && (
              <>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-lg bg-accent-blue flex items-center justify-center">
                    <span className="material-symbols-outlined text-secondary text-[24px]">memory</span>
                  </div>
                  <div>
                    <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">Groq (Llama 3.1) Usage</h2>
                    <p className="font-body-md text-body-md text-on-surface-variant">Detailed performance breakdown</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant">
                    <p className="font-label-md text-label-md text-on-surface-variant mb-1 font-semibold font-bold">Estimated Tokens</p>
                    <p className="font-headline-md text-[18px] font-bold text-on-surface">{parseInt(groqTokens).toLocaleString()} tokens</p>
                  </div>
                  <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant">
                    <p className="font-label-md text-label-md text-on-surface-variant mb-1 font-semibold font-bold">Accumulated Cost</p>
                    <p className="font-headline-md text-[18px] font-bold text-on-surface">${stats.vendorCosts.groqCost.toFixed(4)}</p>
                  </div>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Groq Cloud powers low-latency Llama 3.1 8B text generation at an infrastructure rate of approximately <strong>$0.05 per 1M tokens</strong>.
                </p>
              </>
            )}

            {activeModal === 'elevenlabs' && (
              <>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-lg bg-accent-purple flex items-center justify-center">
                    <span className="material-symbols-outlined text-on-secondary-fixed-variant text-[24px]">record_voice_over</span>
                  </div>
                  <div>
                    <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">ElevenLabs (TTS) Usage</h2>
                    <p className="font-body-md text-body-md text-on-surface-variant">Detailed performance breakdown</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant">
                    <p className="font-label-md text-label-md text-on-surface-variant mb-1 font-semibold">Synthesized Audio</p>
                    <p className="font-headline-md text-[18px] font-bold text-on-surface">{(stats.vendorCosts.elevenlabsCost / 0.09).toFixed(1)} mins</p>
                  </div>
                  <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant">
                    <p className="font-label-md text-label-md text-on-surface-variant mb-1 font-semibold font-bold">Accumulated Cost</p>
                    <p className="font-headline-md text-[18px] font-bold text-on-surface">${stats.vendorCosts.elevenlabsCost.toFixed(4)}</p>
                  </div>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  ElevenLabs speech generation synthesizes text into high-fidelity custom voices at a rate of <strong>$0.09 per minute</strong>.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
