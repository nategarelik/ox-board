/**
 * Lighthouse CI Configuration
 * OX Gesture Stem Player - Performance Validation
 */

module.exports = {
  ci: {
    // Collect performance metrics
    collect: {
      // URLs to test
      url: [
        "http://localhost:3000/",
        "http://localhost:3000/mix",
        "http://localhost:3000/stems",
        "http://localhost:3000/gestures",
      ],

      // Number of runs per URL
      numberOfRuns: 3,

      // Chrome flags for consistent testing
      chrome: {
        flags: {
          "--headless": true,
          "--no-sandbox": true,
          "--disable-gpu": true,
          "--disable-dev-shm-usage": true,
          "--disable-extensions": true,
          "--disable-plugins": true,
          "--disable-images": false,
          "--disable-javascript": false,
          "--disable-web-security": false,
        },
      },

      // Custom settings
      settings: {
        // Desktop configuration
        desktop: {
          formFactor: "desktop",
          screenEmulation: {
            mobile: false,
            width: 1920,
            height: 1080,
            deviceScaleFactor: 1,
            disabled: false,
          },
        },

        // Mobile configuration
        mobile: {
          formFactor: "mobile",
          screenEmulation: {
            mobile: true,
            width: 375,
            height: 667,
            deviceScaleFactor: 2,
            disabled: false,
          },
        },

        // Performance settings
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
          requestLatencyMs: 0,
          downloadThroughputKbps: 0,
          uploadThroughputKbps: 0,
        },

        // Disable storage reset between runs
        disableStorageReset: false,

        // Custom audit settings
        onlyAudits: [
          "first-contentful-paint",
          "largest-contentful-paint",
          "first-input-delay",
          "cumulative-layout-shift",
          "total-blocking-time",
          "speed-index",
          "interactive",
          "max-potential-fid",
        ],
      },
    },

    // Assert performance budgets
    assert: {
      // Assertions for all URLs
      assertions: {
        // Core Web Vitals
        "categories:performance": ["error", { minScore: 0.95 }],
        "categories:accessibility": ["error", { minScore: 1.0 }],
        "categories:best-practices": ["error", { minScore: 0.95 }],
        "categories:seo": ["error", { minScore: 1.0 }],

        // Specific metrics
        "first-contentful-paint": ["error", { maxNumericValue: 1800 }],
        "largest-contentful-paint": ["error", { maxNumericValue: 2500 }],
        "first-input-delay": ["error", { maxNumericValue: 100 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],
        "total-blocking-time": ["error", { maxNumericValue: 300 }],

        // Bundle size budgets
        "resource-summary:script:count": ["error", { maxNumericValue: 20 }],
        "resource-summary:script:size": ["error", { maxNumericValue: 512000 }], // 512KB
        "resource-summary:stylesheet:size": [
          "error",
          { maxNumericValue: 102400 },
        ], // 100KB
        "resource-summary:image:size": ["error", { maxNumericValue: 1048576 }], // 1MB

        // PWA requirements
        "installable-manifest": "error",
        "service-worker": "error",
        "splash-screen": "error",
        "themed-omnibox": "error",
        viewport: "error",
        "apple-touch-icon": "error",
      },
    },

    // Upload results
    upload: {
      // Upload to temporary public storage
      target: "temporary-public-storage",

      // GitHub integration (optional)
      github: {
        token: process.env.LHCI_GITHUB_TOKEN,
        repository: "your-org/ox-board",
      },
    },

    // Server configuration
    server: {
      port: 9001,
    },

    // Custom audits
    audits: [
      {
        path: "audits/gesture-performance",
        name: "gesture-performance",
      },
      {
        path: "audits/audio-performance",
        name: "audio-performance",
      },
    ],
  },
};
