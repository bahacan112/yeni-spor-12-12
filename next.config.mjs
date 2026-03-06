/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      // Novu API proxy — CORS bypass
      {
        source: '/novu-api/:path*',
        destination: 'https://novu-api.mysportschool.com/:path*',
      },
      // Novu WebSocket proxy
      {
        source: '/novu-ws/:path*',
        destination: 'https://novu-ws.mysportschool.com/:path*',
      },
    ];
  },
};

export default nextConfig;
