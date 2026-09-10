import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const protectedPrefixes = [
  "/account",
  "/admin",
  "/auth/continue",
  "/company",
  "/dashboard",
  "/onboarding",
  "/workspaces",
];

function isProtectedPath(pathname: string) {
  return protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export default process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  ? clerkMiddleware(
      async (auth, request) => {
        if (isProtectedPath(request.nextUrl.pathname)) {
          await auth.protect();
        }
      },
      {
      signInUrl: "/sign-in",
      signUpUrl: "/sign-up",
      },
    )
  : (request: Request) => {
      const url = new URL(request.url);
      if (!isProtectedPath(url.pathname)) return NextResponse.next();

      const signInUrl = new URL("/sign-in", url);
      signInUrl.searchParams.set("redirect_url", `${url.pathname}${url.search}`);
      return NextResponse.redirect(signInUrl);
    };

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
