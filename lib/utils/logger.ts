/**
 * Centralized logging utility for consistent logging across the application
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

interface LogPayload {
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
  level: LogLevel;
}

/**
 * Application logger
 */
class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = "info";

  private constructor() {
    // Initialize with environment-specific log level
    this.setLogLevel((process.env.LOG_LEVEL as LogLevel) || "info");
  }

  /**
   * Get the singleton logger instance
   */
  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Set the minimum log level
   */
  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  /**
   * Log a debug message
   */
  public debug(message: string, context?: Record<string, unknown>): void {
    this.log("debug", message, context);
  }

  /**
   * Log an info message
   */
  public info(message: string, context?: Record<string, unknown>): void {
    this.log("info", message, context);
  }

  /**
   * Log a warning message
   */
  public warn(message: string, context?: Record<string, unknown>): void {
    this.log("warn", message, context);
  }

  /**
   * Log an error message
   */
  public error(message: string, context?: Record<string, unknown>): void {
    this.log("error", message, context);
  }

  /**
   * Log an entry with the specified level
   */
  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
  ): void {
    const levelPriority = { debug: 0, info: 1, warn: 2, error: 3 };

    // Only log if the level is high enough priority
    if (levelPriority[level] >= levelPriority[this.logLevel]) {
      const payload: LogPayload = {
        message,
        context,
        timestamp: new Date().toISOString(),
        level,
      };

      // In production, you'd likely send this to a logging service
      // For now, just log to console with appropriate formatting
      const logMethod =
        level === "error"
          ? console.error
          : level === "warn"
            ? console.warn
            : level === "info"
              ? console.info
              : console.debug;

      logMethod(
        `[${payload.timestamp}] [${level.toUpperCase()}] ${message}`,
        context ? { context } : "",
      );
    }
  }
}

// Export a singleton instance
export const logger = Logger.getInstance();

// Export convenience methods
export const debug = logger.debug.bind(logger);
export const info = logger.info.bind(logger);
export const warn = logger.warn.bind(logger);
export const error = logger.error.bind(logger);
