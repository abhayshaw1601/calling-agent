import type { Metadata } from "next";
import React from "react";
import "./globals.css";
import AuthProvider from "@/components/SessionProvider";
import AppLayoutWrapper from "@/components/AppLayoutWrapper";
import Script from "next/script";

export const metadata: Metadata = {
  title: "SnowVoice AI - Campaign Manager",
  description: "Real-time cost analysis, wallet credits, and campaign management for SnowVoice AI agents",
  icons: {
    icon: "/logo.png",
    shortcut: "/favicon.ico",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-neutral-50 text-neutral-950 font-sans min-h-screen dark:bg-neutral-900 dark:text-neutral-50">
        <AuthProvider>
          <AppLayoutWrapper>{children}</AppLayoutWrapper>
        </AuthProvider>
        <Script src="https://cdn.lordicon.com/lordicon.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
