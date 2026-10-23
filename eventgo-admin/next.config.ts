
import type { NextConfig } from "next";

const authUrl =
  process.env.NODE_ENV === "production"
    ? "https://eventgo-auth.vercel.app"
    : "http://localhost:3002";

const nextConfig: NextConfig = {
  basePath: "/admin",

  transpilePackages: [
    "@eventgo/ui",
    "@eventgo/backend",
  ],

  experimental: {
    agentFeedback: true,
  },

  cacheComponents: true,
  partialPrefetching: true,

  async rewrites() {
    return [
      {
        source: "/admin/api/auth/logout",
        destination:
          `${authUrl}/auth/api/auth/logout`,
        basePath: false,
      },
    ];
  },

  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
