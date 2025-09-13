import { useCallback, useEffect, useRef, useState } from 'react';

export interface CameraConfig {
  width?: number;
  height?: number;
  fps?: number;
  facingMode?: 'user' | 'environment';
  deviceId?: string;
}

export interface CameraState {
  isLoading: boolean;
  isActive: boolean;
  error: string | null;
  permissionState: 'pending' | 'granted' | 'denied' | 'unsupported';
  stream: MediaStream | null;
  deviceInfo: {
    deviceId: string;
    label: string;
  } | null;
  resolution: {
    width: number;
    height: number;
  } | null;
  actualFps: number | null;
}

export interface CameraControls {
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  switchCamera: () => Promise<void>;
  updateConfig: (newConfig: Partial<CameraConfig>) => Promise<void>;
  getAvailableDevices: () => Promise<MediaDeviceInfo[]>;
}

const DEFAULT_CONFIG: Required<CameraConfig> = {
  width: 1280,
  height: 720,
  fps: 30,
  facingMode: 'user',
  deviceId: ''
};

export function useCamera(initialConfig: CameraConfig = {}): [CameraState, CameraControls] {
  const [config, setConfig] = useState<Required<CameraConfig>>({
    ...DEFAULT_CONFIG,
    ...initialConfig
  });

  const [state, setState] = useState<CameraState>({
    isLoading: false,
    isActive: false,
    error: null,
    permissionState: 'pending',
    stream: null,
    deviceInfo: null,
    resolution: null,
    actualFps: null
  });

  const streamRef = useRef<MediaStream | null>(null);
  const frameCountRef = useRef(0);
  const fpsIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Check if camera API is supported
   */
  const isSupported = useCallback(() => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }, []);

  /**
   * Request camera permissions
   */
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    if (!isSupported()) {
      setState(prev => ({ ...prev, permissionState: 'unsupported' }));
      return false;
    }

    try {
      // Check existing permissions
      if (navigator.permissions) {
        const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });

        if (permission.state === 'granted') {
          setState(prev => ({ ...prev, permissionState: 'granted' }));
          return true;
        } else if (permission.state === 'denied') {
          setState(prev => ({ ...prev, permissionState: 'denied' }));
          return false;
        }
      }

      // Request temporary stream to check permissions
      const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
      tempStream.getTracks().forEach(track => track.stop());

      setState(prev => ({ ...prev, permissionState: 'granted' }));
      return true;
    } catch (error) {
      console.error('Permission request failed:', error);
      setState(prev => ({
        ...prev,
        permissionState: 'denied',
        error: 'Camera permission denied'
      }));
      return false;
    }
  }, [isSupported]);

  /**
   * Get available camera devices
   */
  const getAvailableDevices = useCallback(async (): Promise<MediaDeviceInfo[]> => {
    if (!isSupported()) {
      return [];
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(device => device.kind === 'videoinput');
    } catch (error) {
      console.error('Failed to enumerate devices:', error);
      return [];
    }
  }, [isSupported]);

  /**
   * Create media constraints from config
   */
  const createConstraints = useCallback((config: Required<CameraConfig>): MediaStreamConstraints => {
    const videoConstraints: MediaTrackConstraints = {
      width: { ideal: config.width },
      height: { ideal: config.height },
      frameRate: { ideal: config.fps }
    };

    if (config.deviceId) {
      videoConstraints.deviceId = { exact: config.deviceId };
    } else {
      videoConstraints.facingMode = { ideal: config.facingMode };
    }

    return {
      video: videoConstraints,
      audio: false
    };
  }, []);

  /**
   * Start FPS monitoring
   */
  const startFpsMonitoring = useCallback((videoElement: HTMLVideoElement) => {
    frameCountRef.current = 0;

    const updateFps = () => {
      setState(prev => ({ ...prev, actualFps: frameCountRef.current }));
      frameCountRef.current = 0;
    };

    const countFrame = () => {
      frameCountRef.current++;
      requestAnimationFrame(countFrame);
    };

    fpsIntervalRef.current = setInterval(updateFps, 1000);
    requestAnimationFrame(countFrame);
  }, []);

  /**
   * Stop FPS monitoring
   */
  const stopFpsMonitoring = useCallback(() => {
    if (fpsIntervalRef.current) {
      clearInterval(fpsIntervalRef.current);
      fpsIntervalRef.current = null;
    }
    frameCountRef.current = 0;
  }, []);

  /**
   * Start camera with current configuration
   */
  const startCamera = useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Check permissions first
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        throw new Error('Camera permission required');
      }

      // Stop existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      // Create new stream
      const constraints = createConstraints(config);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      streamRef.current = stream;

      // Get actual stream settings
      const videoTrack = stream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();

      // Get device info
      const devices = await getAvailableDevices();
      const currentDevice = devices.find(device =>
        device.deviceId === settings.deviceId
      );

      setState(prev => ({
        ...prev,
        isLoading: false,
        isActive: true,
        stream,
        error: null,
        deviceInfo: currentDevice ? {
          deviceId: currentDevice.deviceId,
          label: currentDevice.label || 'Unknown Camera'
        } : null,
        resolution: {
          width: settings.width || config.width,
          height: settings.height || config.height
        }
      }));

    } catch (error) {
      console.error('Failed to start camera:', error);

      let errorMessage = 'Failed to access camera';
      if (error instanceof Error) {
        if (error.name === 'NotFoundError') {
          errorMessage = 'No camera device found';
        } else if (error.name === 'NotAllowedError') {
          errorMessage = 'Camera permission denied';
        } else if (error.name === 'NotReadableError') {
          errorMessage = 'Camera is already in use';
        } else if (error.name === 'OverconstrainedError') {
          errorMessage = 'Camera settings not supported';
        } else {
          errorMessage = error.message;
        }
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        isActive: false,
        error: errorMessage,
        stream: null,
        deviceInfo: null,
        resolution: null,
        actualFps: null
      }));
    }
  }, [config, requestPermissions, createConstraints, getAvailableDevices]);

  /**
   * Stop camera
   */
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    stopFpsMonitoring();

    setState(prev => ({
      ...prev,
      isActive: false,
      stream: null,
      deviceInfo: null,
      resolution: null,
      actualFps: null
    }));
  }, [stopFpsMonitoring]);

  /**
   * Switch to next available camera
   */
  const switchCamera = useCallback(async (): Promise<void> => {
    try {
      const devices = await getAvailableDevices();
      if (devices.length < 2) {
        throw new Error('No other camera available');
      }

      const currentDeviceId = state.deviceInfo?.deviceId;
      const currentIndex = devices.findIndex(device => device.deviceId === currentDeviceId);
      const nextIndex = (currentIndex + 1) % devices.length;
      const nextDevice = devices[nextIndex];

      await updateConfig({ deviceId: nextDevice.deviceId });
    } catch (error) {
      console.error('Failed to switch camera:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to switch camera'
      }));
    }
  }, [state.deviceInfo?.deviceId, getAvailableDevices]);

  /**
   * Update camera configuration and restart if active
   */
  const updateConfig = useCallback(async (newConfig: Partial<CameraConfig>): Promise<void> => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);

    // Restart camera if it's currently active
    if (state.isActive) {
      await startCamera();
    }
  }, [config, state.isActive, startCamera]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  /**
   * Monitor permission state changes
   */
  useEffect(() => {
    if (!navigator.permissions) return;

    const handlePermissionChange = async () => {
      try {
        const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });

        permission.addEventListener('change', () => {
          setState(prev => ({ ...prev, permissionState: permission.state as any }));

          if (permission.state === 'denied' && state.isActive) {
            stopCamera();
          }
        });
      } catch (error) {
        // Permission API not supported or camera permission not queryable
        console.warn('Permission monitoring not supported');
      }
    };

    handlePermissionChange();
  }, [state.isActive, stopCamera]);

  const controls: CameraControls = {
    startCamera,
    stopCamera,
    switchCamera,
    updateConfig,
    getAvailableDevices
  };

  return [state, controls];
}