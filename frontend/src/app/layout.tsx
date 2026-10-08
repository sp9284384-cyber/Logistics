import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ganraj Logistics Service | Reliable Transport. On Time. Every Time.",
  description:
    "Ganraj Logistics Service provides reliable full truck load and part load transport for businesses across India, with timely pickup, safe delivery and competitive rates.",
  keywords: [
    "Ganraj Logistics",
    "logistics India",
    "FTL",
    "LTL",
    "transport service",
    "truck load",
    "part load",
    "All India transportation",
  ],
  authors: [{ name: "Ganraj Logistics Service" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Ganraj Logistics Service",
    description:
      "Reliable Transport & Logistics Solutions Across India. FTL, LTL, Industrial & Distribution transportation.",
    siteName: "Ganraj Logistics Service",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ganraj Logistics Service",
    description:
      "Reliable Transport & Logistics Solutions Across India.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
