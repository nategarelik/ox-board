/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // Configure headers for MediaPipe CDN and WASM loading
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp'
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin'
          }
        ]
      }
    ]
  },

  // Configure webpack for MediaPipe and WASM support
  webpack: (config, { dev, isServer }) => {
    // Handle MediaPipe WASM files
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'asset/resource'
    });

    // Allow importing from MediaPipe CDN
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      stream: false,
      crypto: false,
      os: false,
    };

    return config;
  },

  // Experimental features for WebAssembly support
  experimental: {
    esmExternals: 'loose'
  }
};

module.exports = nextConfig;