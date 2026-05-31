/**
 * Custom Logger Utility
 * Ensures that sensitive information or debug logs are not exposed in the Production environment.
 */

const isDevelopment = import.meta.env.MODE === 'development';

const logger = {
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  
  info: (...args) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
  
  warn: (...args) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  
  error: (...args) => {
    // Errors might be logged in production to a monitoring service (like Sentry) in the future.
    // For now, we still log them to console so they are visible in dev and prod,
    // but without exposing sensitive payload data if possible.
    console.error(...args);
  },
  
  debug: (...args) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  }
};

export default logger;
