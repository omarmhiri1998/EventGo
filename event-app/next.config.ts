import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@eventgo/backend"],

  cacheComponents: true,

  partialPrefetching: true,

  async rewrites() {
    return [
      {
        source: "/auth",
        destination: "https://eventgo-auth.vercel.app/auth",
      },
      {
        source: "/auth/:path*",
        destination:
          "https://eventgo-auth.vercel.app/auth/:path*",
      },
      {
        source: "/admin",
        destination:
          "https://eventgo-admin-ten.vercel.app/admin",
      },
      {
        source: "/admin/:path*",
        destination:
          "https://eventgo-admin-ten.vercel.app/admin/:path*",
      },
    ];
  },
};

export default nextConfig;