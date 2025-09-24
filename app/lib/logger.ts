/**
 * Lightweight logger for production-safe logging
 * Replaces direct console.* usage throughout the app
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LoggerConfig {
  enabled: boolean;
  level: LogLevel;
  prefix?: string;
}

class Logger {
  private config: LoggerConfig;
  private levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      enabled: process.env.NODE_ENV !== "production",
      level: (process.env.LOG_LEVEL as LogLevel) || "info",
      prefix: config.prefix || "[OX]",
      ...config,
    };
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false;
    return this.levels[level] >= this.levels[this.config.level];
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    ...args: any[]
  ): void {
    if (!this.shouldLog(level)) return;

    const timestamp = new Date().toISOString();
    const prefix = `${timestamp} ${this.config.prefix} [${level.toUpperCase()}]`;

    switch (level) {
      case "debug":
        console.debug(prefix, message, ...args);
        break;
      case "info":
        console.log(prefix, message, ...args);
        break;
      case "warn":
        console.warn(prefix, message, ...args);
        break;
      case "error":
        console.error(prefix, message, ...args);
        break;
    }
  }

  debug(message: string, ...args: any[]): void {
    this.formatMessage("debug", message, ...args);
  }

  info(message: string, ...args: any[]): void {
    this.formatMessage("info", message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.formatMessage("warn", message, ...args);
  }

  error(message: string, error?: Error | unknown, ...args: any[]): void {
    if (error instanceof Error) {
      this.formatMessage("error", message, error.message, error.stack, ...args);
    } else {
      this.formatMessage("error", message, error, ...args);
    }
  }

  // Performance logging helper
  time(label: string): void {
    if (this.shouldLog("debug")) {
      console.time(`${this.config.prefix} ${label}`);
    }
  }

  timeEnd(label: string): void {
    if (this.shouldLog("debug")) {
      console.timeEnd(`${this.config.prefix} ${label}`);
    }
  }

  // Group logging for better organization
  group(label: string): void {
    if (this.shouldLog("debug")) {
      console.group(`${this.config.prefix} ${label}`);
    }
  }

  groupEnd(): void {
    if (this.shouldLog("debug")) {
      console.groupEnd();
    }
  }
}

// Export singleton instances for different modules
export const logger = new Logger();
export const audioLogger = new Logger({ prefix: "[OX-Audio]" });
export const gestureLogger = new Logger({ prefix: "[OX-Gesture]" });
export const uiLogger = new Logger({ prefix: "[OX-UI]" });

// Export Logger class for custom instances
export default Logger;
