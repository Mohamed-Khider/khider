import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
//  allowedDevOrigins: ['http://192.168.70.75:3000'],
 allowedDevOrigins: ['local-origin.dev', '*.local-origin.dev'],
 eslint: {
    ignoreDuringBuilds: true,
  },
    typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
