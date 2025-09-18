/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  experimental: {
    // optimizeCss disabled - requires 'critters' package
    // optimizeCss: true,
  },

  // Image optimization
  images: {
    domains: ['cdn.jsdelivr.net'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 86400, // 24 hours
  },

  // Compression and caching
  compress: true,

  // Production optimizations
  ...(process.env.NODE_ENV === 'production' && {
    // Enable static optimization
    trailingSlash: false,
  }),

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
          // Performance headers
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          // Security headers
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
      // Specific caching for static assets
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Web Workers
      {
        source: '/workers/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
        ],
      },
    ];
  },

  webpack: (config, { dev, isServer }) => {
    // Existing fallback
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };

    // Performance optimizations for production
    if (!dev && !isServer) {
      // Code splitting optimizations
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          // Vendor libraries
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            reuseExistingChunk: true,
          },
          // Audio processing libraries
          audio: {
            test: /[\\/]node_modules[\\/](tone|essentia\.js)[\\/]/,
            name: 'audio',
            priority: 20,
            reuseExistingChunk: true,
          },
          // AI/ML libraries
          ai: {
            test: /[\\/]node_modules[\\/](@mediapipe|@tensorflow)[\\/]/,
            name: 'ai',
            priority: 20,
            reuseExistingChunk: true,
          },
          // 3D/Graphics libraries
          graphics: {
            test: /[\\/]node_modules[\\/](three|@react-three)[\\/]/,
            name: 'graphics',
            priority: 20,
            reuseExistingChunk: true,
          },
          // Common chunks
          common: {
            name: 'common',
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      };

      // Tree shaking optimizations
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;

      // Bundle analyzer for debugging (uncomment when needed)
      // const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      // config.plugins.push(
      //   new BundleAnalyzerPlugin({
      //     analyzerMode: 'static',
      //     openAnalyzer: false,
      //   })
      // );
    }

    // Web Workers support
    config.module.rules.push({
      test: /\.worker\.(js|ts)$/,
      use: {
        loader: 'worker-loader',
        options: {
          filename: 'static/[hash].worker.js',
          publicPath: '/_next/',
        },
      },
    });

    // Audio file support
    config.module.rules.push({
      test: /\.(mp3|wav|ogg|flac)$/,
      use: {
        loader: 'file-loader',
        options: {
          publicPath: '/_next/static/audio/',
          outputPath: 'static/audio/',
        },
      },
    });

    return config;
  },
};

module.exports = nextConfig;