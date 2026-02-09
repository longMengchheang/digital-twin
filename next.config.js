/** @type {import('next').NextConfig} */
const nextConfig = {
  // rewrites removed as backend is now integrated

  experimental: {
    instrumentationHook: true,
  },
};

module.exports = nextConfig;
