/**
 * Centralized logging utility for Schemock
 * Provides structured logging with different levels and contexts
 */

import chalk from 'chalk';

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export interface LogContext {
  module?: string;
  operation?: string;
  [key: string]: any;
}

class Logger {
  private level: LogLevel = 'info';
  private readonly levels: Record<LogLevel, number> = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3
  };

  /**
   * Set the logging level
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  /**
   * Get current logging level
   */
  getLevel(): LogLevel {
    return this.level;
  }

  /**
   * Check if a level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    return this.levels[level] <= this.levels[this.level];
  }

  /**
   * Format log message with timestamp and context
   */
  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const levelStr = level.toUpperCase().padEnd(5);
    
    let formatted = `[${timestamp}] ${levelStr} ${message}`;
    
    if (context) {
      const contextStr = Object.entries(context)
        .filter(([key]) => key !== 'module' && key !== 'operation')
        .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
        .join(' ');
      
      if (contextStr) {
        formatted += ` | ${contextStr}`;
      }
    }
    
    return formatted;
  }

  /**
   * Apply color based on log level
   */
  private colorize(level: LogLevel, message: string): string {
    switch (level) {
      case 'error':
        return chalk.red(message);
      case 'warn':
        return chalk.yellow(message);
      case 'info':
        return chalk.blue(message);
      case 'debug':
        return chalk.gray(message);
      default:
        return message;
    }
  }

  /**
   * Log an error message
   */
  error(message: string, context?: LogContext): void {
    if (this.shouldLog('error')) {
      const formatted = this.formatMessage('error', message, context);
      console.error(this.colorize('error', formatted));
      
      // Log stack trace if error object provided
      if (context?.error instanceof Error && context.error.stack) {
        console.error(chalk.gray(context.error.stack));
      }
    }
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      const formatted = this.formatMessage('warn', message, context);
      console.warn(this.colorize('warn', formatted));
    }
  }

  /**
   * Log an info message
   */
  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      const formatted = this.formatMessage('info', message, context);
      console.log(this.colorize('info', formatted));
    }
  }

  /**
   * Log a debug message
   */
  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      const formatted = this.formatMessage('debug', message, context);
      console.log(this.colorize('debug', formatted));
    }
  }

  /**
   * Log HTTP request
   */
  logRequest(method: string, path: string, statusCode?: number, duration?: number): void {
    const message = statusCode
      ? `${method} ${path} - ${statusCode}${duration ? ` (${duration}ms)` : ''}`
      : `${method} ${path}`;
    
    if (statusCode && statusCode >= 400) {
      this.warn(message, { type: 'http-request' });
    } else {
      this.info(message, { type: 'http-request' });
    }
  }

  /**
   * Log performance metric
   */
  logPerformance(operation: string, duration: number, context?: LogContext): void {
    this.debug(`Performance: ${operation} took ${duration}ms`, {
      ...context,
      type: 'performance',
      duration
    });
  }

  /**
   * Log security event
   */
  logSecurity(message: string, context?: LogContext): void {
    this.warn(`SECURITY: ${message}`, {
      ...context,
      type: 'security'
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience functions
export const setLogLevel = (level: LogLevel) => logger.setLevel(level);
export const log = {
  error: (message: string, context?: LogContext) => logger.error(message, context),
  warn: (message: string, context?: LogContext) => logger.warn(message, context),
  info: (message: string, context?: LogContext) => logger.info(message, context),
  debug: (message: string, context?: LogContext) => logger.debug(message, context),
  request: (method: string, path: string, statusCode?: number, duration?: number) => 
    logger.logRequest(method, path, statusCode, duration),
  performance: (operation: string, duration: number, context?: LogContext) => 
    logger.logPerformance(operation, duration, context),
  security: (message: string, context?: LogContext) => 
    logger.logSecurity(message, context)
};
