import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { env } from "@asaselink/env/web";

import "../index.css";

import Header from "@/components/header";
import Providers from "@/components/providers";

const geistSans = Geist({
  variable: "--font-asase-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AsaseLink",
  description: "Discover, understand, and reserve verified land with confidence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={geistSans.variable} suppressHydrationWarning>
      <body>
        {env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? (
          <ClerkProvider>
            <Providers>
              <div className="grid grid-rows-[auto_1fr] h-svh">
                <Header />
                {children}
              </div>
            </Providers>
          </ClerkProvider>
        ) : (
          <Providers>
            <div className="grid grid-rows-[auto_1fr] h-svh">
              <Header />
              {children}
            </div>
          </Providers>
        )}
      </body>
    </html>
  );
}
