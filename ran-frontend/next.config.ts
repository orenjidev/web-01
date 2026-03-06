import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: (process.env.IMAGE_DOMAINS ?? "")
      .split(",")
      .filter(Boolean)
      .map((h) => ({ protocol: "https" as const, hostname: h.trim() })),
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
  hideSourceMaps: true,
});
