
import type { NextConfig } from "next";

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
