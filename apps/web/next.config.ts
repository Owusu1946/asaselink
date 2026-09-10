import "@asaselink/env/web";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  reactCompiler: true,
  poweredByHeader: false,
  turbopack: {},
};

export default nextConfig;

if (process.env.ENABLE_CLOUDFLARE_DEV === "true") {
  initOpenNextCloudflareForDev();
}
