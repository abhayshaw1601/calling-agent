'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const TOP_UP_AMOUNTS = [5, 10, 20, 50];

export default function WalletPage() {
  const [balance, setBalance] = useState<number | null>(null);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [topUpLoading, setTopUpLoading] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchBalance = useCallback(async () => {
    try {
      const res = await fetch('/api/wallet/balance');
      const data = await res.json();
      if (data.success) {
        setBalance(data.balance);
        setUsername(data.username);
      }
    } catch (err) {
      console.error('Failed to fetch balance:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

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
    setTopUpLoading(amount);
    setMessage(null);

    // 1. Load Razorpay Checkout SDK script
    const isScriptLoaded = await loadRazorpayScript();
    if (!isScriptLoaded) {
      setMessage({ type: 'error', text: 'Failed to load Razorpay SDK. Please check your connection.' });
      setTopUpLoading(null);
      return;
    }

    try {
      // 2. Generate Razorpay Order ID from backend
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

      // 3. Configure Razorpay checkout options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Calling Credits Top-Up',
        description: `Adding $${amount}.00 to your wallet`,
        order_id: orderData.id,
        handler: async function (response: any) {
          try {
            setTopUpLoading(amount);
            // 4. Verify transaction cryptographically on backend
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
              setBalance(verifyData.balance);
              setMessage({
                type: 'success',
                text: `+$${amount}.00 added successfully! New balance: $${verifyData.balance.toFixed(2)}`,
              });
            } else {
              setMessage({ type: 'error', text: verifyData.error || 'Payment verification failed.' });
            }
          } catch (error) {
            console.error('Verification error:', error);
            setMessage({ type: 'error', text: 'Error verifying payment with server.' });
          } finally {
            setTopUpLoading(null);
          }
        },
        prefill: {
          name: username || '',
        },
        theme: {
          color: '#2563EB',
        },
        modal: {
          ondismiss: function () {
            setTopUpLoading(null);
          },
        },
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err.message || 'Something went wrong initiating the payment.' });
      setTopUpLoading(null);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Wallet</h1>
        <p className="text-neutral-500">Manage your calling credits. Balance is deducted automatically after each call.</p>
      </div>

      {/* Balance Card */}
      <Card>
        <CardHeader>
          <CardTitle>Current Balance</CardTitle>
          <CardDescription>
            {username ? `Account: ${username}` : 'Your calling credits'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-16 flex items-center">
              <div className="h-10 w-36 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
            </div>
          ) : (
            <div className="flex items-end gap-2">
              <span className="text-5xl font-bold tracking-tight">
                ${balance !== null ? balance.toFixed(2) : '0.00'}
              </span>
              <span className="text-neutral-500 mb-1 text-lg">USD</span>
            </div>
          )}

          <p className="mt-3 text-xs text-neutral-400">
            Rates: Twilio $0.014/min · Deepgram $0.0059/min · Groq $0.00005/1k tokens · ElevenLabs $0.00003/char
          </p>
        </CardContent>
      </Card>

      {/* Top-Up Card */}
      <Card>
        <CardHeader>
          <CardTitle>Add Credits</CardTitle>
          <CardDescription>Select an amount to add to your wallet instantly.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && (
            <div className={`p-3 rounded-lg text-sm font-medium ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
            }`}>
              {message.type === 'success' ? '✓ ' : '✗ '}{message.text}
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {TOP_UP_AMOUNTS.map((amount) => (
              <button
                key={amount}
                onClick={() => handleTopUp(amount)}
                disabled={topUpLoading !== null}
                className={`
                  relative flex flex-col items-center justify-center p-4 rounded-xl border-2 font-semibold
                  transition-all duration-150 cursor-pointer
                  ${topUpLoading === amount
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-95'
                    : 'border-neutral-200 dark:border-neutral-700 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10'
                  }
                  disabled:opacity-60 disabled:cursor-not-allowed
                `}
              >
                {topUpLoading === amount && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/60 dark:bg-black/40">
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                <span className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">${amount}</span>
                <span className="text-xs text-neutral-400 mt-0.5">USD</span>
              </button>
            ))}
          </div>

          <p className="text-xs text-neutral-400 text-center pt-1">
            Payments securely processed via Razorpay.
          </p>
        </CardContent>
      </Card>

      {/* Cost Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Reference</CardTitle>
          <CardDescription>Estimated calling costs by vendor</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {[
              { vendor: 'Twilio', rate: '$0.014 / minute', color: 'bg-red-400' },
              { vendor: 'Deepgram STT', rate: '$0.0059 / minute', color: 'bg-green-400' },
              { vendor: 'Groq LLM', rate: '$0.00005 / 1k tokens', color: 'bg-purple-500' },
              { vendor: 'ElevenLabs TTS', rate: '$0.00003 / character', color: 'bg-amber-400' },
            ].map(({ vendor, rate, color }) => (
              <div key={vendor} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                  <span className="text-sm font-medium">{vendor}</span>
                </div>
                <span className="text-sm text-neutral-500 font-mono">{rate}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
