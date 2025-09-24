/**
 * Secure MediaPipe loader with Subresource Integrity (SRI) for enhanced security
 * This prevents supply chain attacks by verifying the integrity of external scripts
 */

interface MediaPipeConfig {
  locateFile: (file: string) => string;
}

interface HandsConfig extends MediaPipeConfig {
  modelComplexity?: 0 | 1;
  maxNumHands?: number;
  minDetectionConfidence?: number;
  minTrackingConfidence?: number;
}

// MediaPipe CDN URLs with version pinning for stability
const MEDIAPIPE_VERSION = "0.4.1675469619";
const CDN_BASE = `https://cdn.jsdelivr.net/npm/@mediapipe/hands@${MEDIAPIPE_VERSION}`;

// Subresource Integrity hashes for MediaPipe hands library
// These should be updated when upgrading MediaPipe version
// Generate new hashes using: https://www.srihash.org/
const MEDIAPIPE_SRI = {
  hands:
    "sha384-2zlkzk2XgLIB0UhrzUcJKV8pXpz+99F/MDlVNa0oXtKKqxYWXdCSsKqyxEUImc0v",
  camera_utils:
    "sha384-L0PvWJrWVLJuPOL9pPLUqvBGe9XMMqRvbfLbKPM3RkT3VEm8HeZfLA+I0KqvnNYx",
};

/**
 * Dynamically loads MediaPipe scripts with integrity verification
 */
export async function loadMediaPipeSecurely(): Promise<void> {
  // Check if already loaded
  if (typeof window !== "undefined" && (window as any).Hands) {
    return;
  }

  // Create script element with integrity check
  const script = document.createElement("script");
  script.src = `${CDN_BASE}/hands.js`;
  script.crossOrigin = "anonymous";

  // Add Subresource Integrity for security
  // Note: If CDN doesn't support CORS properly, this might fail
  // In production, consider self-hosting MediaPipe files
  script.integrity = MEDIAPIPE_SRI.hands;

  script.async = true;

  return new Promise((resolve, reject) => {
    script.onload = () => {
      console.log("MediaPipe Hands loaded securely");
      resolve();
    };

    script.onerror = (error) => {
      console.error("Failed to load MediaPipe:", error);
      reject(
        new Error(
          "MediaPipe loading failed. This might be due to network issues or integrity check failure.",
        ),
      );
    };

    document.head.appendChild(script);
  });
}

/**
 * Creates a new Hands instance with secure configuration
 */
export async function createSecureHandsInstance(config?: Partial<HandsConfig>) {
  // Ensure MediaPipe is loaded
  await loadMediaPipeSecurely();

  const Hands = (window as any).Hands;
  if (!Hands) {
    throw new Error("MediaPipe Hands not available after loading");
  }

  const hands = new Hands({
    locateFile: (file: string) => {
      // Use CDN for model files with version pinning
      return `${CDN_BASE}/${file}`;
    },
    ...config,
  });

  // Initialize with secure defaults
  hands.setOptions({
    modelComplexity: config?.modelComplexity ?? 1,
    maxNumHands: config?.maxNumHands ?? 2,
    minDetectionConfidence: config?.minDetectionConfidence ?? 0.5,
    minTrackingConfidence: config?.minTrackingConfidence ?? 0.5,
  });

  return hands;
}

/**
 * Alternative: Self-hosted MediaPipe for maximum security
 * Copy MediaPipe files to public/mediapipe/ directory and use this loader
 */
export async function loadMediaPipeSelfHosted(): Promise<void> {
  // Check if already loaded
  if (typeof window !== "undefined" && (window as any).Hands) {
    return;
  }

  const script = document.createElement("script");
  // Use self-hosted files from public directory
  script.src = "/mediapipe/hands.js";
  script.async = true;

  return new Promise((resolve, reject) => {
    script.onload = () => {
      console.log("MediaPipe Hands loaded from self-hosted source");
      resolve();
    };

    script.onerror = (error) => {
      console.error("Failed to load self-hosted MediaPipe:", error);
      reject(
        new Error(
          "MediaPipe loading failed. Ensure files are in public/mediapipe/",
        ),
      );
    };

    document.head.appendChild(script);
  });
}

/**
 * Creates Hands instance for self-hosted MediaPipe
 */
export async function createSelfHostedHandsInstance(
  config?: Partial<HandsConfig>,
) {
  await loadMediaPipeSelfHosted();

  const Hands = (window as any).Hands;
  if (!Hands) {
    throw new Error("MediaPipe Hands not available after loading");
  }

  const hands = new Hands({
    locateFile: (file: string) => {
      // Use self-hosted files
      return `/mediapipe/${file}`;
    },
    ...config,
  });

  // Initialize with secure defaults
  hands.setOptions({
    modelComplexity: config?.modelComplexity ?? 1,
    maxNumHands: config?.maxNumHands ?? 2,
    minDetectionConfidence: config?.minDetectionConfidence ?? 0.5,
    minTrackingConfidence: config?.minTrackingConfidence ?? 0.5,
  });

  return hands;
}

// Export configuration for use in environment variables
export const MEDIAPIPE_CONFIG = {
  USE_SELF_HOSTED: process.env.NEXT_PUBLIC_MEDIAPIPE_SELF_HOSTED === "true",
  CDN_BASE,
  VERSION: MEDIAPIPE_VERSION,
};

// Main export - automatically selects based on environment
export async function loadMediaPipe(config?: Partial<HandsConfig>) {
  if (MEDIAPIPE_CONFIG.USE_SELF_HOSTED) {
    return createSelfHostedHandsInstance(config);
  } else {
    return createSecureHandsInstance(config);
  }
}
