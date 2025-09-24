/**
 * Safe AudioContext initialization wrapper
 * Handles browser autoplay policies and provides proper error recovery
 */

import * as Tone from "tone";

interface AudioContextState {
  isInitialized: boolean;
  isUserGestureRequired: boolean;
  lastError: Error | null;
  retryCount: number;
}

class SafeAudioContext {
  private static instance: SafeAudioContext;
  private state: AudioContextState = {
    isInitialized: false,
    isUserGestureRequired: false,
    lastError: null,
    retryCount: 0,
  };

  private constructor() {}

  static getInstance(): SafeAudioContext {
    if (!SafeAudioContext.instance) {
      SafeAudioContext.instance = new SafeAudioContext();
    }
    return SafeAudioContext.instance;
  }

  /**
   * Check if running in a browser environment
   */
  private isBrowser(): boolean {
    return (
      typeof window !== "undefined" && typeof window.document !== "undefined"
    );
  }

  /**
   * Initialize audio context with proper error handling
   */
  async initialize(): Promise<boolean> {
    if (!this.isBrowser()) {
      console.warn("AudioContext not available in non-browser environment");
      return false;
    }

    if (this.state.isInitialized) {
      return true;
    }

    try {
      // Try to start Tone.js
      await Tone.start();

      // Tone.start() will change the state to 'running' if successful
      // We need to check the raw context state since Tone.context.state might be stale
      const contextState = Tone.context.rawContext?.state || Tone.context.state;

      if (contextState === "running") {
        this.state.isInitialized = true;
        this.state.isUserGestureRequired = false;
        this.state.lastError = null;
        console.log("Audio context initialized successfully");
        return true;
      } else {
        throw new Error(`AudioContext in unexpected state: ${contextState}`);
      }
    } catch (error) {
      this.state.lastError = error as Error;
      this.state.retryCount++;

      // Check if it's an autoplay policy error
      const errorMessage = (error as Error).message?.toLowerCase() || "";
      if (
        errorMessage.includes("user gesture") ||
        errorMessage.includes("user activation") ||
        errorMessage.includes("autoplay") ||
        errorMessage.includes("not allowed")
      ) {
        this.state.isUserGestureRequired = true;
        console.log("User gesture required to start audio context");
      } else {
        console.error("Failed to initialize audio context:", error);
      }

      return false;
    }
  }

  /**
   * Resume audio context (for after user gesture)
   */
  async resume(): Promise<boolean> {
    if (!this.isBrowser()) {
      return false;
    }

    try {
      const contextState = Tone.context.rawContext?.state || Tone.context.state;

      if (contextState === "suspended") {
        await Tone.context.resume();
      }

      const newState = Tone.context.rawContext?.state || Tone.context.state;
      if (newState === "running") {
        this.state.isInitialized = true;
        this.state.isUserGestureRequired = false;
        return true;
      }

      // If still not running, try full initialization
      return await this.initialize();
    } catch (error) {
      console.error("Failed to resume audio context:", error);
      this.state.lastError = error as Error;
      return false;
    }
  }

  /**
   * Get current state
   */
  getState(): Readonly<AudioContextState> {
    return { ...this.state };
  }

  /**
   * Check if ready
   */
  isReady(): boolean {
    if (!this.state.isInitialized) return false;
    const contextState = Tone.context.rawContext?.state || Tone.context.state;
    return contextState === "running";
  }

  /**
   * Check if user gesture is required
   */
  needsUserGesture(): boolean {
    return this.state.isUserGestureRequired && !this.state.isInitialized;
  }

  /**
   * Reset state (for testing or recovery)
   */
  reset(): void {
    this.state = {
      isInitialized: false,
      isUserGestureRequired: false,
      lastError: null,
      retryCount: 0,
    };
  }

  /**
   * Dispose and cleanup
   */
  async dispose(): Promise<void> {
    if (this.isBrowser() && Tone.context && Tone.context.rawContext) {
      const ctx = Tone.context.rawContext;
      // Check if it's a regular AudioContext (not OfflineAudioContext)
      if ("close" in ctx && typeof ctx.close === "function") {
        const contextState = ctx.state;
        if (contextState === "running" || contextState === "suspended") {
          await (ctx as AudioContext).close();
        }
      }
    }
    this.reset();
  }
}

export const safeAudioContext = SafeAudioContext.getInstance();
export default safeAudioContext;
