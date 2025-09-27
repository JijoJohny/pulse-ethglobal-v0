import rateLimit from 'express-rate-limit';
import { logger } from './logger';

// Rate limiting configuration
const createRateLimit = (
  windowMs: number,
  max: number,
  message: string,
  skipSuccessfulRequests: boolean = false
) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: 'Too Many Requests',
      message,
      retryAfter: Math.ceil(windowMs / 1000),
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    handler: (req, res) => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
      });
      
      res.status(429).json({
        error: 'Too Many Requests',
        message,
        retryAfter: Math.ceil(windowMs / 1000),
        timestamp: new Date().toISOString(),
      });
    },
  });
};

// General API rate limiter (100 requests per 15 minutes)
export const generalLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requests
  'Too many requests from this IP, please try again later.',
  false
);

// Strict rate limiter for sensitive operations (10 requests per 15 minutes)
export const strictLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  10, // 10 requests
  'Too many requests from this IP, please try again later.',
  false
);

// Auth rate limiter (5 login attempts per 15 minutes)
export const authLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // 5 requests
  'Too many authentication attempts, please try again later.',
  true // Skip successful requests
);

// Position operations rate limiter (20 requests per minute)
export const positionLimiter = createRateLimit(
  60 * 1000, // 1 minute
  20, // 20 requests
  'Too many position operations, please slow down.',
  false
);

// Market operations rate limiter (30 requests per minute)
export const marketLimiter = createRateLimit(
  60 * 1000, // 1 minute
  30, // 30 requests
  'Too many market operations, please slow down.',
  false
);

// Analytics rate limiter (50 requests per 5 minutes)
export const analyticsLimiter = createRateLimit(
  5 * 60 * 1000, // 5 minutes
  50, // 50 requests
  'Too many analytics requests, please slow down.',
  false
);

// WebSocket connection rate limiter (10 connections per minute)
export const websocketLimiter = createRateLimit(
  60 * 1000, // 1 minute
  10, // 10 connections
  'Too many WebSocket connections, please try again later.',
  false
);

// Default rate limiter (used as fallback)
export const defaultLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  1000, // 1000 requests
  'Rate limit exceeded, please try again later.',
  false
);

// Export the main rate limiter (general limiter)
export const rateLimiter = generalLimiter;

// Helper function to create custom rate limiters
export const createCustomLimiter = (
  windowMs: number,
  max: number,
  message?: string
) => {
  return createRateLimit(
    windowMs,
    max,
    message || `Rate limit exceeded: ${max} requests per ${Math.ceil(windowMs / 1000)} seconds`,
    false
  );
};

// Rate limiter for specific endpoints
export const endpointLimiters = {
  '/api/markets': marketLimiter,
  '/api/positions': positionLimiter,
  '/api/analytics': analyticsLimiter,
  '/api/users': generalLimiter,
  '/api/auth': authLimiter,
};

// Function to get appropriate rate limiter for an endpoint
export const getLimiterForEndpoint = (path: string) => {
  for (const [endpoint, limiter] of Object.entries(endpointLimiters)) {
    if (path.startsWith(endpoint)) {
      return limiter;
    }
  }
  return defaultLimiter;
};