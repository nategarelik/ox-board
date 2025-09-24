/**
 * Suppress specific console warnings in development
 * This helps reduce noise from expected behaviors
 */

export function suppressAudioContextWarnings(): void {
  if (typeof window === "undefined") return;

  const originalWarn = console.warn;
  const originalError = console.error;

  // Suppress specific warnings
  console.warn = function (...args: any[]) {
    const message = args[0]?.toString() || "";

    // Suppress expected AudioContext warnings
    if (
      message.includes("AudioContext was not allowed to start") ||
      message.includes("The AudioContext was not allowed") ||
      message.includes("user gesture") ||
      message.includes("autoplay")
    ) {
      // These are expected and handled by our SafeAudioContext
      return;
    }

    // Suppress Tone.js test warnings
    if (
      message.includes("testAudioScheduledSourceNode") ||
      message.includes("constant-source-node-constructor")
    ) {
      return;
    }

    originalWarn.apply(console, args);
  };

  // Suppress specific errors that are handled
  console.error = function (...args: any[]) {
    const message = args[0]?.toString() || "";

    // Don't suppress actual errors, only filter known non-issues
    if (message.includes("Userscript") || message.includes("userscript")) {
      // Browser extension errors - not our problem
      return;
    }

    originalError.apply(console, args);
  };
}

// Auto-suppress in development
if (process.env.NODE_ENV === "development") {
  if (typeof window !== "undefined") {
    suppressAudioContextWarnings();
  }
}
