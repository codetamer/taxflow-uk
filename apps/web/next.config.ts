import type { NextConfig } from 'next';
import { fileURLToPath } from 'url';

const monorepoRoot = fileURLToPath(new URL('../../', import.meta.url));

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: monorepoRoot,
  transpilePackages: [
    '@taxflow/ct-engine',
    '@taxflow/shield',
    '@taxflow/doc-engine',
    '@taxflow/ingestion',
    '@taxflow/companies-house',
    '@taxflow/db'
  ]
};

export default nextConfig;

