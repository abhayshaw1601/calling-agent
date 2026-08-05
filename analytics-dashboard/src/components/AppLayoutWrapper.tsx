'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import NavSidebar from './NavSidebar';
import { useSession } from 'next-auth/react';

export default function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  
  // Check if we are on landing page, login page, or signup page
  const isLandingOrAuthRoute = ['/', '/login', '/signup'].includes(pathname);

  if (isLandingOrAuthRoute) {
    return <div className="min-h-screen w-full flex flex-col">{children}</div>;
  }

  // Determine page title based on pathname
  let pageTitle = "Overview Dashboard";
  if (pathname.startsWith('/campaigns')) {
    pageTitle = "Campaigns & Billing";
  } else if (pathname.startsWith('/wallet')) {
    pageTitle = "Wallet & Billing";
  } else if (pathname.startsWith('/calls')) {
    pageTitle = "Call History";
  }

  // Get user initials for profile
  const userInitials = session?.user?.name
    ? session.user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2)
    : 'US';

  return (
    <div className="min-h-screen flex w-full bg-canvas-bg font-body-md text-on-surface antialiased overflow-hidden">
      <NavSidebar />
      <div className="flex-1 flex flex-col ml-[240px] h-screen overflow-hidden">
        {/* TopNavBar */}
        <header className="bg-surface shadow-soft flex justify-between items-center h-16 px-gutter border-b border-outline-variant z-10 shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="font-headline-md text-headline-md font-bold text-primary">{pageTitle}</h2>
          </div>
          <div className="flex items-center gap-4">
            <button className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors">
              <span className="material-symbols-outlined text-[22px]">notifications</span>
            </button>
            <div className="flex items-center gap-3 pl-2 border-l border-outline-variant">
              <div className="w-9 h-9 rounded-full bg-accent-purple text-primary flex items-center justify-center font-semibold text-sm">
                {userInitials}
              </div>
              <div className="hidden md:block text-left">
                <div className="font-label-md text-label-md font-semibold text-primary">{session?.user?.name || 'User'}</div>
                <div className="text-[10px] text-on-surface-variant">{session?.user?.email || 'user@snowvoice.ai'}</div>
              </div>
            </div>
          </div>
        </header>
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-margin-page">
          {children}
        </main>
      </div>
    </div>
  );
}

