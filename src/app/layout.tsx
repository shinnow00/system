import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ultimate System",
  description: "The Ultimate System for Ultimate Advertising House All the Rights Reserved By Muhammad Shinnawy 2025",
};

import { AuthProvider } from "@/hooks/useUser";
import { Toaster } from "@/components/ui/sonner";
import NotificationListener from "@/components/NotificationListener";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <NotificationListener />
          <Toaster position="top-right" richColors theme="dark" />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
