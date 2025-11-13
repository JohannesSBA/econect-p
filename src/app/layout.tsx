// File: app/[lang]/layout.tsx

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ErrorBoundary } from "react-error-boundary";
import NotFound from "./not-found";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import NextAuthSessionProvider from "@/app/providers/NextAuthSessionProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Econnect",
  description: "Get a job with Us",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ErrorBoundary fallback={<NotFound />}>
          <NextAuthSessionProvider session={session}>
            <Toaster position="top-right" richColors />
            {children}
          </NextAuthSessionProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
