/**
 * Production API Configuration
 * OX Gesture Stem Player - API Endpoints & Configuration
 */

export const productionApiConfig = {
  // Base URLs
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "https://api.ox-player.app",
  webSocketUrl:
    process.env.NEXT_PUBLIC_WEBSOCKET_URL || "wss://api.ox-player.app",

  // API Versioning
  version: "v1",
  timeout: 30000, // 30 seconds

  // Endpoints
  endpoints: {
    // Authentication
    auth: {
      login: "/auth/login",
      logout: "/auth/logout",
      refresh: "/auth/refresh",
      profile: "/auth/profile",
    },

    // Stem Management
    stems: {
      upload: "/stems/upload",
      download: "/stems/download",
      process: "/stems/process",
      analyze: "/stems/analyze",
      list: "/stems",
      delete: "/stems",
    },

    // Audio Processing
    audio: {
      mix: "/audio/mix",
      effects: "/audio/effects",
      analyze: "/audio/analyze",
      export: "/audio/export",
    },

    // User Data
    user: {
      tracks: "/user/tracks",
      playlists: "/user/playlists",
      settings: "/user/settings",
      preferences: "/user/preferences",
    },

    // Analytics
    analytics: {
      events: "/analytics/events",
      performance: "/analytics/performance",
      usage: "/analytics/usage",
    },

    // Social Features (Future)
    social: {
      share: "/social/share",
      collaborate: "/social/collaborate",
      discover: "/social/discover",
    },
  },

  // Request Configuration
  request: {
    // Default headers
    headers: {
      "Content-Type": "application/json",
      "X-Client-Version": "1.0.0",
      "X-Platform": "pwa",
    },

    // File upload settings
    upload: {
      maxFileSize: 100 * 1024 * 1024, // 100MB
      allowedTypes: [
        "audio/wav",
        "audio/mpeg",
        "audio/mp3",
        "audio/aac",
        "audio/ogg",
        "audio/flac",
      ],
      chunkSize: 5 * 1024 * 1024, // 5MB chunks
    },

    // Rate limiting
    rateLimit: {
      requestsPerMinute: 60,
      burstLimit: 10,
    },
  },

  // Response Configuration
  response: {
    // Cache settings
    cache: {
      defaultTTL: 300, // 5 minutes
      maxTTL: 3600, // 1 hour
      strategies: {
        static: "cache-first",
        dynamic: "network-first",
        realtime: "network-only",
      },
    },

    // Error handling
    retry: {
      maxAttempts: 3,
      backoffMultiplier: 2,
      retryableStatusCodes: [408, 429, 500, 502, 503, 504],
    },
  },

  // WebSocket Configuration
  websocket: {
    // Connection settings
    reconnectInterval: 5000, // 5 seconds
    maxReconnectAttempts: 10,
    heartbeatInterval: 30000, // 30 seconds

    // Events
    events: {
      // Connection events
      connect: "connect",
      disconnect: "disconnect",
      error: "error",

      // Audio events
      audioState: "audio:state",
      audioUpdate: "audio:update",
      audioError: "audio:error",

      // Gesture events
      gestureDetected: "gesture:detected",
      gestureUpdate: "gesture:update",

      // User events
      userActivity: "user:activity",
      userPreference: "user:preference",

      // System events
      performanceMetric: "performance:metric",
      errorReport: "error:report",
    },
  },

  // External Services
  external: {
    // CDN Configuration
    cdn: {
      baseUrl: process.env.CDN_URL || "https://cdn.ox-player.app",
      imageOptimization: true,
      videoOptimization: false,
    },

    // Third-party integrations
    integrations: {
      // Google Analytics
      googleAnalytics: {
        trackingId: process.env.GOOGLE_ANALYTICS_ID,
        enableEcommerce: false,
        enableCustomEvents: true,
      },

      // Sentry Error Tracking
      sentry: {
        dsn: process.env.SENTRY_DSN,
        environment: "production",
        release: "1.0.0",
        enablePerformanceMonitoring: true,
        sampleRate: 0.1, // 10% of transactions
      },

      // Audio Analysis Service
      audioAnalysis: {
        endpoint: process.env.AUDIO_ANALYSIS_ENDPOINT,
        apiKey: process.env.AUDIO_ANALYSIS_API_KEY,
        timeout: 60000, // 1 minute for audio analysis
      },
    },
  },

  // Development/Debug endpoints (should be disabled in production)
  debug: {
    enableDebugEndpoints: false,
    debugEndpoint: "/debug",
    metricsEndpoint: "/metrics",
  },
};

// Type exports
export type ProductionApiConfig = typeof productionApiConfig;
