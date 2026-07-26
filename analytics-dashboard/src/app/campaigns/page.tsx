'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Papa from 'papaparse';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Contact {
  _id: string;
  name: string;
  phoneNumber: string;
  customPrompt: string;
  status: 'pending' | 'called' | 'failed';
  callSid?: string;
  createdAt: string;
}

interface ParsedRow {
  name: string;
  phoneNumber: string;
  customPrompt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  called: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

// ─── CSV Upload Zone ──────────────────────────────────────────────────────────

function CsvUploadZone({ onParsed }: { onParsed: (rows: ParsedRow[]) => void }) {
  const [dragging, setDragging] = useState(false);
  const [filename, setFilename] = useState('');
  const [parseError, setParseError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    setParseError('');
    setFilename(file.name);
    Papa.parse<any>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows: ParsedRow[] = results.data
          .map((row: any) => ({
            name: row.Name || row.name || '',
            phoneNumber: row.PhoneNumber || row.phoneNumber || row.phone_number || '',
            customPrompt: row.CustomPrompt || row.customPrompt || row.custom_prompt || '',
          }))
          .filter(r => r.name && r.phoneNumber);

        if (rows.length === 0) {
          setParseError('No valid rows found. Ensure columns: Name, PhoneNumber, CustomPrompt');
          return;
        }
        onParsed(rows);
      },
      error: () => setParseError('Failed to parse CSV. Please check the file format.'),
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) processFile(file);
    else setParseError('Please drop a .csv file.');
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`
        relative flex flex-col items-center justify-center gap-3 p-10 rounded-xl border-2 border-dashed cursor-pointer
        transition-all duration-200
        ${dragging
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10 scale-[1.01]'
          : 'border-neutral-300 dark:border-neutral-700 hover:border-blue-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/30'
        }
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => { if (e.target.files?.[0]) processFile(e.target.files[0]); }}
      />
      <svg className="w-10 h-10 text-neutral-300 dark:text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      {filename ? (
        <p className="text-sm font-medium text-blue-600">✓ {filename}</p>
      ) : (
        <>
          <p className="text-sm font-medium text-neutral-600 dark:text-neutral-300">Drop a CSV file here or <span className="text-blue-500 underline">browse</span></p>
          <p className="text-xs text-neutral-400">Required columns: <code className="bg-neutral-100 dark:bg-neutral-800 px-1 rounded">Name</code>, <code className="bg-neutral-100 dark:bg-neutral-800 px-1 rounded">PhoneNumber</code>, <code className="bg-neutral-100 dark:bg-neutral-800 px-1 rounded">CustomPrompt</code></p>
        </>
      )}
      {parseError && <p className="text-xs text-red-500 font-medium">{parseError}</p>}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CampaignsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [callingId, setCallingId] = useState<string | null>(null);
  const [callMessages, setCallMessages] = useState<Record<string, { type: 'success' | 'error'; text: string }>>({});

  // ─── Manual Add Form State ───────────────────────────────────────────────────
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualPrompt, setManualPrompt] = useState('');
  const [manualSaving, setManualSaving] = useState(false);
  const [manualMessage, setManualMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchContacts = useCallback(async () => {
    try {
      const res = await fetch('/api/contacts');
      const data = await res.json();
      if (data.success) setContacts(data.contacts);
    } catch (err) {
      console.error('Failed to load contacts:', err);
    } finally {
      setLoadingContacts(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleSaveContacts = async () => {
    if (parsedRows.length === 0) return;
    setSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacts: parsedRows }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveMessage({ type: 'success', text: `${data.count} contact(s) saved successfully!` });
        setParsedRows([]);
        fetchContacts(); // Refresh the contact list
      } else {
        setSaveMessage({ type: 'error', text: data.error || 'Save failed.' });
      }
    } catch (err) {
      setSaveMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddManualContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName || !manualPhone) return;
    setManualSaving(true);
    setManualMessage(null);
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contacts: [{
            name: manualName,
            phoneNumber: manualPhone,
            customPrompt: manualPrompt,
          }]
        }),
      });
      const data = await res.json();
      if (data.success) {
        setManualMessage({ type: 'success', text: `Contact "${manualName}" added successfully!` });
        setManualName('');
        setManualPhone('');
        setManualPrompt('');
        fetchContacts(); // Refresh the contact list
      } else {
        setManualMessage({ type: 'error', text: data.error || 'Failed to add contact.' });
      }
    } catch (err) {
      setManualMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setManualSaving(false);
    }
  };

  const handleCallNow = async (contact: Contact) => {
    setCallingId(contact._id);
    setCallMessages(prev => { const n = { ...prev }; delete n[contact._id]; return n; });
    try {
      const res = await fetch('/api/call/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId: contact._id }),
      });
      const data = await res.json();
      if (data.success) {
        setCallMessages(prev => ({ ...prev, [contact._id]: { type: 'success', text: `Call started! SID: ${data.callSid}` } }));
        // Optimistically update status
        setContacts(prev => prev.map(c => c._id === contact._id ? { ...c, status: 'called' } : c));
      } else {
        setCallMessages(prev => ({ ...prev, [contact._id]: { type: 'error', text: data.error || 'Call failed.' } }));
      }
    } catch (err) {
      setCallMessages(prev => ({ ...prev, [contact._id]: { type: 'error', text: 'Network error.' } }));
    } finally {
      setCallingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
        <p className="text-neutral-500">Upload a contact list or add them manually, then trigger AI voice calls.</p>
      </div>

      {/* CSV Upload & Manual Add Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* CSV Upload Card */}
        <Card className="flex flex-col h-full justify-between">
          <CardHeader>
            <CardTitle>Upload Contacts (CSV)</CardTitle>
            <CardDescription>
              Upload a CSV file with columns: <strong>Name</strong>, <strong>PhoneNumber</strong>, <strong>CustomPrompt</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-1">
            <CsvUploadZone onParsed={setParsedRows} />

            {/* CSV Preview */}
            {parsedRows.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                    Preview — {parsedRows.length} contact(s) ready
                  </p>
                  <Button size="sm" onClick={handleSaveContacts} disabled={saving}>
                    {saving ? 'Saving…' : `Save ${parsedRows.length} Contact(s)`}
                  </Button>
                </div>

                {saveMessage && (
                  <div className={`p-2 rounded-lg text-xs font-medium ${saveMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800'
                      : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
                    }`}>
                    {saveMessage.text}
                  </div>
                )}

                <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs py-1.5">Name</TableHead>
                        <TableHead className="text-xs py-1.5 font-mono">Phone</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedRows.slice(0, 3).map((row, i) => (
                        <TableRow key={i}>
                          <TableCell className="py-1 text-xs font-medium">{row.name}</TableCell>
                          <TableCell className="py-1 text-xs font-mono">{row.phoneNumber}</TableCell>
                        </TableRow>
                      ))}
                      {parsedRows.length > 3 && (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center text-[10px] text-neutral-400 py-1">
                            + {parsedRows.length - 3} more contact(s) not shown
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Contact Manually Card */}
        <Card className="flex flex-col h-full justify-between">
          <CardHeader>
            <CardTitle>Add Contact Manually</CardTitle>
            <CardDescription>Add a single contact directly into your calling campaign.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <form onSubmit={handleAddManualContact} className="space-y-4 h-full flex flex-col justify-between">
              <div className="space-y-4">
                {manualMessage && (
                  <div className={`p-2.5 rounded-lg text-xs font-medium ${manualMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800'
                      : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
                    }`}>
                    {manualMessage.text}
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="manualName" className="block text-xs font-medium text-neutral-500 mb-1">
                      Name
                    </label>
                    <input
                      id="manualName"
                      type="text"
                      required
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      className="block w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-transparent text-sm"
                      placeholder="Abhay"
                    />
                  </div>
                  <div>
                    <label htmlFor="manualPhone" className="block text-xs font-medium text-neutral-500 mb-1">
                      Phone Number
                    </label>
                    <input
                      id="manualPhone"
                      type="text"
                      required
                      value={manualPhone}
                      onChange={(e) => setManualPhone(e.target.value)}
                      className="block w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-transparent text-sm font-mono"
                      placeholder="+918520369741"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="manualPrompt" className="block text-xs font-medium text-neutral-500 mb-1">
                    Custom AI Prompt / Instructions
                  </label>
                  <textarea
                    id="manualPrompt"
                    rows={4}
                    value={manualPrompt}
                    onChange={(e) => setManualPrompt(e.target.value)}
                    className="block w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-transparent text-sm resize-none"
                    placeholder="You are a friendly agent calling from CloudVault to offer a premium trial..."
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={manualSaving || !manualName || !manualPhone}>
                  {manualSaving ? 'Saving…' : 'Add Contact'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Contact List / Campaign Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Contact List</CardTitle>
              <CardDescription>All saved contacts. Use "Call Now" to trigger an AI voice call.</CardDescription>
            </div>
            <Button variant="outline" onClick={fetchContacts} disabled={loadingContacts}>
              {loadingContacts ? 'Refreshing…' : 'Refresh'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingContacts ? (
            <div className="py-16 text-center text-neutral-400 text-sm">Loading contacts…</div>
          ) : contacts.length === 0 ? (
            <div className="py-16 text-center text-neutral-400 text-sm">
              No contacts yet — upload a CSV above to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Custom Prompt</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => (
                  <React.Fragment key={contact._id}>
                    <TableRow className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
                      <TableCell className="font-medium">{contact.name}</TableCell>
                      <TableCell className="font-mono text-sm">{contact.phoneNumber}</TableCell>
                      <TableCell className="text-sm text-neutral-500 max-w-xs">
                        <span className="block truncate" title={contact.customPrompt}>
                          {contact.customPrompt}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[contact.status] || 'bg-neutral-100 text-neutral-600'}`}>
                          {contact.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          disabled={contact.status === 'called' || callingId === contact._id}
                          onClick={() => handleCallNow(contact)}
                        >
                          {callingId === contact._id ? (
                            <span className="flex items-center gap-1.5">
                              <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                              Calling…
                            </span>
                          ) : contact.status === 'called' ? 'Called ✓' : 'Call Now'}
                        </Button>
                      </TableCell>
                    </TableRow>
                    {callMessages[contact._id] && (
                      <TableRow>
                        <TableCell colSpan={5} className="pt-0 pb-2">
                          <div className={`px-3 py-2 rounded-lg text-xs font-medium ${callMessages[contact._id].type === 'success'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
                              : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                            }`}>
                            {callMessages[contact._id].text}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
