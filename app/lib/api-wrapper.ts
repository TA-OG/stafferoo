/**
 * API route wrappers with rate limiting and security headers
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIp, rateLimits, RateLimitConfig } from './rate-limit';

// Re-export rateLimits for convenience
export { rateLimits };

export interface ApiContext {
  request: NextRequest;
  requestId: string;
}

export type ApiHandler = (context: ApiContext) => Promise<Response>;

interface ApiWrapperOptions {
  rateLimit?: RateLimitConfig;
  requireAuth?: boolean;
}

/**
 * Security headers to add to all API responses
 */
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

/**
 * Wrap an API handler with rate limiting and security headers
 */
export function withRateLimit(
  handler: ApiHandler,
  options: ApiWrapperOptions = {}
): (request: NextRequest) => Promise<Response> {
  const { rateLimit } = options;

  return async (request: NextRequest): Promise<Response> => {
    const requestId = crypto.randomUUID();

    // Apply rate limiting if configured
    if (rateLimit) {
      const clientIp = getClientIp(request);
      const rateLimitResult = checkRateLimit(`${request.method}:${request.url}:${clientIp}`, rateLimit);

      if (!rateLimitResult.success) {
        const response = NextResponse.json(
          {
            ok: false,
            error: {
              code: 'RATE_LIMITED',
              message: 'Too many requests. Please try again later.',
              requestId,
            },
          },
          { status: 429 }
        );

        // Add rate limit headers
        response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
        response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
        response.headers.set('X-RateLimit-Reset', Math.ceil(rateLimitResult.reset / 1000).toString());
        response.headers.set('Retry-After', Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString());

        // Add security headers
        Object.entries(securityHeaders).forEach(([key, value]) => {
          response.headers.set(key, value);
        });

        return response;
      }
    }

    try {
      // Call the actual handler
      const response = await handler({ request, requestId });

      // Add security headers to successful responses
      if (response instanceof NextResponse) {
        Object.entries(securityHeaders).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      }

      return response;
    } catch (error) {
      console.error(`[API Error ${requestId}]`, error);

      const response = NextResponse.json(
        {
          ok: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred',
            requestId,
          },
        },
        { status: 500 }
      );

      Object.entries(securityHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      return response;
    }
  };
}

/**
 * Higher-order function for common API patterns
 */
export function createApiRoute(
  handler: (req: NextRequest, requestId: string) => Promise<Response>,
  options: ApiWrapperOptions = {}
) {
  return withRateLimit(
    async ({ request, requestId }) => handler(request, requestId),
    options
  );
}
