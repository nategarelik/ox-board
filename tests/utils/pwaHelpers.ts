// PWA test helpers and utilities
import { jest } from "@jest/globals";

// Service Worker mocks
export const createMockServiceWorker = () => ({
  register: jest.fn(),
  unregister: jest.fn(),
  update: jest.fn(),
  showNotification: jest.fn(),
  getNotifications: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  postMessage: jest.fn(),
  scriptURL: "/sw.js",
  state: "activated",
});

export const createMockServiceWorkerRegistration = () => ({
  installing: null,
  waiting: null,
  active: createMockServiceWorker(),
  update: jest.fn(),
  unregister: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  showNotification: jest.fn(),
  getNotifications: jest.fn(),
});

export const createMockServiceWorkerContainer = () => ({
  register: jest.fn(),
  getRegistration: jest.fn(),
  getRegistrations: jest.fn(),
  ready: Promise.resolve(createMockServiceWorkerRegistration()),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  controller: createMockServiceWorker(),
});

// Cache API mocks
export const createMockCache = () => ({
  match: jest.fn(),
  matchAll: jest.fn(),
  add: jest.fn(),
  addAll: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  keys: jest.fn(),
});

export const createMockCacheStorage = () => ({
  open: jest.fn(),
  has: jest.fn(),
  keys: jest.fn(),
  match: jest.fn(),
  delete: jest.fn(),
});

// Notification API mocks
export const createMockNotification = (
  title: string = "Test Notification",
  options: any = {},
) => ({
  title,
  body: options.body || "Test notification body",
  icon: options.icon || "/icon.png",
  badge: options.badge || "/badge.png",
  tag: options.tag || "test-tag",
  data: options.data || {},
  requireInteraction: options.requireInteraction || false,
  silent: options.silent || false,
  timestamp: Date.now(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
});

export const createMockNotificationPermission = () => {
  let permission: NotificationPermission = "default";

  return {
    getPermission: () => permission,
    setPermission: (newPermission: NotificationPermission) => {
      permission = newPermission;
    },
    requestPermission: jest.fn(),
  };
};

// IndexedDB mocks
export const createMockIndexedDB = () => ({
  open: jest.fn(),
  deleteDatabase: jest.fn(),
  cmp: jest.fn(),
  databases: jest.fn(),
});

export const createMockIDBDatabase = () => ({
  name: "test-db",
  version: 1,
  objectStoreNames: ["test-store"],
  createObjectStore: jest.fn(),
  deleteObjectStore: jest.fn(),
  transaction: jest.fn(),
  close: jest.fn(),
});

export const createMockIDBTransaction = () => ({
  mode: "readwrite",
  db: createMockIDBDatabase(),
  error: null,
  onabort: null,
  oncomplete: null,
  onerror: null,
  objectStore: jest.fn(),
  commit: jest.fn(),
  abort: jest.fn(),
});

export const createMockIDBObjectStore = () => ({
  name: "test-store",
  keyPath: "id",
  autoIncrement: false,
  indexNames: [],
  transaction: createMockIDBTransaction(),
  add: jest.fn(),
  put: jest.fn(),
  get: jest.fn(),
  getAll: jest.fn(),
  getAllKeys: jest.fn(),
  getKey: jest.fn(),
  count: jest.fn(),
  delete: jest.fn(),
  clear: jest.fn(),
  openCursor: jest.fn(),
  openKeyCursor: jest.fn(),
  createIndex: jest.fn(),
  deleteIndex: jest.fn(),
  index: jest.fn(),
});

// Network status mocks
export const createMockNetworkStatus = () => {
  let isOnline = true;
  let connection: any = {
    effectiveType: "4g",
    rtt: 50,
    downlink: 10,
    saveData: false,
  };

  return {
    isOnline: () => isOnline,
    setOnline: (online: boolean) => {
      isOnline = online;
      window.dispatchEvent(new Event(online ? "online" : "offline"));
    },
    getConnection: () => connection,
    setConnection: (newConnection: any) => {
      connection = { ...connection, ...newConnection };
    },
  };
};

// Install prompt mocks
export const createMockBeforeInstallPromptEvent = () => {
  const platforms = ["web", "android", "windows"];
  const userChoice = { outcome: "accepted", platform: platforms[0] };

  return {
    platforms,
    userChoice: Promise.resolve(userChoice),
    prompt: jest.fn(),
    preventDefault: jest.fn(),
  };
};

// PWA installation mocks
export const createMockPWAInstallManager = () => {
  let installPrompt: any = null;
  let isInstalled = false;

  return {
    setInstallPrompt: (prompt: any) => {
      installPrompt = prompt;
    },
    getInstallPrompt: () => installPrompt,
    isInstalled: () => isInstalled,
    setInstalled: (installed: boolean) => {
      isInstalled = installed;
    },
    triggerInstall: async () => {
      if (installPrompt) {
        const result = await installPrompt.prompt();
        isInstalled = result.outcome === "accepted";
        return result;
      }
      throw new Error("No install prompt available");
    },
  };
};

// Background sync mocks
export const createMockBackgroundSync = () => ({
  register: jest.fn(),
  unregister: jest.fn(),
  getTags: jest.fn(),
});

// Push subscription mocks
export const createMockPushSubscription = () => ({
  endpoint: "https://fcm.googleapis.com/fcm/send/test-endpoint",
  keys: {
    p256dh: "test-p256dh-key",
    auth: "test-auth-key",
  },
  getKey: jest.fn(),
  toJSON: jest.fn(),
  unsubscribe: jest.fn(),
});

export const createMockPushManager = () => ({
  subscribe: jest.fn(),
  getSubscription: jest.fn(),
  permissionState: jest.fn(),
});

// Geolocation mocks (for location-based features)
export const createMockGeolocation = () => ({
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
});

export const createMockGeolocationPosition = () => ({
  coords: {
    latitude: 40.7128,
    longitude: -74.006,
    altitude: null,
    accuracy: 10,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
  },
  timestamp: Date.now(),
});

// Media capabilities mocks
export const createMockMediaCapabilities = () => ({
  decodingInfo: jest.fn(),
  encodingInfo: jest.fn(),
});

// Web app manifest mocks
export const createMockWebAppManifest = () => ({
  name: "OX Gesture Stem Player",
  short_name: "OX Player",
  description: "Advanced gesture-controlled stem player",
  start_url: "/",
  display: "standalone",
  background_color: "#000000",
  theme_color: "#1a1a1a",
  orientation: "any",
  categories: ["music", "entertainment"],
  icons: [
    {
      src: "/icon-192.png",
      sizes: "192x192",
      type: "image/png",
    },
    {
      src: "/icon-512.png",
      sizes: "512x512",
      type: "image/png",
    },
  ],
});

// PWA test scenarios
export const createPWATestScenarios = () => {
  return {
    // Offline scenario
    offline: {
      networkStatus: "offline",
      cacheStrategy: "networkFirst",
      fallbackContent: true,
      backgroundSync: true,
    },

    // Installation scenario
    installation: {
      installPrompt: true,
      userChoice: "accepted",
      manifestValid: true,
      serviceWorkerActive: true,
    },

    // Push notifications scenario
    pushNotifications: {
      permission: "granted",
      subscription: true,
      backgroundSync: true,
      notificationClick: true,
    },

    // Background sync scenario
    backgroundSync: {
      networkFailure: true,
      retryAttempts: 3,
      syncOnReconnection: true,
      dataPersisted: true,
    },

    // Storage scenario
    storage: {
      quotaExceeded: false,
      persistentStorage: true,
      indexedDBAvailable: true,
      cacheStorageAvailable: true,
    },
  };
};

// Performance monitoring helpers
export const createPWAPerformanceHelpers = () => {
  return {
    measureInstallTime: async (installFn: () => Promise<void>) => {
      const start = performance.now();
      await installFn();
      return performance.now() - start;
    },

    measureCacheOperation: async (cacheFn: () => Promise<void>) => {
      const start = performance.now();
      await cacheFn();
      return performance.now() - start;
    },

    measureNotificationTime: async (notificationFn: () => Promise<void>) => {
      const start = performance.now();
      await notificationFn();
      return performance.now() - start;
    },
  };
};

// Error simulation helpers
export const createPWAErrorHelpers = () => {
  return {
    simulateNetworkError: () => {
      const error = new Error("Network request failed");
      (error as any).name = "NetworkError";
      throw error;
    },

    simulateQuotaExceededError: () => {
      const error = new Error("Quota exceeded");
      (error as any).name = "QuotaExceededError";
      throw error;
    },

    simulateServiceWorkerError: () => {
      const error = new Error("Service Worker registration failed");
      (error as any).name = "ServiceWorkerError";
      throw error;
    },

    simulateInstallPromptError: () => {
      const error = new Error("Installation failed");
      (error as any).name = "InstallPromptError";
      throw error;
    },
  };
};

// Setup all PWA mocks
export const setupPWAMocks = () => {
  // Service Worker
  Object.defineProperty(navigator, "serviceWorker", {
    value: createMockServiceWorkerContainer(),
    configurable: true,
  });

  // Cache API
  Object.defineProperty(window, "caches", {
    value: createMockCacheStorage(),
    configurable: true,
  });

  // Notifications
  (global as any).Notification = jest.fn();
  (global as any).Notification.permission = "default";
  (global as any).Notification.requestPermission = jest.fn();

  // IndexedDB
  Object.defineProperty(window, "indexedDB", {
    value: createMockIndexedDB(),
    configurable: true,
  });

  // Network status
  Object.defineProperty(navigator, "onLine", {
    value: true,
    configurable: true,
  });

  // Install prompt
  Object.defineProperty(window, "beforeinstallprompt", {
    value: null,
    configurable: true,
  });

  // Push Manager
  Object.defineProperty(navigator, "pushManager", {
    value: createMockPushManager(),
    configurable: true,
  });

  // Geolocation
  Object.defineProperty(navigator, "geolocation", {
    value: createMockGeolocation(),
    configurable: true,
  });

  // Media Capabilities
  Object.defineProperty(navigator, "mediaCapabilities", {
    value: createMockMediaCapabilities(),
    configurable: true,
  });
};
