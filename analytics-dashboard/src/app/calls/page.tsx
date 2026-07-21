'use client';

import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

// Define structures for TypeScript
interface CallRecord {
  callSid: string;
  phoneNumber: string;
  status: string;
  startTime: string;
  duration: string;
  cost: string;
  transcript: Array<{ role: string; text: string; timestamp: string }>;
}

export default function CallLogsPage() {
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // TODO: Fetch real call records from `/api/calls` or database query on load.
  // Mock call data list
  const mockCalls: CallRecord[] = [
    {
      callSid: "CA1234567890abcdef",
      phoneNumber: "+1 (555) 019-2834",
      status: "completed",
      startTime: "2026-07-20 16:10",
      duration: "45s",
      cost: "$0.18",
      transcript: [
        { role: "assistant", text: "Hello! Welcome to Support. How can I help you?", timestamp: "16:10:02" },
        { role: "user", text: "Hi, I need assistance resetting my password.", timestamp: "16:10:07" },
        { role: "assistant", text: "Certainly! I've sent a link to your email.", timestamp: "16:10:12" }
      ]
    },
    {
      callSid: "CA0987654321fedcba",
      phoneNumber: "+1 (555) 014-9876",
      status: "failed",
      startTime: "2026-07-20 15:34",
      duration: "0s",
      cost: "$0.00",
      transcript: []
    }
  ];

  const handleRowClick = (call: CallRecord) => {
    setSelectedCall(call);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Call Logs</h1>
        <p className="text-neutral-500">View detailed history, costs, and transcripts of all system calls</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
          <CardDescription>Click on any call row to inspect live logs & conversation transcripts.</CardDescription>
        </CardHeader>
        <CardContent>
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
              {mockCalls.map((call) => (
                <TableRow 
                  key={call.callSid} 
                  className="cursor-pointer"
                  onClick={() => handleRowClick(call)}
                >
                  <TableCell className="font-mono text-xs">{call.callSid}</TableCell>
                  <TableCell>{call.phoneNumber}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      call.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {call.status}
                    </span>
                  </TableCell>
                  <TableCell>{call.startTime}</TableCell>
                  <TableCell>{call.duration}</TableCell>
                  <TableCell className="text-right font-medium">{call.cost}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Transcript inspection dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        {selectedCall && (
          <>
            <DialogHeader>
              <DialogTitle>Call Details</DialogTitle>
              <DialogDescription>
                SID: <span className="font-mono text-xs">{selectedCall.callSid}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-4">
              <div>
                <h4 className="font-semibold text-sm mb-2">Metadata</h4>
                <div className="grid grid-cols-2 gap-2 text-sm bg-neutral-50 dark:bg-neutral-900 p-3 rounded-md">
                  <div><strong>Number:</strong> {selectedCall.phoneNumber}</div>
                  <div><strong>Duration:</strong> {selectedCall.duration}</div>
                  <div><strong>Cost:</strong> {selectedCall.cost}</div>
                  <div><strong>Status:</strong> {selectedCall.status}</div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2">Transcript History</h4>
                <div className="space-y-3 max-h-60 overflow-y-auto border border-neutral-200 dark:border-neutral-800 p-3 rounded-md">
                  {selectedCall.transcript.length > 0 ? (
                    selectedCall.transcript.map((msg, index) => (
                      <div key={index} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <span className="text-[10px] text-neutral-400 capitalize">{msg.role} - {msg.timestamp}</span>
                        <div className={`mt-1 p-2 rounded-lg text-sm max-w-[85%] ${
                          msg.role === 'user' 
                            ? 'bg-neutral-900 text-neutral-50' 
                            : 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100'
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-neutral-500 text-center italic">No transcript recorded for this call.</p>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end pt-2">
                <Button onClick={() => setDialogOpen(false)}>Close Details</Button>
              </div>
            </div>
          </>
        )}
      </Dialog>
    </div>
  );
}
