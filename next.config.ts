import withSerwistInit from '@serwist/next';
import type { NextConfig } from 'next';

const withSerwist = withSerwistInit({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  register: true,
  disable: process.env.NODE_ENV === 'development'
});

const nextConfig: NextConfig = {
  agentRules: false,
  reactStrictMode: true,
  devIndicators: false,
  turbopack: {},
};

export default withSerwist(nextConfig);
