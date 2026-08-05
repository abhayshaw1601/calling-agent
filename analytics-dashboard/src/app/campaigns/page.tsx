'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Papa from 'papaparse';
import Link from 'next/link';

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

const STATUS_TAG_CLASSES: Record<string, string> = {
  pending: 'bg-accent-yellow text-on-tertiary-fixed border border-outline-variant/30',
  called: 'bg-accent-mint text-trend-up border border-trend-up/20',
  failed: 'bg-error-container text-on-error-container border border-error/20',
};

// CSV Drag & Drop Zone Component
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
      error: () => setParseError('Failed to parse CSV. Check format.'),
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
        relative flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed cursor-pointer
        transition-all duration-200
        ${dragging
          ? 'border-primary bg-surface-container-high scale-[1.01]'
          : 'border-outline-variant hover:border-primary hover:bg-surface-container-low'
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
      <span className="material-symbols-outlined text-[36px] text-on-surface-variant/40">upload_file</span>
      {filename ? (
        <p className="text-sm font-semibold text-secondary">✓ {filename}</p>
      ) : (
        <>
          <p className="text-body-md text-body-md text-on-surface-variant text-center font-medium">
            Drop CSV here or <span className="text-secondary underline font-semibold">browse</span>
          </p>
          <p className="text-[10px] text-on-surface-variant/60 text-center">
            Headers: Name, PhoneNumber, CustomPrompt
          </p>
        </>
      )}
      {parseError && <p className="text-xs text-error font-semibold mt-1">{parseError}</p>}
    </div>
  );
}

// Main Campaigns Page
export default function CampaignsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [callingId, setCallingId] = useState<string | null>(null);
  const [callMessages, setCallMessages] = useState<Record<string, { type: 'success' | 'error'; text: string }>>({});

  // Manual Add Form State
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
        fetchContacts();
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
        fetchContacts();
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
        setCallMessages(prev => ({ ...prev, [contact._id]: { type: 'success', text: `Call started! SID: ${data.callSid.substring(0, 12)}...` } }));
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter items-start">
      
      {/* Left Columns: Contacts List (Spans 2 columns) */}
      <div className="lg:col-span-2 bg-surface-card rounded-xl shadow-soft border border-outline-variant p-card-padding flex flex-col min-h-[500px]">
        <div className="flex items-center justify-between border-b border-surface-container pb-4 mb-6">
          <div>
            <h3 className="font-headline-md text-headline-md font-bold text-on-surface">Contact Campaign List</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
              All saved contacts. Use "Call Now" to trigger outbound voice connections.
            </p>
          </div>
          <button 
            onClick={fetchContacts}
            disabled={loadingContacts}
            className="flex items-center gap-1.5 px-4 py-2 border border-outline-variant rounded-full text-label-md font-semibold text-primary hover:bg-surface-container-low transition-all disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-[16px] ${loadingContacts ? 'animate-spin' : ''}`}>refresh</span>
            Refresh
          </button>
        </div>

        {/* Contacts Table */}
        <div className="flex-1 overflow-x-auto">
          {loadingContacts ? (
            <div className="h-full flex items-center justify-center text-on-surface-variant text-sm py-16 animate-pulse">
              Loading campaign contacts...
            </div>
          ) : contacts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-on-surface-variant text-sm py-16 text-center">
              <span className="material-symbols-outlined text-[48px] text-on-surface-variant/40 mb-3">campaign</span>
              <p className="font-medium text-on-surface">No contacts added yet</p>
              <p className="text-xs text-on-surface-variant/70 mt-1 max-w-xs">Upload a CSV or add contacts manually using the right-hand panel to start dialer operations.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-container text-label-md font-semibold text-on-surface-variant uppercase tracking-wider text-[11px]">
                  <th className="pb-3 pr-2">Name</th>
                  <th className="pb-3 px-2">Phone Number</th>
                  <th className="pb-3 px-2">Custom AI Instructions</th>
                  <th className="pb-3 px-2">Status</th>
                  <th className="pb-3 pl-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container">
                {contacts.map((contact) => (
                  <React.Fragment key={contact._id}>
                    <tr className="group hover:bg-surface-container-lowest transition-colors text-body-md text-on-surface">
                      <td className="py-3.5 pr-2 font-medium">{contact.name}</td>
                      <td className="py-3.5 px-2 font-mono text-[13px]">{contact.phoneNumber}</td>
                      <td className="py-3.5 px-2 text-on-surface-variant text-xs max-w-[200px] truncate" title={contact.customPrompt}>
                        {contact.customPrompt || <span className="italic text-on-surface-variant/40">Default Prompt</span>}
                      </td>
                      <td className="py-3.5 px-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${STATUS_TAG_CLASSES[contact.status] || 'bg-surface-container text-on-surface-variant'}`}>
                          {contact.status}
                        </span>
                      </td>
                      <td className="py-3.5 pl-2 text-right">
                        <button
                          disabled={contact.status === 'called' || callingId === contact._id}
                          onClick={() => handleCallNow(contact)}
                          className={`px-3 py-1.5 rounded-full text-label-md font-semibold text-on-primary bg-primary hover:bg-inverse-surface transition-colors disabled:opacity-50 disabled:hover:bg-primary flex items-center justify-center gap-1.5 ml-auto`}
                        >
                          {callingId === contact._id ? (
                            <>
                              <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin shrink-0" />
                              Dialing...
                            </>
                          ) : contact.status === 'called' ? (
                            'Called ✓'
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-[14px]">call</span>
                              Call Now
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                    {callMessages[contact._id] && (
                      <tr>
                        <td colSpan={5} className="py-2">
                          <div className={`px-3 py-2 rounded-lg text-xs font-semibold ${
                            callMessages[contact._id].type === 'success'
                              ? 'bg-accent-mint/30 text-trend-up border border-trend-up/15'
                              : 'bg-error-container/40 text-error border border-error/15'
                          }`}>
                            {callMessages[contact._id].text}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Right Column: Actions (CSV Upload & Manual Add) */}
      <div className="space-y-gutter">
        
        {/* Card: CSV Import */}
        <div className="bg-surface-card rounded-xl shadow-soft border border-outline-variant p-card-padding flex flex-col">
          <h3 className="font-headline-md text-headline-md font-bold text-primary mb-1">CSV Bulk Upload</h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">
            Upload CSV contacts lists to bulk seed.
          </p>
          
          <CsvUploadZone onParsed={setParsedRows} />

          {/* CSV Preview and Save controls */}
          {parsedRows.length > 0 && (
            <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                  {parsedRows.length} rows loaded
                </span>
                <button
                  onClick={handleSaveContacts}
                  disabled={saving}
                  className="px-3.5 py-1.5 bg-secondary text-white rounded-full text-label-md font-semibold hover:bg-primary transition-all disabled:opacity-50"
                >
                  {saving ? 'Saving...' : `Save Contacts`}
                </button>
              </div>

              {saveMessage && (
                <div className={`p-2.5 rounded-lg text-xs font-semibold ${
                  saveMessage.type === 'success' ? 'bg-accent-mint/30 text-trend-up' : 'bg-error-container/40 text-error'
                }`}>
                  {saveMessage.text}
                </div>
              )}

              <div className="rounded-lg border border-outline-variant overflow-hidden max-h-40 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-surface-container-low border-b border-outline-variant">
                    <tr>
                      <th className="p-2 font-semibold">Name</th>
                      <th className="p-2 font-semibold font-mono">Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.slice(0, 5).map((row, i) => (
                      <tr key={i} className="border-b border-surface-container last:border-0 bg-surface-container-lowest">
                        <td className="p-2 font-medium">{row.name}</td>
                        <td className="p-2 font-mono text-[11px]">{row.phoneNumber}</td>
                      </tr>
                    ))}
                    {parsedRows.length > 5 && (
                      <tr className="bg-surface-container-lowest">
                        <td colSpan={2} className="p-2 text-center text-[10px] text-on-surface-variant/60 italic">
                          + {parsedRows.length - 5} more contact(s)
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Card: Add Contact Manually */}
        <div className="bg-surface-card rounded-xl shadow-soft border border-outline-variant p-card-padding">
          <h3 className="font-headline-md text-headline-md font-bold text-primary mb-1">Add Contact</h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">
            Add a single calling target directly.
          </p>

          <form onSubmit={handleAddManualContact} className="space-y-4">
            {manualMessage && (
              <div className={`p-2.5 rounded-lg text-xs font-semibold ${
                manualMessage.type === 'success' ? 'bg-accent-mint/30 text-trend-up' : 'bg-error-container/40 text-error'
              }`}>
                {manualMessage.text}
              </div>
            )}

            <div>
              <label htmlFor="manualName" className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <input
                id="manualName"
                type="text"
                required
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                placeholder="Abhay Shaw"
                className="block w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-on-surface font-body-md focus:ring-1 focus:ring-primary focus:border-primary placeholder-on-surface-variant/40"
              />
            </div>

            <div>
              <label htmlFor="manualPhone" className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                Phone Number
              </label>
              <input
                id="manualPhone"
                type="text"
                required
                value={manualPhone}
                onChange={(e) => setManualPhone(e.target.value)}
                placeholder="+919876543210"
                className="block w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-on-surface font-body-md font-mono focus:ring-1 focus:ring-primary focus:border-primary placeholder-on-surface-variant/40"
              />
            </div>

            <div>
              <label htmlFor="manualPrompt" className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                Custom System Prompt
              </label>
              <textarea
                id="manualPrompt"
                rows={4}
                value={manualPrompt}
                onChange={(e) => setManualPrompt(e.target.value)}
                placeholder="You are calling on behalf of SnowVoice AI to follow up on..."
                className="block w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-on-surface font-body-md focus:ring-1 focus:ring-primary focus:border-primary placeholder-on-surface-variant/40 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={manualSaving || !manualName || !manualPhone}
              className="w-full flex justify-center py-2.5 px-4 bg-primary text-on-primary rounded-lg shadow-soft font-semibold text-label-md hover:bg-inverse-surface transition-colors disabled:opacity-50 disabled:hover:bg-primary"
            >
              {manualSaving ? 'Adding...' : 'Add Contact'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
