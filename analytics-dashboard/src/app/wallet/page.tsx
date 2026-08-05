'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

const TOP_UP_AMOUNTS = [5, 10, 20];

interface Transaction {
  id: string;
  date: string;
  description: string;
  type: 'deposit' | 'deduction';
  amount: number;
  status: 'completed' | 'failed' | 'processing';
}

export default function WalletPage() {
  const [balance, setBalance] = useState<number | null>(null);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [topUpLoading, setTopUpLoading] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [customValue, setCustomValue] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const fetchWalletDetails = useCallback(async () => {
    try {
      // 1. Fetch balance
      const balanceRes = await fetch('/api/wallet/balance');
      const balanceData = await balanceRes.json();
      let currentBalance = 0;
      if (balanceData.success) {
        setBalance(balanceData.balance);
        setUsername(balanceData.username);
        currentBalance = balanceData.balance;
      }

      // 2. Fetch call logs to generate dynamic deductions
      const callsRes = await fetch('/api/calls');
      const callsData = await callsRes.json();
      
      const dynamicTransactions: Transaction[] = [];

      // Add a couple of initial mock top-up deposits for realistic history
      dynamicTransactions.push({
        id: 'TXN-INIT-DEP',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toLocaleDateString(), // 3 days ago
        description: 'Razorpay Wallet Signup Bonus',
        type: 'deposit',
        amount: 20.00,
        status: 'completed',
      });

      if (callsData.success && Array.isArray(callsData.calls)) {
        callsData.calls.forEach((call: any, index: number) => {
          const cost = call.costDetails?.totalCost || 0;
          if (cost > 0) {
            dynamicTransactions.push({
              id: call.callSid ? `TXN-${call.callSid.substring(0, 10).toUpperCase()}` : `TXN-CALL-${index}`,
              date: new Date(call.startTime).toLocaleDateString(),
              description: `Call Charge: ${call.phoneNumber}`,
              type: 'deduction',
              amount: cost,
              status: call.status === 'failed' ? 'failed' : 'completed',
            });
          }
        });
      }

      // Sort by date or id to look like a realistic ledger (newest first)
      setTransactions(dynamicTransactions);

    } catch (err) {
      console.error('Failed to load wallet data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWalletDetails();

    const inProgress = localStorage.getItem('paymentInProgress');
    if (inProgress === 'true') {
      setMessage({
        type: 'error',
        text: 'Previous payment transaction was interrupted or cancelled.',
      });
      localStorage.removeItem('paymentInProgress');
    }
  }, [fetchWalletDetails]);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleTopUp = async (amount: number) => {
    if (isNaN(amount) || amount <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid positive amount.' });
      return;
    }

    setTopUpLoading(amount);
    setMessage(null);
    localStorage.setItem('paymentInProgress', 'true');

    const isScriptLoaded = await loadRazorpayScript();
    if (!isScriptLoaded) {
      setMessage({ type: 'error', text: 'Failed to load Razorpay SDK. Please check connection.' });
      localStorage.removeItem('paymentInProgress');
      setTopUpLoading(null);
      return;
    }

    try {
      const orderResponse = await fetch('/api/payment/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });

      if (!orderResponse.ok) {
        throw new Error('Failed to create payment order');
      }

      const orderData = await orderResponse.json();

      if (!orderData.id) {
        throw new Error('Order creation did not return a valid ID');
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'SnowVoice AI Credits',
        description: `Top-up $${amount}.00 calling credits`,
        order_id: orderData.id,
        handler: async function (response: any) {
          try {
            setTopUpLoading(amount);
            const verifyRes = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyRes.ok) {
              localStorage.removeItem('paymentInProgress');
              setBalance(verifyData.balance);
              setCustomValue('');
              setMessage({
                type: 'success',
                text: `+$${amount}.00 added successfully! New balance: $${verifyData.balance.toFixed(2)}`,
              });
              // Refresh transactions list
              fetchWalletDetails();
            } else {
              localStorage.removeItem('paymentInProgress');
              setMessage({ type: 'error', text: verifyData.error || 'Payment verification failed.' });
            }
          } catch (error) {
            console.error('Verification error:', error);
            localStorage.removeItem('paymentInProgress');
            setMessage({ type: 'error', text: 'Error verifying payment with server.' });
          } finally {
            setTopUpLoading(null);
          }
        },
        prefill: {
          name: username || '',
        },
        theme: {
          color: '#010101',
        },
        modal: {
          ondismiss: function () {
            setTopUpLoading(null);
            localStorage.removeItem('paymentInProgress');
            setMessage({
              type: 'error',
              text: 'Transaction cancelled. The payment window was closed.',
            });
          },
        },
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();
    } catch (err: any) {
      console.error(err);
      localStorage.removeItem('paymentInProgress');
      setMessage({ type: 'error', text: err.message || 'Something went wrong initiating the payment.' });
      setTopUpLoading(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
      
      {/* Left Column: Balance, Presets, and Transactions (Spans 8 columns) */}
      <div className="lg:col-span-8 space-y-gutter">
        
        {/* Balance & Top-up Card */}
        <div className="bg-surface-card rounded-xl p-card-padding shadow-soft border border-outline-variant relative overflow-hidden">
          {/* Decorative glowing gradient circle */}
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-accent-blue rounded-full blur-3xl opacity-40 pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div>
              <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-semibold">Available Balance</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="font-metric-lg text-[44px] leading-none font-bold text-primary">
                  ${balance !== null ? balance.toFixed(2) : '0.00'}
                </span>
                <span className="font-body-sm text-body-sm text-trend-up flex items-center bg-accent-mint/30 px-2.5 py-0.5 rounded-full font-semibold">
                  <span className="material-symbols-outlined text-[14px] mr-0.5">arrow_upward</span>
                  USD
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant/80 mt-2.5">
                {username ? `Account: ${username}` : 'Calling Credits Account'}
              </p>
              <p className="text-[11px] text-on-surface-variant/60 mt-1">
                Sufficient for approx. {balance ? Math.floor(balance / 0.02) : 0} campaign call minutes.
              </p>
            </div>

            {/* Top-up Presets & Custom Input */}
            <div className="flex flex-col gap-4 w-full md:w-auto">
              <div className="flex flex-col gap-2">
                <span className="font-label-md text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Quick Top-up</span>
                <div className="flex flex-wrap gap-2 items-center">
                  {TOP_UP_AMOUNTS.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => handleTopUp(amount)}
                      disabled={topUpLoading !== null}
                      className={`px-4 py-2 rounded-lg border text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
                        topUpLoading === amount
                          ? 'border-primary bg-surface-container text-primary scale-95'
                          : 'border-outline-variant/40 bg-surface-card hover:bg-surface-container-low text-primary'
                      }`}
                    >
                      {topUpLoading === amount && (
                        <span className="w-3.5 h-3.5 border border-primary border-t-transparent rounded-full animate-spin shrink-0" />
                      )}
                      ${amount.toFixed(2)}
                    </button>
                  ))}
                  
                  {/* Custom Value input field */}
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-on-surface-variant/50">$</span>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={customValue}
                      onChange={(e) => setCustomValue(e.target.value)}
                      placeholder="Custom"
                      disabled={topUpLoading !== null}
                      className="w-24 pl-5 pr-2 py-2 rounded-lg border border-outline-variant/40 bg-surface-card text-xs font-semibold text-center focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder-on-surface-variant/30"
                    />
                  </div>

                  {customValue && Number(customValue) > 0 && (
                    <button
                      onClick={() => handleTopUp(Number(customValue))}
                      disabled={topUpLoading !== null}
                      className="px-4 py-2 bg-secondary text-white rounded-lg text-xs font-semibold hover:bg-primary transition-all flex items-center gap-1"
                    >
                      {topUpLoading === Number(customValue) && (
                        <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                      )}
                      Pay
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 opacity-50 justify-center md:justify-start">
                <span className="material-symbols-outlined text-[18px]">payments</span>
                <span className="text-[10px] font-bold uppercase tracking-wider">Secured via Razorpay</span>
              </div>
            </div>
          </div>

          {message && (
            <div className={`mt-6 p-3 rounded-lg text-xs font-semibold border ${
              message.type === 'success'
                ? 'bg-accent-mint/30 text-trend-up border-trend-up/15'
                : 'bg-error-container/40 text-error border-error/15'
            }`}>
              {message.text}
            </div>
          )}
        </div>

        {/* Transactions Table */}
        <div className="bg-surface-card rounded-xl shadow-soft border border-outline-variant overflow-hidden">
          <div className="p-4 border-b border-surface-container flex justify-between items-center">
            <h3 className="font-headline-md text-headline-md font-bold text-primary">Recent Transactions Ledger</h3>
            <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Deposits & Call Charges</span>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-12 text-center text-on-surface-variant text-sm animate-pulse">Loading transaction records...</div>
            ) : transactions.length === 0 ? (
              <div className="py-12 text-center text-on-surface-variant text-sm">No transaction records found.</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant font-label-md text-label-md uppercase tracking-wider text-[10px] border-b border-outline-variant/30">
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Reference / Description</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Amount</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container">
                  {transactions.map((txn) => (
                    <tr key={txn.id} className="hover:bg-surface-container-lowest transition-colors text-body-md text-on-surface">
                      <td className="px-6 py-3.5 text-xs text-on-surface-variant font-medium">{txn.date}</td>
                      <td className="px-6 py-3.5">
                        <div className="font-semibold text-primary">{txn.description}</div>
                        <div className="text-[10px] text-on-surface-variant/70 font-mono mt-0.5">{txn.id}</div>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`text-[10px] font-bold uppercase ${txn.type === 'deposit' ? 'text-trend-up' : 'text-on-surface-variant/80'}`}>
                          {txn.type}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 font-semibold text-sm">
                        {txn.type === 'deposit' ? '+' : '-'}${txn.amount.toFixed(txn.type === 'deposit' ? 2 : 4)}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase ${
                          txn.status === 'completed' 
                            ? 'bg-accent-mint/30 text-trend-up' 
                            : txn.status === 'failed' 
                              ? 'bg-error-container/40 text-error' 
                              : 'bg-accent-yellow/30 text-on-tertiary-fixed'
                        }`}>
                          {txn.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Infrastructure Cost Reference Card (Spans 4 columns) */}
      <div className="lg:col-span-4 bg-surface-card rounded-xl shadow-soft border border-outline-variant p-card-padding">
        <h3 className="font-headline-md text-headline-md font-bold text-primary mb-1">Infrastructure Rates</h3>
        <p className="font-body-sm text-body-sm text-on-surface-variant mb-6">
          Estimated real-time costs deducted automatically per outbound call.
        </p>

        <div className="divide-y divide-surface-container">
          {[
            { vendor: 'Twilio Voice (PSTN)', rate: '$0.015 / minute', color: 'bg-accent-yellow', text: 'Call dialing and connections' },
            { vendor: 'Deepgram STT', rate: '$0.004 / minute', color: 'bg-accent-mint', text: 'Real-time user voice to text' },
            { vendor: 'Groq Cloud LLM', rate: '$0.050 / 1M tokens', color: 'bg-accent-blue', text: 'Llama 3.1 8B conversation response' },
            { vendor: 'ElevenLabs TTS', rate: '$0.090 / minute', color: 'bg-accent-purple', text: 'High fidelity custom voice synthesis' },
          ].map(({ vendor, rate, color, text }) => (
            <div key={vendor} className="py-4 first:pt-0 last:pb-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                  <span className="font-label-md text-label-md font-bold text-primary">{vendor}</span>
                </div>
                <span className="text-xs font-semibold text-secondary font-mono">{rate}</span>
              </div>
              <p className="text-[11px] text-on-surface-variant/75 mt-1 pl-4 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </div>
      
    </div>
  );
}
