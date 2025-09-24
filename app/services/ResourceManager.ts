/**
 * @fileoverview ResourceManager service for tracking and cleaning up all application resources
 * @module services/ResourceManager
 * @since 0.8.0
 */

import * as Tone from "tone";

/**
 * Resource types that can be managed
 */
export type ResourceType =
  | "worker"
  | "event"
  | "blob"
  | "interval"
  | "timeout"
  | "audio"
  | "stream"
  | "webgl";

/**
 * Event listener registration data
 */
interface EventListenerData {
  element: EventTarget;
  event: string;
  handler: EventListener;
  options?: boolean | AddEventListenerOptions;
}

/**
 * Resource entry with metadata
 */
interface ResourceEntry<T = any> {
  id: string;
  type: ResourceType;
  resource: T;
  timestamp: number;
  description?: string;
}

/**
 * Resource usage statistics
 */
export interface ResourceStats {
  workers: number;
  eventListeners: number;
  blobURLs: number;
  intervals: number;
  timeouts: number;
  audioNodes: number;
  mediaStreams: number;
  webglContexts: number;
  totalMemoryEstimate: number;
  potentialLeaks: string[];
}

/**
 * @class ResourceManager
 * @description Centralized resource tracking and cleanup service
 *
 * Manages the lifecycle of all browser resources to prevent memory leaks:
 * - Web Workers
 * - Event listeners
 * - Blob URLs
 * - Intervals and timeouts
 * - Audio nodes
 * - Media streams
 * - WebGL contexts
 *
 * @example
 * ```typescript
 * const manager = ResourceManager.getInstance();
 *
 * // Register a worker
 * const worker = new Worker('/worker.js');
 * manager.registerWorker('analysis-worker', worker);
 *
 * // Register an event listener
 * const handler = (e) => console.log(e);
 * window.addEventListener('resize', handler);
 * manager.registerEventListener(window, 'resize', handler);
 *
 * // Clean up everything
 * manager.cleanup();
 * ```
 */
export class ResourceManager {
  private static instance: ResourceManager | null = null;
  private resources: Map<string, ResourceEntry> = new Map();
  private eventListeners: Map<string, EventListenerData> = new Map();
  private cleanupCallbacks: Set<() => void> = new Set();

  private constructor() {
    // Auto-cleanup on page unload
    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", () => this.cleanup());
    }
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ResourceManager {
    if (!ResourceManager.instance) {
      ResourceManager.instance = new ResourceManager();
    }
    return ResourceManager.instance;
  }

  /**
   * Register a Web Worker
   */
  public registerWorker(
    id: string,
    worker: Worker,
    description?: string,
  ): void {
    this.resources.set(id, {
      id,
      type: "worker",
      resource: worker,
      timestamp: Date.now(),
      description,
    });
  }

  /**
   * Register an event listener
   */
  public registerEventListener(
    element: EventTarget,
    event: string,
    handler: EventListener,
    options?: boolean | AddEventListenerOptions,
  ): string {
    const id = `event_${Date.now()}_${Math.random()}`;
    this.eventListeners.set(id, { element, event, handler, options });
    return id;
  }

  /**
   * Register a Blob URL
   */
  public registerBlobURL(url: string, description?: string): void {
    this.resources.set(url, {
      id: url,
      type: "blob",
      resource: url,
      timestamp: Date.now(),
      description,
    });
  }

  /**
   * Register an interval
   */
  public registerInterval(id: string, handle: NodeJS.Timeout): void {
    this.resources.set(id, {
      id,
      type: "interval",
      resource: handle,
      timestamp: Date.now(),
    });
  }

  /**
   * Register a timeout
   */
  public registerTimeout(id: string, handle: NodeJS.Timeout): void {
    this.resources.set(id, {
      id,
      type: "timeout",
      resource: handle,
      timestamp: Date.now(),
    });
  }

  /**
   * Register an audio node
   */
  public registerAudioNode(
    id: string,
    node: Tone.ToneAudioNode,
    description?: string,
  ): void {
    this.resources.set(id, {
      id,
      type: "audio",
      resource: node,
      timestamp: Date.now(),
      description,
    });
  }

  /**
   * Register a media stream
   */
  public registerMediaStream(id: string, stream: MediaStream): void {
    this.resources.set(id, {
      id,
      type: "stream",
      resource: stream,
      timestamp: Date.now(),
    });
  }

  /**
   * Register a WebGL context
   */
  public registerWebGLContext(
    id: string,
    context: WebGLRenderingContext | WebGL2RenderingContext,
  ): void {
    this.resources.set(id, {
      id,
      type: "webgl",
      resource: context,
      timestamp: Date.now(),
    });
  }

  /**
   * Unregister a specific resource
   */
  public unregister(id: string): boolean {
    const entry = this.resources.get(id);
    if (entry) {
      this.cleanupResource(entry);
      this.resources.delete(id);
      return true;
    }

    // Check event listeners
    const eventEntry = this.eventListeners.get(id);
    if (eventEntry) {
      eventEntry.element.removeEventListener(
        eventEntry.event,
        eventEntry.handler,
        eventEntry.options,
      );
      this.eventListeners.delete(id);
      return true;
    }

    return false;
  }

  /**
   * Clean up a specific resource
   */
  private cleanupResource(entry: ResourceEntry): void {
    try {
      switch (entry.type) {
        case "worker":
          (entry.resource as Worker).terminate();
          break;
        case "blob":
          URL.revokeObjectURL(entry.resource as string);
          break;
        case "interval":
          clearInterval(entry.resource as NodeJS.Timeout);
          break;
        case "timeout":
          clearTimeout(entry.resource as NodeJS.Timeout);
          break;
        case "audio":
          if (
            entry.resource &&
            typeof (entry.resource as any).dispose === "function"
          ) {
            (entry.resource as any).dispose();
          }
          break;
        case "stream":
          (entry.resource as MediaStream)
            .getTracks()
            .forEach((track) => track.stop());
          break;
        case "webgl":
          const gl = entry.resource as WebGLRenderingContext;
          const extension = gl.getExtension("WEBGL_lose_context");
          if (extension) {
            extension.loseContext();
          }
          break;
      }
    } catch (error) {
      console.error(`Failed to cleanup resource ${entry.id}:`, error);
    }
  }

  /**
   * Clean up all resources
   */
  public cleanup(): void {
    // Clean up all registered resources
    this.resources.forEach((entry) => {
      this.cleanupResource(entry);
    });
    this.resources.clear();

    // Remove all event listeners
    this.eventListeners.forEach(({ element, event, handler, options }) => {
      element.removeEventListener(event, handler, options);
    });
    this.eventListeners.clear();

    // Execute cleanup callbacks
    this.cleanupCallbacks.forEach((callback) => {
      try {
        callback();
      } catch (error) {
        console.error("Cleanup callback failed:", error);
      }
    });
    this.cleanupCallbacks.clear();
  }

  /**
   * Register a cleanup callback
   */
  public onCleanup(callback: () => void): void {
    this.cleanupCallbacks.add(callback);
  }

  /**
   * Get resource statistics
   */
  public getStats(): ResourceStats {
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    const potentialLeaks: string[] = [];

    let workers = 0;
    let blobURLs = 0;
    let intervals = 0;
    let timeouts = 0;
    let audioNodes = 0;
    let mediaStreams = 0;
    let webglContexts = 0;

    this.resources.forEach((entry) => {
      // Check for potential leaks (resources older than 5 minutes)
      if (now - entry.timestamp > fiveMinutes) {
        potentialLeaks.push(
          `${entry.type}: ${entry.id} (${Math.floor((now - entry.timestamp) / 1000)}s old)`,
        );
      }

      switch (entry.type) {
        case "worker":
          workers++;
          break;
        case "blob":
          blobURLs++;
          break;
        case "interval":
          intervals++;
          break;
        case "timeout":
          timeouts++;
          break;
        case "audio":
          audioNodes++;
          break;
        case "stream":
          mediaStreams++;
          break;
        case "webgl":
          webglContexts++;
          break;
      }
    });

    // Estimate memory usage (rough approximations)
    const totalMemoryEstimate =
      workers * 5_000_000 + // ~5MB per worker
      blobURLs * 100_000 + // ~100KB per blob URL
      intervals * 1_000 + // ~1KB per interval
      timeouts * 1_000 + // ~1KB per timeout
      audioNodes * 10_000 + // ~10KB per audio node
      mediaStreams * 1_000_000 + // ~1MB per media stream
      webglContexts * 10_000_000 + // ~10MB per WebGL context
      this.eventListeners.size * 500; // ~500B per event listener

    return {
      workers,
      eventListeners: this.eventListeners.size,
      blobURLs,
      intervals,
      timeouts,
      audioNodes,
      mediaStreams,
      webglContexts,
      totalMemoryEstimate,
      potentialLeaks,
    };
  }

  /**
   * Log current resource usage
   */
  public logStats(): void {
    const stats = this.getStats();
    console.group("🔧 Resource Manager Statistics");
    console.log("Workers:", stats.workers);
    console.log("Event Listeners:", stats.eventListeners);
    console.log("Blob URLs:", stats.blobURLs);
    console.log("Intervals:", stats.intervals);
    console.log("Timeouts:", stats.timeouts);
    console.log("Audio Nodes:", stats.audioNodes);
    console.log("Media Streams:", stats.mediaStreams);
    console.log("WebGL Contexts:", stats.webglContexts);
    console.log(
      "Estimated Memory:",
      `${(stats.totalMemoryEstimate / 1_000_000).toFixed(2)}MB`,
    );
    if (stats.potentialLeaks.length > 0) {
      console.warn("⚠️ Potential Leaks:", stats.potentialLeaks);
    }
    console.groupEnd();
  }

  /**
   * Reset singleton instance (for testing)
   */
  public static resetInstance(): void {
    if (ResourceManager.instance) {
      ResourceManager.instance.cleanup();
      ResourceManager.instance = null;
    }
  }
}

// Export singleton getter
export const getResourceManager = (): ResourceManager => {
  return ResourceManager.getInstance();
};
