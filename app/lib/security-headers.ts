/**
 * Security headers configuration
 * All applied automatically - zero user friction
 */

export const securityHeaders = {
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',
  
  // Enable XSS protection in browsers
  'X-XSS-Protection': '1; mode=block',
  
  // Control referrer information
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permissions policy (what browser features can be used)
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=(self)', // Allow geolocation for staff check-in
    'payment=()',
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
    'accelerometer=()',
  ].join(', '),
  
  // Strict Transport Security (force HTTPS)
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
};

/**
 * Content Security Policy
 * Prevents XSS and data injection attacks
 */
export const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' blob: data: https://*.supabase.co;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://*.supabase.co https://api.resend.com;
  frame-ancestors 'none';
  form-action 'self';
  base-uri 'self';
  upgrade-insecure-requests;
`.replace(/\s+/g, ' ').trim();

/**
 * Apply security headers to a response
 */
export function applySecurityHeaders(response: Response): Response {
  // Apply standard security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  // Apply CSP
  response.headers.set('Content-Security-Policy', cspHeader);
  
  return response;
}

/**
 * Secure cookie defaults
 */
export const secureCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 30, // 30 days
  path: '/',
};
