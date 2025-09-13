/**
 * Custom error types for gesture detection system
 */

export class GestureDetectionError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'GestureDetectionError';
  }
}

export class CameraError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'CameraError';
  }
}

export class MediaPipeError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'MediaPipeError';
  }
}

/**
 * Error codes for different failure scenarios
 */
export const ERROR_CODES = {
  // Camera errors
  CAMERA_NOT_SUPPORTED: 'CAMERA_NOT_SUPPORTED',
  CAMERA_PERMISSION_DENIED: 'CAMERA_PERMISSION_DENIED',
  CAMERA_NOT_FOUND: 'CAMERA_NOT_FOUND',
  CAMERA_IN_USE: 'CAMERA_IN_USE',
  CAMERA_CONSTRAINTS_ERROR: 'CAMERA_CONSTRAINTS_ERROR',
  CAMERA_UNKNOWN_ERROR: 'CAMERA_UNKNOWN_ERROR',

  // MediaPipe errors
  MEDIAPIPE_INIT_FAILED: 'MEDIAPIPE_INIT_FAILED',
  MEDIAPIPE_MODEL_LOAD_FAILED: 'MEDIAPIPE_MODEL_LOAD_FAILED',
  MEDIAPIPE_DETECTION_FAILED: 'MEDIAPIPE_DETECTION_FAILED',
  MEDIAPIPE_NOT_SUPPORTED: 'MEDIAPIPE_NOT_SUPPORTED',

  // General gesture detection errors
  DETECTOR_NOT_INITIALIZED: 'DETECTOR_NOT_INITIALIZED',
  INVALID_INPUT: 'INVALID_INPUT',
  PROCESSING_ERROR: 'PROCESSING_ERROR'
} as const;

/**
 * User-friendly error messages
 */
export const ERROR_MESSAGES = {
  [ERROR_CODES.CAMERA_NOT_SUPPORTED]: 'Camera is not supported on this device',
  [ERROR_CODES.CAMERA_PERMISSION_DENIED]: 'Camera permission is required for gesture detection',
  [ERROR_CODES.CAMERA_NOT_FOUND]: 'No camera device found',
  [ERROR_CODES.CAMERA_IN_USE]: 'Camera is already being used by another application',
  [ERROR_CODES.CAMERA_CONSTRAINTS_ERROR]: 'Camera settings are not supported by this device',
  [ERROR_CODES.CAMERA_UNKNOWN_ERROR]: 'An unknown camera error occurred',

  [ERROR_CODES.MEDIAPIPE_INIT_FAILED]: 'Failed to initialize gesture detection engine',
  [ERROR_CODES.MEDIAPIPE_MODEL_LOAD_FAILED]: 'Failed to load gesture detection model',
  [ERROR_CODES.MEDIAPIPE_DETECTION_FAILED]: 'Gesture detection processing failed',
  [ERROR_CODES.MEDIAPIPE_NOT_SUPPORTED]: 'Gesture detection is not supported on this device',

  [ERROR_CODES.DETECTOR_NOT_INITIALIZED]: 'Gesture detector must be initialized before use',
  [ERROR_CODES.INVALID_INPUT]: 'Invalid input provided to gesture detector',
  [ERROR_CODES.PROCESSING_ERROR]: 'Error processing gesture data'
} as const;

/**
 * Utility function to create standardized errors
 */
export function createCameraError(
  code: keyof typeof ERROR_CODES,
  customMessage?: string,
  cause?: Error
): CameraError {
  const message = customMessage || ERROR_MESSAGES[ERROR_CODES[code]];
  return new CameraError(message, ERROR_CODES[code], cause);
}

export function createMediaPipeError(
  code: keyof typeof ERROR_CODES,
  customMessage?: string,
  cause?: Error
): MediaPipeError {
  const message = customMessage || ERROR_MESSAGES[ERROR_CODES[code]];
  return new MediaPipeError(message, ERROR_CODES[code], cause);
}

export function createGestureDetectionError(
  code: keyof typeof ERROR_CODES,
  customMessage?: string,
  cause?: Error
): GestureDetectionError {
  const message = customMessage || ERROR_MESSAGES[ERROR_CODES[code]];
  return new GestureDetectionError(message, ERROR_CODES[code], cause);
}

/**
 * Parse native camera errors into our error types
 */
export function parseCameraError(error: any): CameraError {
  if (error instanceof CameraError) {
    return error;
  }

  if (error instanceof Error) {
    switch (error.name) {
      case 'NotSupportedError':
        return createCameraError('CAMERA_NOT_SUPPORTED', error.message, error);
      case 'NotAllowedError':
        return createCameraError('CAMERA_PERMISSION_DENIED', error.message, error);
      case 'NotFoundError':
        return createCameraError('CAMERA_NOT_FOUND', error.message, error);
      case 'NotReadableError':
        return createCameraError('CAMERA_IN_USE', error.message, error);
      case 'OverconstrainedError':
        return createCameraError('CAMERA_CONSTRAINTS_ERROR', error.message, error);
      default:
        return createCameraError('CAMERA_UNKNOWN_ERROR', error.message, error);
    }
  }

  return createCameraError('CAMERA_UNKNOWN_ERROR', 'An unknown error occurred');
}

/**
 * Error recovery strategies
 */
export interface ErrorRecoveryStrategy {
  canRecover: boolean;
  suggestedAction: string;
  autoRetry: boolean;
  retryDelay?: number;
}

export function getErrorRecoveryStrategy(error: Error): ErrorRecoveryStrategy {
  if (error instanceof CameraError) {
    switch (error.code) {
      case ERROR_CODES.CAMERA_PERMISSION_DENIED:
        return {
          canRecover: true,
          suggestedAction: 'Please allow camera permissions and try again',
          autoRetry: false
        };
      case ERROR_CODES.CAMERA_IN_USE:
        return {
          canRecover: true,
          suggestedAction: 'Close other applications using the camera',
          autoRetry: true,
          retryDelay: 3000
        };
      case ERROR_CODES.CAMERA_NOT_FOUND:
        return {
          canRecover: false,
          suggestedAction: 'Connect a camera device',
          autoRetry: false
        };
      case ERROR_CODES.CAMERA_CONSTRAINTS_ERROR:
        return {
          canRecover: true,
          suggestedAction: 'Try with different camera settings',
          autoRetry: true,
          retryDelay: 1000
        };
      default:
        return {
          canRecover: true,
          suggestedAction: 'Please try again',
          autoRetry: true,
          retryDelay: 2000
        };
    }
  }

  if (error instanceof MediaPipeError) {
    switch (error.code) {
      case ERROR_CODES.MEDIAPIPE_MODEL_LOAD_FAILED:
        return {
          canRecover: true,
          suggestedAction: 'Check your internet connection',
          autoRetry: true,
          retryDelay: 5000
        };
      case ERROR_CODES.MEDIAPIPE_NOT_SUPPORTED:
        return {
          canRecover: false,
          suggestedAction: 'This device does not support gesture detection',
          autoRetry: false
        };
      default:
        return {
          canRecover: true,
          suggestedAction: 'Please refresh the page',
          autoRetry: false
        };
    }
  }

  return {
    canRecover: true,
    suggestedAction: 'Please try again',
    autoRetry: false
  };
}

/**
 * Gesture detection system health check
 */
export interface SystemHealth {
  camera: {
    supported: boolean;
    permissionGranted: boolean;
    devicesAvailable: number;
  };
  mediaPipe: {
    supported: boolean;
    wasmSupported: boolean;
    sharedArrayBufferSupported: boolean;
  };
  overall: 'healthy' | 'degraded' | 'unavailable';
}

export async function checkSystemHealth(): Promise<SystemHealth> {
  const health: SystemHealth = {
    camera: {
      supported: false,
      permissionGranted: false,
      devicesAvailable: 0
    },
    mediaPipe: {
      supported: false,
      wasmSupported: false,
      sharedArrayBufferSupported: false
    },
    overall: 'unavailable'
  };

  // Check camera support
  try {
    health.camera.supported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

    if (health.camera.supported) {
      // Check for available devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      health.camera.devicesAvailable = devices.filter(d => d.kind === 'videoinput').length;

      // Check permissions (if possible)
      if (navigator.permissions) {
        try {
          const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
          health.camera.permissionGranted = permission.state === 'granted';
        } catch {
          // Permission query not supported
        }
      }
    }
  } catch (error) {
    console.warn('Camera health check failed:', error);
  }

  // Check MediaPipe support
  try {
    health.mediaPipe.wasmSupported = typeof WebAssembly !== 'undefined';
    health.mediaPipe.sharedArrayBufferSupported = typeof SharedArrayBuffer !== 'undefined';
    health.mediaPipe.supported = health.mediaPipe.wasmSupported && health.mediaPipe.sharedArrayBufferSupported;
  } catch (error) {
    console.warn('MediaPipe health check failed:', error);
  }

  // Determine overall health
  if (health.camera.supported && health.mediaPipe.supported) {
    health.overall = health.camera.devicesAvailable > 0 ? 'healthy' : 'degraded';
  } else if (health.camera.supported || health.mediaPipe.supported) {
    health.overall = 'degraded';
  } else {
    health.overall = 'unavailable';
  }

  return health;
}