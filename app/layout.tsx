import type { Metadata } from "next";

import "./globals.css";
import "currency-flags/dist/currency-flags.min.css";

import { SmoothScrollProvider } from "@/components/providers/smooth-scroll-provider";

export const metadata: Metadata = {
  title: "Fiat & Crypto Converter | Real-Time Exchange Rates",
  description:
    "Instantly convert fiat and crypto currencies with real-time exchange rates. Fast, simple, open-source currency converter with multi-currency results.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <SmoothScrollProvider>{children}</SmoothScrollProvider>
      </body>
    </html>
  );
}
