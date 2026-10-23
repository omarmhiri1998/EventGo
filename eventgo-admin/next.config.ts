
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

  // Disable partial prerendering for this
  // authentication-dependent admin app.
  cacheComponents: false,

  async rewrites() {
    return [
      {
        source: "/admin/api/auth/logout",
        destination: `${authUrl}/auth/api/auth/logout`,
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
