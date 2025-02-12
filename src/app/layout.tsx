import { Navbar } from "@/components/Navbar";
import { Toaster } from "@/components/ui/toaster";
import { GoogleApiProvider } from "@/features/google/components/GoogleApiProvider";
import { SessionProvider } from "@/features/login/components/SessionProvider";
import { QueryClientProvider } from "@/features/react-query/components/QueryClientProvider";
import type { Metadata } from "next";
import localFont from "next/font/local";

// eslint-disable-next-line no-restricted-imports
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
          <QueryClientProvider
            isDevelopmentEnvironment={process.env.NODE_ENV === "development"}
          >
            <GoogleApiProvider apiKey={process.env.GOOGLE_MAPS_API_KEY!}>
              <div className="p-4">{children}</div>
            </GoogleApiProvider>
          </QueryClientProvider>
        </SessionProvider>
        <Toaster />
      </body>
    </html>
  );
}
