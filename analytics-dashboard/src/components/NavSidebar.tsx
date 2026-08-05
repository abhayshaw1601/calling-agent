'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';

const NAV_LINKS = [
  {
    href: '/dashboard',
    label: 'Overview',
    icon: 'dashboard',
  },
  {
    href: '/campaigns',
    label: 'Campaigns',
    icon: 'campaign',
  },
  {
    href: '/wallet',
    label: 'Wallet',
    icon: 'account_balance_wallet',
  },
  {
    href: '/calls',
    label: 'Call History',
    icon: 'history',
  },
];

export default function NavSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [balance, setBalance] = useState<number | null>(null);

  // Fetch wallet balance for sidebar display
  useEffect(() => {
    if (!session) return;
    fetch('/api/wallet/balance')
      .then(r => r.json())
      .then(d => { if (d.success) setBalance(d.balance); })
      .catch(() => {});
  }, [session, pathname]);

  // Don't render sidebar on landing or auth pages
  if (['/', '/login', '/signup'].includes(pathname)) return null;

  return (
    <aside className="w-sidebar-width h-full fixed left-0 top-0 bg-surface-container-lowest shadow-soft flex flex-col p-4 border-r border-outline-variant z-20">
      {/* Brand */}
      <div className="mb-8 px-2 flex items-center gap-3">
        <div className="w-8 h-8 rounded overflow-hidden flex items-center justify-center shrink-0 border border-outline-variant/30">
          <img src="/logo.png" alt="SnowVoice AI" className="w-full h-full object-cover" />
        </div>
        <div>
          <div className="font-headline-md text-headline-md font-bold text-primary leading-tight">SnowVoice AI</div>
          <div className="font-label-md text-label-md text-on-surface-variant">Campaign Manager</div>
        </div>
      </div>

      {/* New Campaign Button */}
      <button 
        onClick={() => router.push('/campaigns')}
        className="w-full bg-primary text-on-primary font-label-md text-label-md py-3 rounded-lg mb-6 hover:bg-inverse-surface transition-colors flex items-center justify-center gap-2 font-medium"
      >
        <span className="material-symbols-outlined text-[18px]">add</span>
        New Campaign
      </button>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1">
        {NAV_LINKS.map(({ href, label, icon }) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ease-in-out font-medium ${
                isActive
                  ? 'bg-surface-variant text-on-surface font-semibold'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              }`}
            >
              <span className={`material-symbols-outlined ${isActive ? 'text-primary' : 'text-on-surface-variant'}`}>{icon}</span>
              <span className="font-label-md text-label-md">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom info & sign out */}
      <div className="mt-auto border-t border-outline-variant pt-4 flex flex-col gap-3">
        {/* Wallet quick view */}
        {balance !== null && (
          <Link href="/wallet" className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-container-low hover:bg-surface-container-high transition-colors">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-trend-up text-[18px]">account_balance_wallet</span>
              <span className="font-label-md text-label-md text-on-surface-variant">Balance</span>
            </div>
            <span className="font-label-md text-label-md font-bold text-trend-up">${balance.toFixed(2)}</span>
          </Link>
        )}

        {/* User profile & sign out */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
              {(session?.user?.name || 'User').charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-semibold text-primary truncate">
              {session?.user?.name || 'User'}
            </span>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="text-on-surface-variant hover:text-error transition-colors shrink-0 ml-2"
            title="Sign out"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
          </button>
        </div>
        <p className="text-[10px] text-on-surface-variant/60 text-center">v1.0.0</p>
      </div>
    </aside>
  );
}

