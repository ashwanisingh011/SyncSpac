import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/org-dashboard',
        destination: '/dashboard',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
