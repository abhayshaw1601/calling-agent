'use client';

import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogContent } from '@/components/ui/dialog';

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDuration = (seconds: number) => {
  if (!seconds || seconds === 0) return '0s';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

const formatCost = (cost: number) => `$${(cost || 0).toFixed(5)}`;

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

const STATUS_STYLES: Record<string, string> = {
  completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  'in-progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  initiated: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  ringing: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function CallLogsPage() {
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

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

  const handleRowClick = (call: CallRecord) => {
    setSelectedCall(call);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Call Logs</h1>
        <p className="text-neutral-500">View history, transcripts, and cost breakdowns for all your calls</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
          <CardDescription>Click on any row to inspect the full transcript and cost details.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-16 text-center text-neutral-400 text-sm">Loading call logs…</div>
          ) : error ? (
            <div className="py-16 text-center text-red-500 text-sm">{error}</div>
          ) : calls.length === 0 ? (
            <div className="py-16 text-center text-neutral-400 text-sm">
              No calls found. Start a campaign to see logs appear here.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Call SID</TableHead>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="text-right">Total Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calls.map((call) => (
                  <TableRow
                    key={call._id}
                    className="cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                    onClick={() => handleRowClick(call)}
                  >
                    <TableCell className="font-mono text-xs text-neutral-500">{call.callSid}</TableCell>
                    <TableCell className="font-medium">{call.phoneNumber}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[call.status] || 'bg-neutral-100 text-neutral-600'}`}>
                        {call.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-neutral-500">{formatDate(call.startTime)}</TableCell>
                    <TableCell>{formatDuration(call.duration)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCost(call.costDetails?.totalCost)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Call Details Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          {selectedCall && (
            <>
              <DialogHeader>
                <DialogTitle>Call Details</DialogTitle>
                <DialogDescription>
                  SID: <span className="font-mono text-xs">{selectedCall.callSid}</span>
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4 space-y-5">
                {/* Metadata Grid */}
                <div>
                  <h4 className="font-semibold text-sm mb-2">Metadata</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm bg-neutral-50 dark:bg-neutral-900 p-3 rounded-md">
                    <div><span className="text-neutral-500">Number:</span> <strong>{selectedCall.phoneNumber}</strong></div>
                    <div><span className="text-neutral-500">Status:</span> <strong>{selectedCall.status}</strong></div>
                    <div><span className="text-neutral-500">Started:</span> <strong>{formatDate(selectedCall.startTime)}</strong></div>
                    <div><span className="text-neutral-500">Duration:</span> <strong>{formatDuration(selectedCall.duration)}</strong></div>
                  </div>
                </div>

                {/* Cost Breakdown */}
                <div>
                  <h4 className="font-semibold text-sm mb-2">Cost Breakdown</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm bg-neutral-50 dark:bg-neutral-900 p-3 rounded-md">
                    {[
                      { label: 'Twilio', value: selectedCall.costDetails?.twilioCost },
                      { label: 'Deepgram', value: selectedCall.costDetails?.deepgramCost },
                      { label: 'Groq', value: selectedCall.costDetails?.groqCost },
                      { label: 'ElevenLabs', value: selectedCall.costDetails?.elevenlabsCost },
                    ].map(({ label, value }) => (
                      <div key={label}><span className="text-neutral-500">{label}:</span> <strong>{formatCost(value || 0)}</strong></div>
                    ))}
                    <div className="col-span-2 border-t border-neutral-200 dark:border-neutral-700 pt-2 mt-1">
                      <span className="text-neutral-500">Total:</span> <strong className="text-base">{formatCost(selectedCall.costDetails?.totalCost)}</strong>
                    </div>
                  </div>
                </div>

                {/* Transcript */}
                <div>
                  <h4 className="font-semibold text-sm mb-2">
                    Transcript <span className="font-normal text-neutral-400">({selectedCall.transcript.length} messages)</span>
                  </h4>
                  <div className="space-y-3 max-h-64 overflow-y-auto border border-neutral-200 dark:border-neutral-800 p-3 rounded-md">
                    {selectedCall.transcript.length > 0 ? (
                      selectedCall.transcript
                        .filter(msg => msg.role !== 'system')
                        .map((msg, index) => (
                          <div key={index} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                            <span className="text-[10px] text-neutral-400 capitalize mb-0.5">
                              {msg.role} · {formatTime(msg.timestamp)}
                            </span>
                            <div className={`p-2.5 rounded-xl text-sm max-w-[85%] leading-relaxed ${
                              msg.role === 'user'
                                ? 'bg-neutral-900 text-neutral-50 dark:bg-neutral-700'
                                : 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100'
                            }`}>
                              {msg.text}
                            </div>
                          </div>
                        ))
                    ) : (
                      <p className="text-sm text-neutral-400 text-center italic py-4">No transcript recorded for this call.</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <Button onClick={() => setDialogOpen(false)}>Close</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
