/**
 * OX Board - Offline Data Synchronization System
 * Handles offline actions, background sync, and conflict resolution
 */

import { stemCache } from "../storage/stemCache";

export interface OfflineAction {
  id: string;
  type: "stem_upload" | "settings_save" | "stem_process" | "user_action";
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: any;
  timestamp: number;
  retryCount: number;
  priority: "low" | "medium" | "high" | "critical";
}

export interface SyncStatus {
  isOnline: boolean;
  pendingActions: number;
  lastSyncTime: number | null;
  syncInProgress: boolean;
  errors: SyncError[];
}

export interface SyncError {
  actionId: string;
  error: string;
  timestamp: number;
  retryCount: number;
}

export interface ConflictResolution {
  strategy: "server_wins" | "client_wins" | "merge" | "manual";
  serverData?: any;
  clientData?: any;
  mergedData?: any;
}

class OfflineSyncManager {
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = "ox-board-sync";
  private readonly DB_VERSION = 1;
  private readonly STORE_ACTIONS = "offline_actions";
  private readonly STORE_STATUS = "sync_status";
  private readonly STORE_CONFLICTS = "conflicts";

  private initialized = false;
  private syncInProgress = false;
  private listeners: Set<(status: SyncStatus) => void> = new Set();
  private connectionStatusInterval: NodeJS.Timeout | null = null;

  // Retry configuration
  private readonly MAX_RETRY_COUNT = 3;
  private readonly RETRY_DELAYS = [1000, 5000, 15000]; // milliseconds
  private readonly BATCH_SIZE = 5;

  constructor() {
    this.initializeDB();
    this.setupConnectionMonitoring();
    this.setupVisibilityChangeHandler();
  }

  /**
   * Initialize IndexedDB for offline sync storage
   */
  private async initializeDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        console.error("❌ Failed to open sync database:", request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.initialized = true;
        console.log("✅ Offline sync database initialized");
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create stores if they don't exist
        if (!db.objectStoreNames.contains(this.STORE_ACTIONS)) {
          const actionsStore = db.createObjectStore(this.STORE_ACTIONS, {
            keyPath: "id",
          });
          actionsStore.createIndex("timestamp", "timestamp", { unique: false });
          actionsStore.createIndex("priority", "priority", { unique: false });
          actionsStore.createIndex("type", "type", { unique: false });
        }

        if (!db.objectStoreNames.contains(this.STORE_STATUS)) {
          db.createObjectStore(this.STORE_STATUS, { keyPath: "id" });
        }

        if (!db.objectStoreNames.contains(this.STORE_CONFLICTS)) {
          db.createObjectStore(this.STORE_CONFLICTS, { keyPath: "id" });
        }
      };
    });
  }

  /**
   * Setup connection monitoring
   */
  private setupConnectionMonitoring(): void {
    // Monitor online/offline status
    window.addEventListener("online", this.handleConnectionChange.bind(this));
    window.addEventListener("offline", this.handleConnectionChange.bind(this));

    // Periodic connection check (fallback)
    this.connectionStatusInterval = setInterval(() => {
      this.handleConnectionChange();
    }, 30000); // Check every 30 seconds
  }

  /**
   * Setup visibility change handler for background sync
   */
  private setupVisibilityChangeHandler(): void {
    document.addEventListener("visibilitychange", async () => {
      if (!document.hidden && navigator.onLine) {
        // App became visible and we're online - try to sync
        console.log(
          "👀 App visible and online, checking for pending actions...",
        );
        await this.syncPendingActions();
      }
    });
  }

  /**
   * Handle connection status changes
   */
  private async handleConnectionChange(): Promise<void> {
    const isOnline = navigator.onLine;
    console.log(
      `🌐 Connection status changed: ${isOnline ? "online" : "offline"}`,
    );

    // Update status
    await this.updateSyncStatus({ isOnline });

    if (isOnline) {
      // We're back online - start syncing
      setTimeout(() => {
        this.syncPendingActions();
      }, 1000); // Small delay to ensure connection is stable
    }

    // Notify listeners
    this.notifyStatusChange();
  }

  /**
   * Queue an action for offline execution
   */
  async queueAction(
    type: OfflineAction["type"],
    url: string,
    options: {
      method?: string;
      headers?: Record<string, string>;
      body?: any;
      priority?: OfflineAction["priority"];
    } = {},
  ): Promise<string> {
    if (!this.db) await this.initializeDB();

    const action: OfflineAction = {
      id: this.generateActionId(),
      type,
      url,
      method: options.method || "POST",
      headers: options.headers || {},
      body: options.body,
      timestamp: Date.now(),
      retryCount: 0,
      priority: options.priority || "medium",
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        [this.STORE_ACTIONS],
        "readwrite",
      );
      const store = transaction.objectStore(this.STORE_ACTIONS);
      const request = store.add(action);

      request.onsuccess = () => {
        console.log(`📝 Queued offline action: ${type}`, action.id);
        this.notifyStatusChange();
        resolve(action.id);
      };

      request.onerror = () => {
        console.error("❌ Failed to queue action:", request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Sync all pending actions
   */
  async syncPendingActions(): Promise<void> {
    if (this.syncInProgress || !navigator.onLine) {
      return;
    }

    this.syncInProgress = true;
    await this.updateSyncStatus({ syncInProgress: true });

    try {
      console.log("🔄 Starting offline sync...");

      const actions = await this.getPendingActions();
      if (actions.length === 0) {
        console.log("✅ No pending actions to sync");
        await this.updateSyncStatus({ syncInProgress: false });
        return;
      }

      // Sort by priority and timestamp
      const sortedActions = this.sortActionsByPriority(actions);

      // Process in batches
      const batches = this.createBatches(sortedActions, this.BATCH_SIZE);

      for (const batch of batches) {
        await this.processBatch(batch);
      }

      // Update last sync time
      await this.updateSyncStatus({
        lastSyncTime: Date.now(),
        syncInProgress: false,
      });

      console.log("✅ Offline sync completed");
    } catch (error) {
      console.error("❌ Offline sync failed:", error);
      await this.updateSyncStatus({
        syncInProgress: false,
        errors: [
          {
            actionId: "sync",
            error: error instanceof Error ? error.message : "Unknown error",
            timestamp: Date.now(),
            retryCount: 0,
          },
        ],
      });
    } finally {
      this.syncInProgress = false;
      this.notifyStatusChange();
    }
  }

  /**
   * Process a batch of actions
   */
  private async processBatch(actions: OfflineAction[]): Promise<void> {
    const promises = actions.map((action) => this.processAction(action));
    await Promise.allSettled(promises);

    // Small delay between batches
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  /**
   * Process a single action with retry logic
   */
  private async processAction(action: OfflineAction): Promise<void> {
    try {
      console.log(`📤 Processing action: ${action.type}`, action.id);

      const response = await fetch(action.url, {
        method: action.method,
        headers: {
          "Content-Type": "application/json",
          ...action.headers,
        },
        body: action.body ? JSON.stringify(action.body) : undefined,
      });

      if (response.ok) {
        await this.removeAction(action.id);
        console.log(`✅ Action completed: ${action.type}`, action.id);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`❌ Action failed: ${action.type}`, action.id, error);

      // Increment retry count
      action.retryCount++;

      if (action.retryCount < this.MAX_RETRY_COUNT) {
        // Schedule retry with exponential backoff
        const delay =
          this.RETRY_DELAYS[action.retryCount - 1] ||
          this.RETRY_DELAYS[this.RETRY_DELAYS.length - 1];
        setTimeout(() => this.processAction(action), delay);
        await this.updateAction(action);
      } else {
        // Max retries reached - mark as failed
        await this.markActionAsFailed(
          action,
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    }
  }

  /**
   * Handle conflicts during sync
   */
  async resolveConflict(
    actionId: string,
    resolution: ConflictResolution,
  ): Promise<void> {
    if (!this.db) await this.initializeDB();

    // Apply resolution strategy
    let finalData: any;

    switch (resolution.strategy) {
      case "server_wins":
        finalData = resolution.serverData;
        break;
      case "client_wins":
        finalData = resolution.clientData;
        break;
      case "merge":
        finalData = resolution.mergedData || {
          ...resolution.serverData,
          ...resolution.clientData,
        };
        break;
      case "manual":
        finalData = resolution.mergedData;
        break;
    }

    // Store conflict resolution
    const conflict = {
      id: actionId,
      resolution: resolution.strategy,
      resolvedAt: Date.now(),
      finalData,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        [this.STORE_CONFLICTS],
        "readwrite",
      );
      const store = transaction.objectStore(this.STORE_CONFLICTS);
      const request = store.put(conflict);

      request.onsuccess = () => {
        console.log("✅ Conflict resolved:", actionId, resolution.strategy);
        resolve();
      };

      request.onerror = () => {
        console.error("❌ Failed to store conflict resolution:", request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get pending actions sorted by priority
   */
  private async getPendingActions(): Promise<OfflineAction[]> {
    if (!this.db) await this.initializeDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        [this.STORE_ACTIONS],
        "readonly",
      );
      const store = transaction.objectStore(this.STORE_ACTIONS);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result as OfflineAction[]);
      };

      request.onerror = () => {
        console.error("❌ Failed to get pending actions:", request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Sort actions by priority and timestamp
   */
  private sortActionsByPriority(actions: OfflineAction[]): OfflineAction[] {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };

    return actions.sort((a, b) => {
      // First by priority
      const priorityDiff =
        priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Then by timestamp (oldest first)
      return a.timestamp - b.timestamp;
    });
  }

  /**
   * Create batches of actions
   */
  private createBatches<T>(array: T[], size: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      batches.push(array.slice(i, i + size));
    }
    return batches;
  }

  /**
   * Remove completed action
   */
  private async removeAction(actionId: string): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        [this.STORE_ACTIONS],
        "readwrite",
      );
      const store = transaction.objectStore(this.STORE_ACTIONS);
      const request = store.delete(actionId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Update action (for retry count, etc.)
   */
  private async updateAction(action: OfflineAction): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        [this.STORE_ACTIONS],
        "readwrite",
      );
      const store = transaction.objectStore(this.STORE_ACTIONS);
      const request = store.put(action);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Mark action as failed
   */
  private async markActionAsFailed(
    action: OfflineAction,
    error: string,
  ): Promise<void> {
    // Store in errors for user notification
    const syncError: SyncError = {
      actionId: action.id,
      error,
      timestamp: Date.now(),
      retryCount: action.retryCount,
    };

    await this.updateSyncStatus({ errors: [syncError] });
    console.error(
      `💥 Action permanently failed: ${action.type}`,
      action.id,
      error,
    );
  }

  /**
   * Update sync status
   */
  private async updateSyncStatus(updates: Partial<SyncStatus>): Promise<void> {
    if (!this.db) await this.initializeDB();

    const currentStatus = await this.getSyncStatus();
    const newStatus = { ...currentStatus, ...updates };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        [this.STORE_STATUS],
        "readwrite",
      );
      const store = transaction.objectStore(this.STORE_STATUS);
      const request = store.put({ id: "main", ...newStatus });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get current sync status
   */
  async getSyncStatus(): Promise<SyncStatus> {
    if (!this.db) await this.initializeDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_STATUS], "readonly");
      const store = transaction.objectStore(this.STORE_STATUS);
      const request = store.get("main");

      request.onsuccess = () => {
        const status = request.result || {
          isOnline: navigator.onLine,
          pendingActions: 0,
          lastSyncTime: null,
          syncInProgress: false,
          errors: [],
        };

        // Count pending actions
        const actionsTransaction = this.db!.transaction(
          [this.STORE_ACTIONS],
          "readonly",
        );
        const actionsStore = actionsTransaction.objectStore(this.STORE_ACTIONS);
        const countRequest = actionsStore.count();

        countRequest.onsuccess = () => {
          status.pendingActions = countRequest.result;
          resolve(status);
        };

        countRequest.onerror = () => {
          resolve(status);
        };
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Subscribe to sync status changes
   */
  onStatusChange(listener: (status: SyncStatus) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of status changes
   */
  private async notifyStatusChange(): Promise<void> {
    const status = await this.getSyncStatus();
    this.listeners.forEach((listener) => listener(status));
  }

  /**
   * Generate unique action ID
   */
  private generateActionId(): string {
    return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clear all pending actions (for testing/debugging)
   */
  async clearPendingActions(): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        [this.STORE_ACTIONS],
        "readwrite",
      );
      const store = transaction.objectStore(this.STORE_ACTIONS);
      const request = store.clear();

      request.onsuccess = () => {
        console.log("🗑️ All pending actions cleared");
        this.notifyStatusChange();
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get statistics about offline actions
   */
  async getSyncStats(): Promise<{
    totalActions: number;
    pendingActions: number;
    completedActions: number;
    failedActions: number;
    byType: Record<string, number>;
    averageProcessingTime: number;
  }> {
    const actions = await this.getPendingActions();

    // In a real implementation, you'd track completed actions too
    const stats = {
      totalActions: actions.length,
      pendingActions: actions.length,
      completedActions: 0,
      failedActions: 0,
      byType: {} as Record<string, number>,
      averageProcessingTime: 0,
    };

    // Count by type
    actions.forEach((action) => {
      stats.byType[action.type] = (stats.byType[action.type] || 0) + 1;
    });

    return stats;
  }
}

// Export singleton instance
export const offlineSync = new OfflineSyncManager();

// Auto-sync when online
if (typeof window !== "undefined") {
  // Start sync when page loads and we're online
  if (document.readyState === "complete") {
    setTimeout(() => offlineSync.syncPendingActions(), 1000);
  } else {
    window.addEventListener("load", () => {
      setTimeout(() => offlineSync.syncPendingActions(), 1000);
    });
  }
}
