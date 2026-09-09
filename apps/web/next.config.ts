import "@asaselink/env/web";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  reactCompiler: true,
  poweredByHeader: false,
  webpack: (config) => {
    config.cache = false;
    return config;
  },
};

export default nextConfig;

initOpenNextCloudflareForDev();
