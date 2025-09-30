/**
 * Enhanced Permission Manager for OX Board AI Enhancement
 *
 * Centralized permission management with progressive permission requests,
 * permission status monitoring, and user-friendly permission UI components.
 */

export interface PermissionConfig {
  camera?: boolean;
  microphone?: boolean;
  notifications?: boolean;
  geolocation?: boolean;
  persistentStorage?: boolean;
  backgroundSync?: boolean;
  wakeLock?: boolean;
}

export interface PermissionState {
  name: PermissionName;
  state: PermissionStatus["state"];
  granted: boolean;
  denied: boolean;
  prompt: boolean;
  lastChecked: number;
  requestCount: number;
  error?: string;
}

export interface PermissionRequest {
  permissions: PermissionName[];
  rationale: string;
  onGranted?: (permissions: PermissionName[]) => void;
  onDenied?: (permissions: PermissionName[]) => void;
  onError?: (error: Error) => void;
}

export interface PermissionUIConfig {
  showDialog: boolean;
  dialogTitle: string;
  dialogMessage: string;
  allowButtonText: string;
  denyButtonText: string;
  neverShowAgain: boolean;
}

class PermissionMonitor {
  private observers = new Map<PermissionName, PermissionStatus>();
  private callbacks = new Map<
    PermissionName,
    Set<(state: PermissionState) => void>
  >();
  private states = new Map<PermissionName, PermissionState>();

  async startMonitoring(permission: PermissionName): Promise<void> {
    if (!("permissions" in navigator)) {
      console.warn("Permissions API not supported");
      return;
    }

    try {
      const permissionStatus = await navigator.permissions.query({
        name: permission,
      });
      this.observers.set(permission, permissionStatus);

      // Initial state
      const state = this.createPermissionState(
        permission,
        permissionStatus.state,
      );
      this.states.set(permission, state);

      // Listen for changes
      permissionStatus.addEventListener("change", () => {
        const newState = this.createPermissionState(
          permission,
          permissionStatus.state,
        );
        this.states.set(permission, newState);
        this.notifyCallbacks(permission, newState);
      });

      // Set up periodic refresh
      setInterval(() => {
        this.refreshPermissionState(permission);
      }, 30000); // Check every 30 seconds
    } catch (error) {
      console.warn(`Failed to monitor permission ${permission}:`, error);
    }
  }

  private createPermissionState(
    name: PermissionName,
    state: PermissionStatus["state"],
  ): PermissionState {
    const existing = this.states.get(name);
    return {
      name,
      state,
      granted: state === "granted",
      denied: state === "denied",
      prompt: state === "prompt",
      lastChecked: Date.now(),
      requestCount: existing?.requestCount || 0,
      error: existing?.error,
    };
  }

  async refreshPermissionState(permission: PermissionName): Promise<void> {
    try {
      const permissionStatus = await navigator.permissions.query({
        name: permission,
      });
      const newState = this.createPermissionState(
        permission,
        permissionStatus.state,
      );

      if (this.states.get(permission)?.state !== newState.state) {
        this.states.set(permission, newState);
        this.notifyCallbacks(permission, newState);
      }
    } catch (error) {
      console.warn(`Failed to refresh permission ${permission}:`, error);
    }
  }

  private notifyCallbacks(
    permission: PermissionName,
    state: PermissionState,
  ): void {
    const callbacks = this.callbacks.get(permission);
    if (callbacks) {
      callbacks.forEach((callback) => callback(state));
    }
  }

  onPermissionChange(
    permission: PermissionName,
    callback: (state: PermissionState) => void,
  ): () => void {
    if (!this.callbacks.has(permission)) {
      this.callbacks.set(permission, new Set());
      this.startMonitoring(permission);
    }

    this.callbacks.get(permission)!.add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.callbacks.get(permission);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.callbacks.delete(permission);
        }
      }
    };
  }

  getPermissionState(permission: PermissionName): PermissionState | null {
    return this.states.get(permission) || null;
  }

  getAllPermissionStates(): Map<PermissionName, PermissionState> {
    return new Map(this.states);
  }
}

class ProgressivePermissionRequester {
  private monitor: PermissionMonitor;
  private config: PermissionUIConfig;

  constructor(monitor: PermissionMonitor, config: PermissionUIConfig) {
    this.monitor = monitor;
    this.config = config;
  }

  async requestPermission(
    request: PermissionRequest,
  ): Promise<PermissionName[]> {
    const granted: PermissionName[] = [];
    const denied: PermissionName[] = [];

    for (const permission of request.permissions) {
      try {
        // Check current state
        const currentState = this.monitor.getPermissionState(permission);

        if (currentState?.granted) {
          granted.push(permission);
          continue;
        }

        if (currentState?.denied && currentState.requestCount > 2) {
          // Don't ask again if repeatedly denied
          denied.push(permission);
          continue;
        }

        // Show rationale if configured
        if (this.config.showDialog) {
          const userConsent = await this.showPermissionDialog(
            request.rationale,
            permission,
          );
          if (!userConsent) {
            denied.push(permission);
            continue;
          }
        }

        // Request permission
        const result = await this.requestBrowserPermission(permission);

        if (result) {
          granted.push(permission);
        } else {
          denied.push(permission);
        }
      } catch (error) {
        console.error(`Failed to request permission ${permission}:`, error);
        denied.push(permission);

        if (request.onError) {
          request.onError(error as Error);
        }
      }
    }

    // Notify callbacks
    if (granted.length > 0 && request.onGranted) {
      request.onGranted(granted);
    }

    if (denied.length > 0 && request.onDenied) {
      request.onDenied(denied);
    }

    return granted;
  }

  private async requestBrowserPermission(
    permission: PermissionName,
  ): Promise<boolean> {
    try {
      switch (permission) {
        case "camera":
        case "microphone":
          // These are handled by getUserMedia
          return this.requestMediaPermission(permission);

        case "notifications":
          return this.requestNotificationPermission();

        case "geolocation":
          return this.requestGeolocationPermission();

        case "persistent-storage":
          return await this.requestPersistentStoragePermission();

        default:
          console.warn(`Unsupported permission: ${permission}`);
          return false;
      }
    } catch (error) {
      console.error(`Permission request failed for ${permission}:`, error);
      return false;
    }
  }

  private async requestMediaPermission(
    permission: "camera" | "microphone",
  ): Promise<boolean> {
    try {
      const constraints: MediaStreamConstraints = {};

      if (permission === "camera") {
        constraints.video = { width: 640, height: 480 };
      }

      if (permission === "microphone") {
        constraints.audio = true;
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Clean up the test stream
      stream.getTracks().forEach((track) => track.stop());

      return true;
    } catch (error: any) {
      if (error.name === "NotAllowedError") {
        return false;
      }
      throw error;
    }
  }

  private async requestNotificationPermission(): Promise<boolean> {
    if (!("Notification" in window)) {
      console.warn("Notifications not supported");
      return false;
    }

    if (Notification.permission === "granted") {
      return true;
    }

    if (Notification.permission === "denied") {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  private async requestGeolocationPermission(): Promise<boolean> {
    return new Promise((resolve) => {
      if (!("geolocation" in navigator)) {
        console.warn("Geolocation not supported");
        resolve(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        () => resolve(true),
        () => resolve(false),
        { timeout: 5000 },
      );
    });
  }

  private async requestPersistentStoragePermission(): Promise<boolean> {
    if ("storage" in navigator && "persist" in navigator.storage) {
      try {
        return await navigator.storage.persist();
      } catch (error) {
        console.warn("Persistent storage permission failed:", error);
      }
    }
    return false;
  }

  private async showPermissionDialog(
    rationale: string,
    permission: PermissionName,
  ): Promise<boolean> {
    return new Promise((resolve) => {
      // In a real implementation, this would show a custom dialog
      // For now, we'll use the browser's native permission prompt
      const userConsent = confirm(
        `${rationale}\n\nAllow ${permission} access?`,
      );
      resolve(userConsent);
    });
  }
}

class PermissionUIManager {
  private config: PermissionUIConfig;
  private dialogs = new Set<HTMLElement>();

  constructor(config: PermissionUIConfig) {
    this.config = config;
  }

  createPermissionDialog(
    title: string,
    message: string,
    onAllow: () => void,
    onDeny: () => void,
  ): HTMLElement {
    // Create dialog element
    const dialog = document.createElement("div");
    dialog.className = "permission-dialog-overlay";

    dialog.innerHTML = `
      <div class="permission-dialog">
        <h3>${title}</h3>
        <p>${message}</p>
        <div class="permission-dialog-buttons">
          <button class="permission-allow-btn">${this.config.allowButtonText}</button>
          <button class="permission-deny-btn">${this.config.denyButtonText}</button>
        </div>
        ${
          this.config.neverShowAgain
            ? `
          <label class="permission-never-show">
            <input type="checkbox" id="neverShowAgain">
            Don't ask again
          </label>
        `
            : ""
        }
      </div>
    `;

    // Add event listeners
    const allowBtn = dialog.querySelector(
      ".permission-allow-btn",
    ) as HTMLButtonElement;
    const denyBtn = dialog.querySelector(
      ".permission-deny-btn",
    ) as HTMLButtonElement;

    allowBtn.addEventListener("click", () => {
      onAllow();
      this.removeDialog(dialog);
    });

    denyBtn.addEventListener("click", () => {
      onDeny();
      this.removeDialog(dialog);
    });

    // Add styles
    this.addDialogStyles();

    return dialog;
  }

  showDialog(
    title: string,
    message: string,
    onAllow: () => void,
    onDeny: () => void,
  ): void {
    const dialog = this.createPermissionDialog(title, message, onAllow, onDeny);
    document.body.appendChild(dialog);
    this.dialogs.add(dialog);
  }

  private removeDialog(dialog: HTMLElement): void {
    if (dialog.parentNode) {
      dialog.parentNode.removeChild(dialog);
    }
    this.dialogs.delete(dialog);
  }

  removeAllDialogs(): void {
    this.dialogs.forEach((dialog) => this.removeDialog(dialog));
  }

  private addDialogStyles(): void {
    if (document.getElementById("permission-dialog-styles")) return;

    const style = document.createElement("style");
    style.id = "permission-dialog-styles";
    style.textContent = `
      .permission-dialog-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
      }

      .permission-dialog {
        background: white;
        padding: 24px;
        border-radius: 8px;
        max-width: 400px;
        width: 90%;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      }

      .permission-dialog h3 {
        margin: 0 0 16px 0;
        color: #333;
      }

      .permission-dialog p {
        margin: 0 0 24px 0;
        color: #666;
        line-height: 1.5;
      }

      .permission-dialog-buttons {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
      }

      .permission-allow-btn {
        background: #007bff;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
      }

      .permission-deny-btn {
        background: #6c757d;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
      }

      .permission-never-show {
        display: flex;
        align-items: center;
        margin-top: 16px;
        font-size: 14px;
        color: #666;
      }

      .permission-never-show input {
        margin-right: 8px;
      }
    `;

    document.head.appendChild(style);
  }
}

export class PermissionManager {
  private monitor: PermissionMonitor;
  private requester: ProgressivePermissionRequester;
  private uiManager: PermissionUIManager;
  private config: PermissionUIConfig;
  private isInitialized = false;

  constructor(uiConfig?: Partial<PermissionUIConfig>) {
    this.config = {
      showDialog: true,
      dialogTitle: "Permission Required",
      dialogMessage:
        "This app needs access to the following permissions to function properly:",
      allowButtonText: "Allow",
      denyButtonText: "Deny",
      neverShowAgain: false,
      ...uiConfig,
    };

    this.monitor = new PermissionMonitor();
    this.uiManager = new PermissionUIManager(this.config);
    this.requester = new ProgressivePermissionRequester(
      this.monitor,
      this.config,
    );
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Initialize common permissions
    const commonPermissions: PermissionName[] = [
      "camera",
      "microphone",
      "notifications",
    ];

    for (const permission of commonPermissions) {
      try {
        await this.monitor.startMonitoring(permission);
      } catch (error) {
        console.warn(
          `Failed to initialize monitoring for ${permission}:`,
          error,
        );
      }
    }

    this.isInitialized = true;
    console.log("Permission manager initialized");
  }

  // Permission state queries
  getPermissionState(permission: PermissionName): PermissionState | null {
    return this.monitor.getPermissionState(permission);
  }

  getAllPermissionStates(): Map<PermissionName, PermissionState> {
    return this.monitor.getAllPermissionStates();
  }

  // Permission change subscriptions
  onPermissionChange(
    permission: PermissionName,
    callback: (state: PermissionState) => void,
  ): () => void {
    return this.monitor.onPermissionChange(permission, callback);
  }

  // Progressive permission requests
  async requestPermissions(
    request: PermissionRequest,
  ): Promise<PermissionName[]> {
    await this.initialize();
    return this.requester.requestPermission(request);
  }

  async requestCameraPermission(): Promise<boolean> {
    const granted = await this.requestPermissions({
      permissions: ["camera"],
      rationale:
        "Camera access is required for gesture recognition to control the DJ mixer.",
      onGranted: () => console.log("Camera permission granted"),
      onDenied: () => console.log("Camera permission denied"),
    });

    return granted.length > 0;
  }

  async requestMicrophonePermission(): Promise<boolean> {
    const granted = await this.requestPermissions({
      permissions: ["microphone"],
      rationale:
        "Microphone access is required for audio input and voice control features.",
      onGranted: () => console.log("Microphone permission granted"),
      onDenied: () => console.log("Microphone permission denied"),
    });

    return granted.length > 0;
  }

  async requestNotificationPermission(): Promise<boolean> {
    const granted = await this.requestPermissions({
      permissions: ["notifications"],
      rationale:
        "Notifications help you stay updated with mix status and track information.",
      onGranted: () => console.log("Notification permission granted"),
      onDenied: () => console.log("Notification permission denied"),
    });

    return granted.length > 0;
  }

  // Bulk permission requests
  async requestAllPermissions(
    config: PermissionConfig,
  ): Promise<Map<PermissionName, boolean>> {
    const permissions: PermissionName[] = [];
    const results = new Map<PermissionName, boolean>();

    if (config.camera) permissions.push("camera");
    if (config.microphone) permissions.push("microphone");
    if (config.notifications) permissions.push("notifications");
    if (config.geolocation) permissions.push("geolocation");
    if (config.persistentStorage) permissions.push("persistent-storage");

    if (permissions.length === 0) return results;

    const granted = await this.requestPermissions({
      permissions,
      rationale: "Multiple permissions are required for full functionality.",
      onGranted: (grantedPerms) => {
        grantedPerms.forEach((perm) => results.set(perm, true));
        console.log("Permissions granted:", grantedPerms);
      },
      onDenied: (deniedPerms) => {
        deniedPerms.forEach((perm) => results.set(perm, false));
        console.log("Permissions denied:", deniedPerms);
      },
    });

    return results;
  }

  // Permission status helpers
  hasPermission(permission: PermissionName): boolean {
    const state = this.getPermissionState(permission);
    return state?.granted || false;
  }

  isPermissionDenied(permission: PermissionName): boolean {
    const state = this.getPermissionState(permission);
    return state?.denied || false;
  }

  needsPermission(permission: PermissionName): boolean {
    const state = this.getPermissionState(permission);
    return state?.prompt || false;
  }

  // UI management
  showCustomDialog(
    title: string,
    message: string,
    onAllow: () => void,
    onDeny: () => void,
  ): void {
    this.uiManager.showDialog(title, message, onAllow, onDeny);
  }

  removeAllDialogs(): void {
    this.uiManager.removeAllDialogs();
  }

  // Permission health check
  async checkPermissionHealth(): Promise<{
    healthy: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let healthy = true;

    // Check camera permission for gesture functionality
    if (!this.hasPermission("camera") && this.needsPermission("camera")) {
      issues.push("Camera permission needed for gesture control");
      recommendations.push(
        "Grant camera permission to enable gesture-based mixing",
      );
    }

    if (this.isPermissionDenied("camera")) {
      issues.push("Camera permission permanently denied");
      recommendations.push(
        "Reset camera permission in browser settings to enable gesture control",
      );
      healthy = false;
    }

    // Check notification permission
    if (!this.hasPermission("notifications")) {
      recommendations.push(
        "Enable notifications to stay updated with mix status",
      );
    }

    return {
      healthy,
      issues,
      recommendations,
    };
  }

  // Configuration
  updateUIConfig(config: Partial<PermissionUIConfig>): void {
    this.config = { ...this.config, ...config };
    this.uiManager = new PermissionUIManager(this.config);
    this.requester = new ProgressivePermissionRequester(
      this.monitor,
      this.config,
    );
  }

  getUIConfig(): PermissionUIConfig {
    return { ...this.config };
  }

  // Cleanup
  destroy(): void {
    this.removeAllDialogs();
  }
}

// Default UI configuration
export const defaultPermissionUIConfig: PermissionUIConfig = {
  showDialog: true,
  dialogTitle: "Permission Required",
  dialogMessage:
    "This feature requires additional permissions to work properly.",
  allowButtonText: "Grant Permission",
  denyButtonText: "Not Now",
  neverShowAgain: false,
};

// Singleton instance
export const permissionManager = new PermissionManager(
  defaultPermissionUIConfig,
);
