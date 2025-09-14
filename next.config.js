/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['cdn.jsdelivr.net'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Relaxed CORS headers to allow MediaPipe CDN resources
          // COEP and COOP headers removed to fix MediaPipe loading issues
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'cross-origin',
          },
        ],
      },
    ];
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },
};

module.exports = nextConfig;