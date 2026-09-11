import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { env } from "@asaselink/env/web";

import "../index.css";
import "goey-toast/styles.css";

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
  const content = (
    <html lang="en" className={geistSans.variable} suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );

  if (env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <ClerkProvider
        signInUrl="/sign-in"
        signUpUrl="/sign-up"
        signInFallbackRedirectUrl="/auth/continue"
        signUpFallbackRedirectUrl="/auth/continue"
      >
        {content}
      </ClerkProvider>
    );
  }

  return content;
}
