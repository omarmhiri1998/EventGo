
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@eventgo/backend"],

  cacheComponents: true,

  partialPrefetching: true,
};

export default nextConfig;
