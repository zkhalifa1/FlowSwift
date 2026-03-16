/**
 * Secure Logger Utility
 * Only logs in development, sanitizes sensitive data in production
 */

/* eslint-disable no-console */

const isDevelopment = import.meta.env.DEV;
const isDebugMode = import.meta.env.VITE_DEBUG_MODE === 'true';

class Logger {
  constructor() {
    this.enabledInProduction = isDebugMode;
    this.sensitiveKeys = [
      'uid', 'userId', 'email', 'token', 'apiKey', 'password',
      'phoneNumber', 'ssn', 'creditCard', 'accessToken', 'refreshToken',
      'sessionId', 'authToken'
    ];
  }

  /**
   * Determine if logging should occur
   */
  shouldLog() {
    return isDevelopment || this.enabledInProduction;
  }

  /**
   * Sanitize sensitive data from objects
   */
  sanitize(data) {
    if (data === null || data === undefined) {
      return data;
    }

    // Handle primitives
    if (typeof data !== 'object') {
      return data;
    }

    // Handle arrays
    if (Array.isArray(data)) {
      return data.map(item => this.sanitize(item));
    }

    // Handle objects
    const sanitized = { ...data };

    for (const key of Object.keys(sanitized)) {
      const lowerKey = key.toLowerCase();

      // Check if key contains sensitive information
      const isSensitive = this.sensitiveKeys.some(sensitiveKey =>
        lowerKey.includes(sensitiveKey.toLowerCase())
      );

      if (isSensitive) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        // Recursively sanitize nested objects
        sanitized[key] = this.sanitize(sanitized[key]);
      }
    }

    return sanitized;
  }

  /**
   * Info level logging (general information)
   */
  info(message, data) {
    if (this.shouldLog()) {
      const logData = data ? this.sanitize(data) : '';
      console.log(`[INFO] ${message}`, logData);
    }
  }

  /**
   * Warning level logging
   */
  warn(message, data) {
    if (this.shouldLog()) {
      const logData = data ? this.sanitize(data) : '';
      console.warn(`[WARN] ${message}`, logData);
    }
  }

  /**
   * Error level logging (always logs, but sanitizes)
   */
  error(message, error) {
    // Always log errors, but sanitize
    const sanitizedError = {
      message: error?.message || 'Unknown error',
      code: error?.code || 'UNKNOWN',
      // Only include stack traces in development
      ...(isDevelopment && error?.stack && { stack: error.stack }),
    };
    console.error(`[ERROR] ${message}`, sanitizedError);
  }

  /**
   * Debug level logging (development only)
   */
  debug(message, data) {
    if (isDevelopment) {
      console.debug(`[DEBUG] ${message}`, data);
    }
  }

  /**
   * Success logging (for important operations)
   */
  success(message, data) {
    if (this.shouldLog()) {
      const logData = data ? this.sanitize(data) : '';
      console.log(`[SUCCESS] ✓ ${message}`, logData);
    }
  }
}

export const logger = new Logger();

// Export individual methods for convenience
export const { info, warn, error, debug, success } = logger;
