/**
 * Production CDN Configuration
 * OX Gesture Stem Player - CDN & Asset Optimization
 */

export const productionCdnConfig = {
  // Primary CDN Configuration
  cdn: {
    provider: "cloudflare", // 'cloudflare', 'aws', 'vercel'
    baseUrl: process.env.CDN_BASE_URL || "https://cdn.ox-player.app",

    // Regional endpoints for global performance
    regions: {
      "north-america": "https://na.cdn.ox-player.app",
      europe: "https://eu.cdn.ox-player.app",
      "asia-pacific": "https://ap.cdn.ox-player.app",
      "south-america": "https://sa.cdn.ox-player.app",
    },

    // Fallback configuration
    fallback: {
      enabled: true,
      primaryProvider: "cloudflare",
      secondaryProvider: "aws",
    },
  },

  // Asset Optimization
  optimization: {
    // Image optimization
    images: {
      enabled: true,
      formats: ["webp", "avif", "png"],
      quality: {
        webp: 85,
        avif: 80,
        jpeg: 85,
      },
      sizes: {
        thumbnail: "150x150",
        preview: "400x400",
        full: "1200x1200",
        hero: "1920x1080",
      },
      deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
      breakpoints: [640, 768, 1024, 1280, 1536],
    },

    // Audio optimization
    audio: {
      enabled: true,
      formats: ["mp3", "wav", "flac", "aac"],
      bitrates: {
        low: "128k",
        medium: "256k",
        high: "320k",
        lossless: "1411k", // FLAC
      },
      sampleRates: [44100, 48000, 96000],
    },

    // Video optimization (for promotional content)
    video: {
      enabled: false, // Disabled until needed
      formats: ["webm", "mp4"],
      resolutions: ["720p", "1080p", "1440p"],
      bitrates: {
        "720p": "2500k",
        "1080p": "5000k",
        "1440p": "8000k",
      },
    },

    // Font optimization
    fonts: {
      enabled: true,
      formats: ["woff2", "woff", "ttf"],
      display: "swap",
      preload: ["primary"], // Which fonts to preload
    },
  },

  // Caching Strategy
  caching: {
    // Default cache durations (in seconds)
    durations: {
      // Static assets (long cache)
      static: 31536000, // 1 year
      fonts: 31536000, // 1 year
      icons: 2592000, // 30 days

      // Dynamic assets (medium cache)
      images: 86400, // 24 hours
      audio: 3600, // 1 hour

      // Frequently changing (short cache)
      api: 300, // 5 minutes
      userData: 60, // 1 minute
    },

    // Cache control headers
    headers: {
      "static-assets": "public, max-age=31536000, immutable",
      images: "public, max-age=86400, must-revalidate",
      audio: "public, max-age=3600, must-revalidate",
      "api-responses": "public, max-age=300, s-maxage=300",
    },

    // Edge cache settings
    edge: {
      maxAge: 86400, // 24 hours at edge
      staleWhileRevalidate: 3600, // Serve stale content for 1 hour while revalidating
    },
  },

  // Security
  security: {
    // HTTPS enforcement
    hsts: {
      enabled: true,
      maxAge: 31536000, // 1 year
      includeSubdomains: true,
      preload: true,
    },

    // Content Security Policy for CDN
    csp: {
      enabled: true,
      directives: {
        "default-src": ["'self'"],
        "script-src": [
          "'self'",
          "'unsafe-inline'",
          "https://cdn.ox-player.app",
        ],
        "style-src": ["'self'", "'unsafe-inline'", "https://cdn.ox-player.app"],
        "img-src": ["'self'", "data:", "blob:", "https://cdn.ox-player.app"],
        "font-src": ["'self'", "https://cdn.ox-player.app"],
        "connect-src": [
          "'self'",
          "https://api.ox-player.app",
          "wss://api.ox-player.app",
        ],
        "media-src": ["'self'", "blob:", "https://cdn.ox-player.app"],
      },
    },

    // CORS settings
    cors: {
      enabled: true,
      origins: [
        "https://ox-player.app",
        "https://www.ox-player.app",
        "https://staging.ox-player.app",
      ],
      credentials: false,
      maxAge: 86400, // 24 hours
    },
  },

  // Performance Monitoring
  monitoring: {
    // Real User Monitoring (RUM)
    rum: {
      enabled: true,
      sampleRate: 0.1, // Sample 10% of requests
      endpoint: "/api/rum",
    },

    // CDN analytics
    analytics: {
      enabled: true,
      trackBandwidth: true,
      trackLatency: true,
      trackCacheHits: true,
      trackErrors: true,
    },

    // Performance budgets
    budgets: {
      maxLatency: 100, // ms
      maxErrorRate: 0.01, // 1%
      minCacheHitRate: 0.95, // 95%
    },
  },

  // Compression
  compression: {
    // Gzip/Brotli settings
    gzip: {
      enabled: true,
      level: 6, // Compression level (1-9)
      minSize: 1024, // Minimum size to compress
    },

    // Brotli settings
    brotli: {
      enabled: true,
      quality: 4, // Compression quality (1-11)
      minSize: 1024,
    },

    // Text compression
    text: {
      javascript: true,
      css: true,
      html: true,
      json: true,
      xml: true,
    },

    // Image compression
    images: {
      jpeg: true,
      png: true,
      webp: true,
      avif: true,
    },
  },

  // Load Balancing
  loadBalancing: {
    // Geographic load balancing
    geo: {
      enabled: true,
      defaultRegion: "north-america",
      fallbackRegions: ["europe", "asia-pacific"],
    },

    // Failover configuration
    failover: {
      enabled: true,
      healthCheckInterval: 30, // seconds
      healthCheckPath: "/health",
      maxFailures: 3,
      recoveryThreshold: 2,
    },
  },

  // Asset Preloading
  preloading: {
    // Critical assets to preload
    critical: [
      "/icons/icon-192x192.png",
      "/icons/icon-512x512.png",
      "/manifest.json",
    ],

    // Route-based preloading
    routes: {
      "/": [
        "/models/gesture-model.js", // MediaPipe model
        "/workers/audio-processor.js",
      ],
      "/mix": ["/workers/stem-processor.js", "/audio/effects-core.js"],
    },
  },
};

// Type exports
export type ProductionCdnConfig = typeof productionCdnConfig;
