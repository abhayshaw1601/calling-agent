'use client';

import React, { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function LoginForm() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const registered = searchParams.get('registered') === 'true';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await signIn('credentials', {
                redirect: false,
                username,
                password,
            });

            if (result?.error) {
                setError(result.error);
            } else {
                router.push('/dashboard');
                router.refresh();
            }
        } catch (err: any) {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="w-full max-w-md bg-surface-card rounded-xl shadow-soft p-8 border border-outline-variant flex flex-col items-center">
            {/* Header / Logo */}
            <div className="mb-8 flex flex-col items-center text-center">
                <h1 className="font-headline-lg text-[28px] font-bold text-primary mb-2 tracking-tight">SnowVoice AI</h1>
                <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">Welcome Back</h2>
                <p className="font-body-md text-body-md text-on-surface-variant mt-1.5">Please enter your details to sign in.</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="w-full space-y-5">
                {registered && (
                    <div className="p-3 bg-accent-mint/30 border border-trend-up/30 text-trend-up rounded-lg text-sm text-center font-medium">
                        ✓ Registration successful! Please sign in.
                    </div>
                )}

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
                            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">mail</span>
                        </div>
                        <input
                            className="block w-full pl-10 pr-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-on-surface font-body-md focus:ring-2 focus:ring-primary focus:border-primary transition-colors placeholder-on-surface-variant/40"
                            id="username"
                            name="username"
                            placeholder="testuser"
                            required
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>
                </div>

                {/* Password Input */}
                <div>
                    <div className="flex justify-between items-center mb-1.5">
                        <label className="block font-label-md text-label-md text-on-surface" htmlFor="password">Password</label>
                        <a className="font-label-md text-label-md text-secondary hover:text-primary transition-colors" href="#">Forgot Password?</a>
                    </div>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">lock</span>
                        </div>
                        <input
                            className="block w-full pl-10 pr-10 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-on-surface font-body-md focus:ring-2 focus:ring-primary focus:border-primary transition-colors placeholder-on-surface-variant/40"
                            id="password"
                            name="password"
                            placeholder="••••••••"
                            required
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <button
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-on-surface-variant hover:text-on-surface transition-colors focus:outline-none"
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            <span className="material-symbols-outlined text-[18px]">
                                {showPassword ? "visibility" : "visibility_off"}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-soft font-semibold text-label-md text-on-primary bg-primary hover:bg-inverse-surface focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors mt-6 disabled:opacity-50"
                    type="submit"
                    disabled={loading}
                >
                    {loading ? 'Signing In...' : 'Sign In'}
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
            <div className="w-full grid grid-cols-2 gap-4">
                <button className="flex justify-center items-center py-2 px-4 border border-outline-variant rounded-lg bg-surface-container-lowest font-label-md text-label-md text-on-surface hover:bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors" type="button">
                    <span className="material-symbols-outlined text-[18px] mr-2">login</span>
                    Google
                </button>
                <button className="flex justify-center items-center py-2 px-4 border border-outline-variant rounded-lg bg-surface-container-lowest font-label-md text-label-md text-on-surface hover:bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors" type="button">
                    <span className="material-symbols-outlined text-[18px] mr-2">code</span>
                    GitHub
                </button>
            </div>

            {/* Footer Link */}
            <p className="mt-8 font-body-sm text-body-sm text-on-surface-variant text-center w-full">
                Don't have an account?{' '}
                <Link className="font-label-md text-label-md text-primary font-semibold hover:underline transition-all" href="/signup">
                    Create an account
                </Link>
            </p>
        </main>
    );
}

export default function LoginPage() {
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-surface-container p-4">
            <Suspense fallback={
                <div className="text-on-surface-variant font-mono text-sm animate-pulse">Loading login portal...</div>
            }>
                <LoginForm />
            </Suspense>
        </div>
    );
}
