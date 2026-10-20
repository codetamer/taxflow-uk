import type { NextConfig } from 'next';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const monorepoRoot = path.resolve(__dirname, '../../');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: monorepoRoot,
  transpilePackages: [
    '@taxflow/ct-engine',
    '@taxflow/shield',
    '@taxflow/doc-engine',
    '@taxflow/ingestion',
    '@taxflow/companies-house',
    '@taxflow/db',
    '@swc/helpers'
  ]
};

export default nextConfig;
