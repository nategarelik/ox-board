/**
 * Production Application Configuration
 * OX Gesture Stem Player - Launch Configuration
 */

export const productionConfig = {
  // Application Info
  app: {
    name: "OX Gesture Stem Player",
    version: "1.0.0",
    shortName: "OX Player",
    description: "Professional gesture-controlled stem mixing platform",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://ox-player.app",
  },

  // Environment
  environment: "production" as const,
  isProduction: true,

  // Audio Configuration
  audio: {
    // Web Audio API optimizations
    latencyHint: "interactive" as AudioContextLatencyCategory,
    sampleRate: 44100,

    // Stem processing
    maxConcurrentStems: 8,
    bufferSize: 2048,

    // Performance settings
    enableAdvancedProcessing: true,
    enableWebWorkers: true,
  },

  // Gesture Recognition
  gesture: {
    // MediaPipe configuration
    mediaPipeVersion: "0.4.1675469619",
    modelComplexity: 1, // 0, 1, or 2

    // Performance settings
    targetFps: 30,
    smoothingFrames: 5,
    confidenceThreshold: 0.8,

    // Feature flags
    enableAdvancedGestures: true,
    enableGesturePrediction: true,
  },

  // Performance Monitoring
  performance: {
    // Core Web Vitals tracking
    enableWebVitals: true,

    // Performance budgets
    budgets: {
      lighthouse: {
        performance: 95,
        accessibility: 100,
        "best-practices": 95,
        seo: 100,
      },
      bundleSize: {
        maxSize: "500KB", // Max total bundle size
        maxChunkSize: "100KB", // Max individual chunk size
      },
      loadTime: {
        firstContentfulPaint: 1800, // ms
        largestContentfulPaint: 2500, // ms
        firstInputDelay: 100, // ms
        cumulativeLayoutShift: 0.1,
      },
    },

    // Monitoring
    enablePerformanceObserver: true,
    enableResourceTiming: true,
  },

  // Security
  security: {
    // Content Security Policy
    cspEnabled: true,
    cspReportOnly: false,

    // Headers
    enableHSTS: true,
    enableSecurityHeaders: true,

    // CORS
    allowCredentials: false,
    maxAge: 31536000, // 1 year
  },

  // Analytics & Monitoring
  analytics: {
    googleAnalyticsId: process.env.GOOGLE_ANALYTICS_ID,
    sentryDsn: process.env.SENTRY_DSN,
    enableErrorTracking: true,
    enablePerformanceTracking: true,
  },

  // PWA Configuration
  pwa: {
    // Installation
    installPromptEnabled: true,
    autoInstall: false,

    // Updates
    updateStrategy: "background-sync" as const,
    enableBackgroundSync: true,

    // Offline
    enableOfflineMode: true,
    cacheStrategy: "network-first" as const,
  },

  // Feature Flags
  features: {
    // Core features
    enableStemPlayer: true,
    enableDJMode: true,
    enableGestureControl: true,

    // Advanced features
    enableAIAnalysis: true,
    enableCloudSync: true,
    enableSocialFeatures: false, // Post-launch

    // Experimental features
    enableAdvancedEffects: true,
    enableMultiDeviceSync: false, // Post-launch
    enableLiveStreaming: false, // Post-launch
  },

  // API Configuration
  api: {
    // Rate limiting
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100,
    },

    // Timeouts
    timeouts: {
      request: 30000, // 30 seconds
      upload: 300000, // 5 minutes
    },

    // Retries
    retries: {
      maxAttempts: 3,
      backoffMultiplier: 2,
    },
  },

  // Logging
  logging: {
    level: "error", // 'debug', 'info', 'warn', 'error'
    enableConsoleLogging: false,
    enableRemoteLogging: true,
    enablePerformanceLogging: true,
  },

  // Development/Debug (should be disabled in production)
  debug: {
    enableDebugPanel: false,
    enableDevTools: false,
    showPerformanceMetrics: false,
  },
};

// Type exports for use in other files
export type ProductionConfig = typeof productionConfig;
