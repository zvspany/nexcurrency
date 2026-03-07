import type { Metadata } from "next";

import "./globals.css";
import "currency-flags/dist/currency-flags.min.css";

export const metadata: Metadata = {
  title: "NexCurrency | Modern Currency & Crypto Converter",
  description:
    "Convert fiat and crypto assets instantly with live rates, smart formatting, and a premium modern interface."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
