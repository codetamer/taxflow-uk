import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@taxflow/ct-engine',
    '@taxflow/shield',
    '@taxflow/doc-engine',
    '@taxflow/ingestion'
  ]
};

export default nextConfig;

