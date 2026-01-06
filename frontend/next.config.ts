import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  output: 'standalone', // Required for Docker deployment
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cms.climaticpro.ro',
        pathname: '/wp-content/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'cms-climaticpro.asns.ro',
        pathname: '/wp-content/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'climaticpro.ro',
        pathname: '/wp-content/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'topclima.ro',
        pathname: '/image/**',
      },
    ],
  },
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
};

export default withNextIntl(nextConfig);
