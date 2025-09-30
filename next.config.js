const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development", // Disable SW generation in dev to prevent warnings
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: "NetworkFirst",
      options: {
        cacheName: "offlineCache",
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
      handler: "CacheFirst",
      options: {
        cacheName: "images",
        expiration: {
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
    {
      urlPattern: /\.(?:js|css|woff|woff2|ttf|eot)$/,
      handler: "CacheFirst",
      options: {
        cacheName: "static-resources",
        expiration: {
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  experimental: {
    // optimizeCss disabled - requires 'critters' package
    // optimizeCss: true,
  },

  // Image optimization
  images: {
    domains: ["cdn.jsdelivr.net"],
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 86400, // 24 hours
  },

  // Compression and caching
  compress: true,

  // Production optimizations
  ...(process.env.NODE_ENV === "production" && {
    // Enable static optimization
    trailingSlash: false,
  }),

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Relaxed CORS headers to allow MediaPipe CDN resources
          // COEP and COOP headers removed to fix MediaPipe loading issues
          {
            key: "Cross-Origin-Resource-Policy",
            value: "cross-origin",
          },
          // Performance headers
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
          // Security headers
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
        ],
      },
      // Specific caching for static assets
      {
        source: "/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // Web Workers
      {
        source: "/workers/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
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
      // Use Next.js default optimization settings for better compatibility
      // Custom splitChunks removed to leverage Next 15's built-in optimizations

      // Tree shaking optimizations
      config.optimization.usedExports = true;
      // Remove sideEffects override to prevent breaking tree-shaking
      // config.optimization.sideEffects = false;

      // Bundle analyzer for debugging
      if (process.env.ANALYZE === "true") {
        const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: "static",
            openAnalyzer: false,
          }),
        );
      }
    }

    // Next.js 15 compatible worker and asset handling
    // Workers will be loaded using new Worker(new URL()) syntax
    // Audio files will be handled as static assets

    return config;
  },
};

module.exports = withPWA(nextConfig);
