import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@reactpilot/config'],
  output: 'export',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
