import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  distDir: process.env.LOLA_E2E === '1' ? '.next-e2e' : '.next',
  poweredByHeader: false,
  devIndicators: false,
  turbopack: { root: path.resolve(import.meta.dirname, '../..') },
  async rewrites() {
    const apiUrl = process.env.LARAVEL_API_URL || 'http://127.0.0.1:8001';
    return [
      { source: '/api/v1/:path*', destination: `${apiUrl}/api/v1/:path*` },
      { source: '/sanctum/:path*', destination: `${apiUrl}/sanctum/:path*` },
    ];
  },
};

export default nextConfig;
