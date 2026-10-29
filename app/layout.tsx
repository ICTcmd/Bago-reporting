import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover', // This enables safe-area-inset support
}

export const metadata: Metadata = {
  title: "Bago Safe - Incident Reporting System",
  description: "Report non-emergency incidents to Bago City DRRMO. For emergencies, call 911.",
  keywords: ["Bago City", "incident reporting", "DRRMO", "disaster management", "safety", "Philippines"],
  authors: [{ name: "Bago City DRRMO" }],
  openGraph: {
    title: "Bago Safe - Incident Reporting System",
    description: "Report non-emergency incidents to Bago City DRRMO",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
