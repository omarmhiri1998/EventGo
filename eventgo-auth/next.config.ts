
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/auth",

  transpilePackages: [
    "@eventgo/backend",
  ],

  experimental: {
    cpus: 2,
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
