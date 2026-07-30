'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import NavSidebar from './NavSidebar';

export default function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Check if we are on landing page, login page, or signup page
  const isLandingOrAuthRoute = ['/', '/login', '/signup'].includes(pathname);

  if (isLandingOrAuthRoute) {
    return <div className="min-h-screen w-full flex flex-col">{children}</div>;
  }

  return (
    <div className="min-h-screen flex w-full bg-neutral-50 dark:bg-neutral-900">
      <NavSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="p-8 overflow-y-auto flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
