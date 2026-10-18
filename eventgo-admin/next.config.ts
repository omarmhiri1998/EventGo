
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/admin",

  transpilePackages: [
    "@eventgo/backend",
  ],

  experimental: {
    agentFeedback: true,
  },

  cacheComponents: true,

  partialPrefetching: true,
};

export default nextConfig;
