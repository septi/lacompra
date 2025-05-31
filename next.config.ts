const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  reactStrictMode: true,
  devIndicators: false,

  // Ensure proper handling of React Server Components
  experimental: {
    serverActions: true,
  },
};

module.exports = withPWA(nextConfig);
