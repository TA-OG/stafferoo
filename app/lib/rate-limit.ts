/**
 * Rate limiting utilities for API routes
 * 
 * Uses in-memory store with IP-based tracking.
 * For production scale, upgrade to Redis-based implementation.
 */

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  maxRequests: number;
  /** Time window in seconds */
  windowSeconds: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store - clears on deploy/restart
// For production: replace with Redis
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
if (typeof globalThis !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetTime <= now) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Check rate limit for a given identifier (IP, user ID, etc.)
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = { maxRequests: 100, windowSeconds: 60 }
): RateLimitResult {
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  const key = identifier;

  const entry = rateLimitStore.get(key);

  // No entry or expired - create new
  if (!entry || entry.resetTime <= now) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + windowMs,
    };
    rateLimitStore.set(key, newEntry);
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      reset: newEntry.resetTime,
    };
  }

  // Entry exists and valid - check limit
  if (entry.count >= config.maxRequests) {
    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      reset: entry.resetTime,
    };
  }

  // Under limit - increment
  entry.count++;
  return {
    success: true,
    limit: config.maxRequests,
    remaining: config.maxRequests - entry.count,
    reset: entry.resetTime,
  };
}

/**
 * Get client IP from request
 * Handles X-Forwarded-For header for proxied requests
 */
export function getClientIp(request: Request): string {
  // Try X-Forwarded-For first (for proxied requests)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  // Fall back to other headers
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Last resort - use a default (should not happen in production)
  return 'unknown';
}

// Pre-configured rate limits for different endpoints
export const rateLimits = {
  // Strict limits for auth endpoints
  auth: { maxRequests: 5, windowSeconds: 60 },
  // Medium limits for API mutations
  apiMutation: { maxRequests: 30, windowSeconds: 60 },
  // Relaxed limits for read operations
  apiRead: { maxRequests: 100, windowSeconds: 60 },
  // Very strict for admin operations
  admin: { maxRequests: 50, windowSeconds: 60 },
} as const;
