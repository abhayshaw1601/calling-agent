'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'lord-icon': any;
    }
  }
}

const NAV_LINKS = [
  {
    href: '/dashboard',
    label: 'Overview',
    icon: 'dashboard',
    lordIconSrc: 'https://cdn.lordicon.com/hzomhqxz.json' // Home/Dashboard
  },
  {
    href: '/campaigns',
    label: 'Campaigns',
    icon: 'campaign',
    lordIconSrc: 'https://cdn.lordicon.com/fpipqhrr.json' // Megaphone
  },
  {
    href: '/calls',
    label: 'Call History',
    icon: 'history',
    lordIconSrc: 'https://cdn.lordicon.com/kbtmbyzy.json' // Clock/History
  },
];

export default function NavSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [balance, setBalance] = useState<number | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Fetch wallet balance for sidebar display
  useEffect(() => {
    if (!session) return;
    fetch('/api/wallet/balance')
      .then(r => r.json())
      .then(d => { if (d.success) setBalance(d.balance); })
      .catch(() => { });
  }, [session, pathname]);

  // Don't render sidebar on landing or auth pages
  if (['/', '/login', '/signup'].includes(pathname)) return null;

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`h-full fixed left-0 top-0 bg-surface-container-lowest flex flex-col p-4 border-r border-outline-variant z-30 transition-all duration-300 ease-in-out ${isHovered ? 'w-[240px] shadow-[8px_0_32px_rgba(0,0,0,0.06)]' : 'w-[80px] shadow-soft'
        }`}
    >

      {/* Top Action Toggle & Brand */}
      <div className="flex flex-col items-center w-full mb-6">

        {/* Minimalist Dotted Collapse/Expand indicator (acts as visual header) */}
        {/* <div className="p-1 mb-4 flex items-center justify-center">
          <svg className={`w-5 h-5 text-on-surface-variant transition-transform duration-300 ${isHovered ? 'rotate-180 text-primary' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="12,6 7,12 17,12" fill="currentColor" stroke="none" />
            <line x1="5" y1="16" x2="19" y2="16" strokeDasharray="3 3" />
          </svg>
        </div> */}

        {/* Circular Solid Logo */}
        <div className={`transition-all duration-300 ${!isHovered ? 'w-10 h-10' : 'w-full px-2 flex items-center gap-3'}`}>
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 border border-outline-variant/60 overflow-hidden shadow-sm mx-auto">
            <img src="/logo.png" alt="SnowVoice AI" className="w-8 h-8 object-contain" />
          </div>
          {isHovered && (
            <div className="min-w-0">
              <div className="font-headline-md text-headline-md font-bold text-primary leading-tight truncate">SnowVoice AI</div>
              <div className="font-label-md text-label-md text-on-surface-variant truncate">Campaigns Manager</div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation list */}
      <nav className={`flex-1 flex flex-col gap-2 ${!isHovered ? 'items-center' : ''}`}>
        {NAV_LINKS.map(({ href, label, lordIconSrc }) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              title={!isHovered ? label : undefined}
              className={`flex items-center transition-all duration-200 ease-in-out font-medium relative ${!isHovered
                ? `w-12 h-12 justify-center rounded-xl ${isActive
                  ? 'bg-surface-container-high text-primary shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                }`
                : `gap-3 px-4 py-3 rounded-lg w-full ${isActive
                  ? 'bg-surface-variant text-on-surface font-semibold'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`
                }`}
            >
              <div className="w-6 h-6 flex items-center justify-center shrink-0">
                <lord-icon
                  src={lordIconSrc}
                  trigger="hover"
                  colors={`primary:${isActive ? '#010101' : '#444748'},secondary:${isActive ? '#415aa6' : '#747878'}`}
                  style={{ width: '22px', height: '22px' }}
                />
              </div>
              {isHovered && <span className="font-label-md text-label-md">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom info & actions */}
      <div className={`border-t border-outline-variant pt-4 flex flex-col gap-3 ${!isHovered ? 'items-center' : ''}`}>

        {/* Wallet & Balance link placed here */}
        {!isHovered ? (
          <Link
            href="/wallet"
            title="Wallet"
            className={`w-12 h-12 justify-center rounded-xl flex items-center relative hover:bg-surface-container-low transition-colors ${pathname.startsWith('/wallet') ? 'bg-surface-container-high text-primary shadow-sm' : 'text-on-surface-variant'
              }`}
          >
            <div className="w-6 h-6 flex items-center justify-center shrink-0">
              <lord-icon
                src="https://cdn.lordicon.com/qhviklyi.json" // Wallet
                trigger="hover"
                colors={`primary:${pathname.startsWith('/wallet') ? '#010101' : '#444748'},secondary:${pathname.startsWith('/wallet') ? '#415aa6' : '#747878'}`}
                style={{ width: '22px', height: '22px' }}
              />
            </div>
            {balance !== null && (
              <span className="absolute -top-1.5 -right-1.5 bg-trend-up text-white text-[8px] px-1 py-0.5 rounded-full font-bold shadow-sm">
                ${balance.toFixed(0)}
              </span>
            )}
          </Link>
        ) : (
          balance !== null && (
            <Link
              href="/wallet"
              className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors w-full ${pathname.startsWith('/wallet')
                ? 'bg-surface-variant text-on-surface font-semibold'
                : 'bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 flex items-center justify-center shrink-0">
                  <lord-icon
                    src="https://cdn.lordicon.com/qhviklyi.json"
                    trigger="hover"
                    colors={`primary:${pathname.startsWith('/wallet') ? '#010101' : '#444748'}`}
                    style={{ width: '20px', height: '20px' }}
                  />
                </div>
                <span className="font-label-md text-label-md font-semibold">Wallet</span>
              </div>
              <span className="font-label-md text-label-md font-bold text-trend-up">${balance.toFixed(2)}</span>
            </Link>
          )
        )}

        {/* Help / Support button */}
        <a
          href="#"
          title="Support"
          className={`flex items-center text-on-surface-variant hover:text-on-surface transition-colors ${!isHovered ? 'w-12 h-12 justify-center rounded-xl hover:bg-surface-container-low' : 'gap-3 px-4 py-2 text-xs font-semibold'
            }`}
        >
          <div className="w-5 h-5 flex items-center justify-center shrink-0">
            <lord-icon
              src="https://cdn.lordicon.com/nocovwne.json" // Support bubble
              trigger="hover"
              colors="primary:#444748"
              style={{ width: '20px', height: '20px' }}
            />
          </div>
          {isHovered && <span>Support</span>}
        </a>

        {/* Profile & Sign Out Block */}
        <div className={`flex items-center justify-between group ${!isHovered ? 'flex-col gap-2 py-2' : 'px-2 w-full border-t border-outline-variant/30 pt-3 relative'}`}>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
              {(session?.user?.name || 'User').charAt(0).toUpperCase()}
            </div>
            {isHovered && (
              <span className="text-xs font-semibold text-primary truncate">
                {session?.user?.name || 'User'}
              </span>
            )}
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className={`transition-all duration-300 shrink-0 hidden group-hover:flex items-center justify-center bg-primary rounded-full shadow-sm opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto hover:bg-error ${!isHovered ? 'w-7 h-7 mt-1' : 'w-7 h-7 ml-2'
              }`}
            title="Sign out"
          >
            <div className="w-4 h-4 flex items-center justify-center shrink-0">
              <img
                src="https://img.icons8.com/ios/50/logout-rounded-left.png"
                alt="Logout"
                className="w-full h-full object-contain filter brightness-0 invert"
              />
            </div>
          </button>


        </div>

        {isHovered && <p className="text-[10px] text-on-surface-variant/60 text-center">v1.0.0</p>}
      </div>

    </aside>
  );
}
