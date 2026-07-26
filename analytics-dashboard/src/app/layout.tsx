import type { Metadata } from "next";
import React from "react";
import "./globals.css";
import AuthProvider from "@/components/SessionProvider";
import NavSidebar from "@/components/NavSidebar";

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
        <AuthProvider>
          <NavSidebar />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0">
            <main className="p-8 overflow-y-auto flex-1">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
