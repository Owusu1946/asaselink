const AUTH_PATHS = ["/sign-in", "/sign-up", "/sso-callback"];
const ALLOWED_DESTINATIONS = ["/account", "/company/apply", "/onboarding/profile", "/workspaces"];

/** Returns a same-origin path, never an absolute or protocol-relative URL. */
export function safeRedirectPath(value: string | null | undefined, fallback = "/auth/continue") {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }

  try {
    const parsed = new URL(value, "https://asaselink.invalid");
    if (parsed.origin !== "https://asaselink.invalid") return fallback;
    if (AUTH_PATHS.some((path) => parsed.pathname === path || parsed.pathname.startsWith(`${path}/`))) {
      return fallback;
    }
    if (!ALLOWED_DESTINATIONS.some((path) => parsed.pathname === path || parsed.pathname.startsWith(`${path}/`))) {
      return fallback;
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
