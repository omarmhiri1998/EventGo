
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/auth",

  transpilePackages: [
    "@eventgo/backend",
  ],

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
