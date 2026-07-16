import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Proxies browser calls through this app's own origin so the backend's
  // session cookie is set first-party (megatha-resto.vercel.app) instead of
  // a separate domain the browser would never send back on later navigation.
  async rewrites() {
    return [{ source: "/backend-api/:path*", destination: `${process.env.BACKEND_URL}/:path*` }];
  },
};

export default nextConfig;
