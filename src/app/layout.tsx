import { Navbar } from "@/components/Navbar";
import { QueryClientProvider } from "@/components/QueryClientProvider";
import { SessionProvider } from "@/components/SessionProvider";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { Metadata } from "next";
import localFont from "next/font/local";

import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "W&P Silva Imóveis",
  description: "Compra e venda de imóveis de leilão",
};

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
        <SessionProvider>
          <Navbar />
          <QueryClientProvider>
            <div className="p-4">{children}</div>
            {process.env.NODE_ENV === "development" && <ReactQueryDevtools />}
          </QueryClientProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
