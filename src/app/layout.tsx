import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ErrorBoundary } from "react-error-boundary";
import NotFound from "./not-found";

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

export async function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'am' }]
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: { lang: 'en' | 'am' }; // Remove Promise wrapper
}>) {



  return (
       <ErrorBoundary fallback={<NotFound />}>
        <Toaster position="top-center" richColors />
    <html lang={params.lang}>
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          {children}
        </body>
    </html>
      </ErrorBoundary>

  );
}
