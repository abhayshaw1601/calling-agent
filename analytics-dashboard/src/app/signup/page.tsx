'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username,
                    email,
                    password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Registration failed');
            }

            // Redirect to login page on success
            router.push('/login?registered=true');
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-surface-container p-4">
            <main className="w-full max-w-md bg-surface-card rounded-xl shadow-soft p-8 border border-outline-variant flex flex-col items-center">
                {/* Header / Logo */}
                <div className="mb-8 flex flex-col items-center text-center">
                    <h1 className="font-headline-lg text-[28px] font-bold text-primary mb-2 tracking-tight">SnowVoice AI</h1>
                    <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">Create Account</h2>
                    <p className="font-body-md text-body-md text-on-surface-variant mt-1.5">Sign up to manage outbound voice campaigns.</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="w-full space-y-5">
                    {error && (
                        <div className="p-3 bg-error-container border border-error/20 text-error rounded-lg text-sm text-center font-medium">
                            {error}
                        </div>
                    )}

                    {/* Username Input */}
                    <div>
                        <label className="block font-label-md text-label-md text-on-surface mb-1.5" htmlFor="username">Username</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="material-symbols-outlined text-on-surface-variant text-[18px]">person</span>
                            </div>
                            <input
                                className="block w-full pl-10 pr-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-on-surface font-body-md focus:ring-2 focus:ring-primary focus:border-primary transition-colors placeholder-on-surface-variant/40"
                                id="username"
                                name="username"
                                placeholder="john_doe"
                                required
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Email Input */}
                    <div>
                        <label className="block font-label-md text-label-md text-on-surface mb-1.5" htmlFor="email">Email Address</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="material-symbols-outlined text-on-surface-variant text-[18px]">mail</span>
                            </div>
                            <input
                                className="block w-full pl-10 pr-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-on-surface font-body-md focus:ring-2 focus:ring-primary focus:border-primary transition-colors placeholder-on-surface-variant/40"
                                id="email"
                                name="email"
                                placeholder="john@example.com"
                                required
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Password Input */}
                    <div>
                        <label className="block font-label-md text-label-md text-on-surface mb-1.5" htmlFor="password">Password</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="material-symbols-outlined text-on-surface-variant text-[18px]">lock</span>
                            </div>
                            <input
                                className="block w-full pl-10 pr-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-on-surface font-body-md focus:ring-2 focus:ring-primary focus:border-primary transition-colors placeholder-on-surface-variant/40"
                                id="password"
                                name="password"
                                placeholder="••••••••"
                                required
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Confirm Password Input */}
                    <div>
                        <label className="block font-label-md text-label-md text-on-surface mb-1.5" htmlFor="confirmPassword">Confirm Password</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="material-symbols-outlined text-on-surface-variant text-[18px]">lock_reset</span>
                            </div>
                            <input
                                className="block w-full pl-10 pr-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-on-surface font-body-md focus:ring-2 focus:ring-primary focus:border-primary transition-colors placeholder-on-surface-variant/40"
                                id="confirmPassword"
                                name="confirmPassword"
                                placeholder="••••••••"
                                required
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-soft font-semibold text-label-md text-on-primary bg-primary hover:bg-inverse-surface focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors mt-6 disabled:opacity-50"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>

                {/* Divider */}
                <div className="w-full mt-8 mb-6">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-outline-variant"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-surface-card font-body-sm text-body-sm text-on-surface-variant">Or continue with</span>
                        </div>
                    </div>
                </div>

                {/* Social Login */}
                <div className="w-full">
                    <button className="w-full flex justify-center items-center py-2.5 px-4 border border-outline-variant rounded-lg bg-surface-container-lowest font-label-md text-label-md text-on-surface hover:bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors" type="button">
                        <span className="material-symbols-outlined text-[18px] mr-2">login</span>
                        Google
                    </button>
                </div>

                {/* Footer Link */}
                <p className="mt-8 font-body-sm text-body-sm text-on-surface-variant text-center w-full">
                    Already have an account?{' '}
                    <Link className="font-label-md text-label-md text-primary font-semibold hover:underline transition-all" href="/login">
                        Sign In
                    </Link>
                </p>
            </main>
        </div>
    );
}
