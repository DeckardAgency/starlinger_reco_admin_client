import { Injectable } from '@angular/core';
import { environment } from '@env/environment';

/**
 * Log levels for controlling output
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

/**
 * Centralized logging service with environment-based controls
 *
 * Usage:
 * ```typescript
 * constructor(private logger: LoggerService) {}
 *
 * this.logger.debug('Debug message', data);
 * this.logger.info('Info message', data);
 * this.logger.warn('Warning message', data);
 * this.logger.error('Error message', error);
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private logLevel: LogLevel;
  private enableTimestamps: boolean = true;
  private enableSourceLocation: boolean = !environment.production;

  constructor() {
    // Set log level based on environment
    this.logLevel = environment.production ? LogLevel.WARN : LogLevel.DEBUG;
  }

  /**
   * Log a debug message (most verbose)
   * Only shown in development
   */
  debug(message: string, ...args: unknown[]): void {
    this.log(LogLevel.DEBUG, message, args);
  }

  /**
   * Log an informational message
   */
  info(message: string, ...args: unknown[]): void {
    this.log(LogLevel.INFO, message, args);
  }

  /**
   * Log a warning message
   */
  warn(message: string, ...args: unknown[]): void {
    this.log(LogLevel.WARN, message, args);
  }

  /**
   * Log an error message
   */
  error(message: string, error?: unknown, ...args: unknown[]): void {
    if (error) {
      this.log(LogLevel.ERROR, message, [error, ...args]);
    } else {
      this.log(LogLevel.ERROR, message, args);
    }
  }

  /**
   * Set the minimum log level
   */
  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  /**
   * Enable or disable timestamps in log output
   */
  setTimestamps(enabled: boolean): void {
    this.enableTimestamps = enabled;
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, args: unknown[]): void {
    // Don't log if below minimum level
    if (level < this.logLevel) {
      return;
    }

    // Build the log message
    const prefix = this.buildPrefix(level);
    const fullMessage = `${prefix}${message}`;

    // Output to console based on level
    switch (level) {
      case LogLevel.DEBUG:
        if (args.length > 0) {
          console.log(fullMessage, ...args);
        } else {
          console.log(fullMessage);
        }
        break;

      case LogLevel.INFO:
        if (args.length > 0) {
          console.info(fullMessage, ...args);
        } else {
          console.info(fullMessage);
        }
        break;

      case LogLevel.WARN:
        if (args.length > 0) {
          console.warn(fullMessage, ...args);
        } else {
          console.warn(fullMessage);
        }
        break;

      case LogLevel.ERROR:
        if (args.length > 0) {
          console.error(fullMessage, ...args);
        } else {
          console.error(fullMessage);
        }
        break;
    }
  }

  /**
   * Build log prefix with timestamp and level
   */
  private buildPrefix(level: LogLevel): string {
    const parts: string[] = [];

    // Add timestamp if enabled
    if (this.enableTimestamps) {
      const timestamp = new Date().toISOString();
      parts.push(`[${timestamp}]`);
    }

    // Add level
    const levelName = LogLevel[level];
    parts.push(`[${levelName}]`);

    return parts.join(' ') + ' ';
  }

  /**
   * Create a scoped logger for a specific component/service
   *
   * Usage:
   * ```typescript
   * private logger = this.loggerService.createLogger('MyComponent');
   * this.logger.info('Message'); // Output: [INFO] [MyComponent] Message
   * ```
   */
  createLogger(scope: string): ScopedLogger {
    return new ScopedLogger(this, scope);
  }
}

/**
 * Scoped logger that prefixes all messages with a scope name
 */
export class ScopedLogger {
  constructor(
    private logger: LoggerService,
    private scope: string
  ) {}

  debug(message: string, ...args: unknown[]): void {
    this.logger.debug(`[${this.scope}] ${message}`, ...args);
  }

  info(message: string, ...args: unknown[]): void {
    this.logger.info(`[${this.scope}] ${message}`, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    this.logger.warn(`[${this.scope}] ${message}`, ...args);
  }

  error(message: string, error?: unknown, ...args: unknown[]): void {
    this.logger.error(`[${this.scope}] ${message}`, error, ...args);
  }
}
