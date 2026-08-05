'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface TranscriptEntry {
  role: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
}

interface CostDetails {
  twilioCost: number;
  deepgramCost: number;
  groqCost: number;
  elevenlabsCost: number;
  totalCost: number;
}

interface CallRecord {
  _id: string;
  callSid: string;
  phoneNumber: string;
  status: string;
  startTime: string;
  endTime?: string;
  duration: number;
  costDetails: CostDetails;
  transcript: TranscriptEntry[];
}

const formatDuration = (seconds: number) => {
  if (!seconds || seconds === 0) return '0s';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

const formatCost = (cost: number) => `$${(cost || 0).toFixed(4)}`;

const formatDate = (dateStr: string) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const formatTime = (dateStr: string) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const STATUS_TAG_CLASSES: Record<string, string> = {
  completed: 'bg-accent-mint text-trend-up border border-trend-up/20',
  failed: 'bg-error-container text-on-error-container border border-error/20',
  'in-progress': 'bg-accent-blue text-secondary border border-secondary/20',
  initiated: 'bg-accent-yellow text-on-tertiary-fixed border border-outline-variant/30',
  ringing: 'bg-accent-yellow text-on-tertiary-fixed border border-outline-variant/30',
};

export default function CallLogsPage() {
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null);

  useEffect(() => {
    const fetchCalls = async () => {
      try {
        const res = await fetch('/api/calls');
        const data = await res.json();
        if (data.success) {
          setCalls(data.calls);
        } else {
          setError(data.error || 'Failed to load call logs.');
        }
      } catch (err) {
        setError('Network error fetching call logs.');
      } finally {
        setLoading(false);
      }
    };
    fetchCalls();
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Call History Card Container */}
      <div className="bg-surface-card rounded-xl p-card-padding shadow-soft border border-outline-variant flex flex-col min-h-[500px]">
        <div className="flex items-center justify-between border-b border-surface-container pb-4 mb-6">
          <div>
            <h3 className="font-headline-md text-headline-md font-bold text-on-surface">Call Logs History</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
              Click on any call row to inspect the full transcript history and detailed vendor cost breakdown.
            </p>
          </div>
        </div>

        {/* Call Logs Table */}
        <div className="flex-1 overflow-x-auto">
          {loading ? (
            <div className="h-full flex items-center justify-center text-on-surface-variant text-sm py-16 animate-pulse">
              Loading calling logs database...
            </div>
          ) : error ? (
            <div className="h-full flex items-center justify-center text-error text-sm py-16 font-semibold">
              {error}
            </div>
          ) : calls.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-on-surface-variant text-sm py-16 text-center">
              <span className="material-symbols-outlined text-[48px] text-on-surface-variant/40 mb-3">history</span>
              <p className="font-medium text-on-surface">No calls executed yet</p>
              <p className="text-xs text-on-surface-variant/70 mt-1 max-w-xs">Logs will populate dynamically here once campaigns generate active calling streams.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-container text-label-md font-semibold text-on-surface-variant uppercase tracking-wider text-[11px]">
                  <th className="pb-3 pr-2">Call SID</th>
                  <th className="pb-3 px-2">Phone Number</th>
                  <th className="pb-3 px-2">Status</th>
                  <th className="pb-3 px-2">Date &amp; Start Time</th>
                  <th className="pb-3 px-2">Duration</th>
                  <th className="pb-3 pl-2 text-right">Total Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container">
                {calls.map((call) => (
                  <tr 
                    key={call._id} 
                    onClick={() => setSelectedCall(call)}
                    className="group hover:bg-surface-container-lowest transition-colors text-body-md text-on-surface cursor-pointer"
                  >
                    <td className="py-3.5 pr-2 font-mono text-[12px] text-on-surface-variant group-hover:text-primary transition-colors">
                      {call.callSid}
                    </td>
                    <td className="py-3.5 px-2 font-medium">{call.phoneNumber}</td>
                    <td className="py-3.5 px-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${STATUS_TAG_CLASSES[call.status] || 'bg-surface-container text-on-surface-variant'}`}>
                        {call.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-2 text-xs text-on-surface-variant font-medium">{formatDate(call.startTime)}</td>
                    <td className="py-3.5 px-2 text-xs text-on-surface-variant font-medium">{formatDuration(call.duration)}</td>
                    <td className="py-3.5 pl-2 text-right font-bold text-sm text-primary">
                      {formatCost(call.costDetails?.totalCost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Slide drawer / overlay modal for inspecting transcripts */}
      {selectedCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-tertiary/40 backdrop-blur-sm">
          <div className="bg-surface-card w-full max-w-xl h-full p-8 shadow-xl border-l border-outline-variant flex flex-col justify-between animate-in slide-in-from-right duration-300">
            <div>
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">Call Inspection Details</h2>
                  <p className="font-mono text-[11px] text-on-surface-variant mt-1">SID: {selectedCall.callSid}</p>
                </div>
                <button 
                  className="p-1 rounded-full hover:bg-surface-container-low text-on-surface-variant hover:text-on-surface transition-colors"
                  onClick={() => setSelectedCall(null)}
                >
                  <span className="material-symbols-outlined text-[24px]">close</span>
                </button>
              </div>

              {/* Metadata Summary Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6 bg-surface-container-low p-4 rounded-xl border border-outline-variant/60">
                <div>
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Phone Number</span>
                  <span className="text-body-md font-semibold text-primary block mt-0.5">{selectedCall.phoneNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Duration</span>
                  <span className="text-body-md font-semibold text-primary block mt-0.5">{formatDuration(selectedCall.duration)}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Status</span>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase mt-1 ${STATUS_TAG_CLASSES[selectedCall.status] || 'bg-surface-container text-on-surface-variant'}`}>
                    {selectedCall.status}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Start Date</span>
                  <span className="text-body-md font-semibold text-primary block mt-0.5">{formatDate(selectedCall.startTime)}</span>
                </div>
              </div>

              {/* Vendor Cost Breakdowns */}
              <div className="mb-6">
                <h4 className="font-label-md text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-2.5">Vendor Cost Splitting</h4>
                <div className="grid grid-cols-2 gap-3 bg-surface-container-lowest border border-outline-variant p-4 rounded-xl">
                  <div>
                    <span className="text-[10px] text-on-surface-variant/80 font-medium">Twilio (PSTN):</span>
                    <span className="text-xs font-semibold text-primary ml-1.5">{formatCost(selectedCall.costDetails?.twilioCost)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-on-surface-variant/80 font-medium">Deepgram STT:</span>
                    <span className="text-xs font-semibold text-primary ml-1.5">{formatCost(selectedCall.costDetails?.deepgramCost)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-on-surface-variant/80 font-medium">Groq LLM:</span>
                    <span className="text-xs font-semibold text-primary ml-1.5">{formatCost(selectedCall.costDetails?.groqCost)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-on-surface-variant/80 font-medium">ElevenLabs TTS:</span>
                    <span className="text-xs font-semibold text-primary ml-1.5">{formatCost(selectedCall.costDetails?.elevenlabsCost)}</span>
                  </div>
                  <div className="col-span-2 border-t border-surface-container pt-2.5 mt-1 flex justify-between items-baseline">
                    <span className="text-xs font-bold text-primary">Aggregate Cost:</span>
                    <span className="text-base font-bold text-secondary">{formatCost(selectedCall.costDetails?.totalCost)}</span>
                  </div>
                </div>
              </div>

              {/* Call Dialog/Transcript */}
              <div>
                <h4 className="font-label-md text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-2.5">
                  Dialogue Transcript ({selectedCall.transcript.filter(msg => msg.role !== 'system').length} exchanges)
                </h4>
                <div className="space-y-3 max-h-[250px] overflow-y-auto border border-outline-variant p-4 rounded-xl bg-surface-container-low">
                  {selectedCall.transcript.length > 0 ? (
                    selectedCall.transcript
                      .filter(msg => msg.role !== 'system')
                      .map((msg, index) => (
                        <div key={index} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                          <span className="text-[9px] text-on-surface-variant/70 font-semibold uppercase mb-0.5">
                            {msg.role === 'user' ? 'Customer' : 'Voice Agent'} · {formatTime(msg.timestamp)}
                          </span>
                          <div className={`p-3 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                            msg.role === 'user'
                              ? 'bg-primary text-white rounded-tr-none'
                              : 'bg-surface-card text-on-surface rounded-tl-none border border-outline-variant/60 shadow-soft'
                          }`}>
                            {msg.text}
                          </div>
                        </div>
                      ))
                  ) : (
                    <p className="text-xs text-on-surface-variant/60 text-center italic py-6">No active dialogue stream recorded.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-surface-container">
              <button 
                onClick={() => setSelectedCall(null)}
                className="px-5 py-2.5 bg-primary hover:bg-inverse-surface text-on-primary font-semibold text-label-md rounded-lg transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
