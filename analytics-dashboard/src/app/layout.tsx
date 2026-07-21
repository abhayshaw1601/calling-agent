import type { Metadata } from "next";
import React from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Voice Agent Dashboard",
  description: "Real-time cost analysis and telemetry logs for voice agents",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-neutral-50 text-neutral-950 font-sans min-h-screen flex dark:bg-neutral-900 dark:text-neutral-50">
        
        {/* Navigation Sidebar */}
        <aside className="w-64 border-r border-neutral-200 bg-white p-6 flex flex-col justify-between dark:border-neutral-800 dark:bg-neutral-950">
          <div>
            <h1 className="text-xl font-bold tracking-tight mb-8">VoiceAgent AI</h1>
            <nav className="space-y-2">
              <a href="/" className="block px-3 py-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 font-medium">
                Overview
              </a>
              <a href="/calls" className="block px-3 py-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 font-medium">
                Call Logs
              </a>
            </nav>
          </div>
          <div className="text-xs text-neutral-500">
            v1.0.0
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b border-neutral-200 bg-white px-8 flex items-center justify-between dark:border-neutral-800 dark:bg-neutral-950">
            <h2 className="font-semibold text-lg">Dashboard</h2>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-neutral-500">Telemetry Connection: Connected</span>
            </div>
          </header>
          
          <main className="p-8 overflow-y-auto flex-1">
            {children}
          </main>
        </div>

      </body>
    </html>
  );
}
