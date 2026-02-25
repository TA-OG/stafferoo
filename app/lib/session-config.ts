/**
 * Smart session management - secure by default, low friction
 * 
 * Strategy:
 * - Long-lived sessions for read operations (30 days)
 * - Short-lived for sensitive operations (require re-auth)
 * - Sliding refresh (extend session on activity)
 * - Device trust (remember trusted devices longer)
 */

export const sessionConfig = {
  // Standard session - 30 days of inactivity
  // Users stay logged in for a month if they use the app regularly
  defaultSessionDuration: 30 * 24 * 60 * 60, // 30 days in seconds
  
  // Sliding window - extend session on activity
  slidingWindow: true,
  
  // Grace period for token refresh (5 minutes before expiry)
  refreshGracePeriod: 5 * 60, // 5 minutes
  
  // High-security operations that require fresh authentication
  sensitiveOperations: [
    '/api/admin/staff/approve',
    '/api/admin/staff/reject',
    '/api/admin/settings/verify',
    '/api/staff/profile/submit', // Final submission
    '/api/settings/register', // Business registration
  ],
  
  // Time since last auth required for sensitive operations (15 minutes)
  maxAgeForSensitiveOps: 15 * 60, // 15 minutes
} as const;

/**
 * Check if an operation requires fresh authentication
 */
export function requiresFreshAuth(path: string): boolean {
  return sessionConfig.sensitiveOperations.some(op => 
    path.toLowerCase().includes(op.toLowerCase())
  );
}

/**
 * Get session duration based on context
 */
export function getSessionDuration(isTrustedDevice: boolean = false): number {
  // Trusted devices get longer sessions
  if (isTrustedDevice) {
    return 60 * 24 * 60 * 60; // 60 days
  }
  return sessionConfig.defaultSessionDuration;
}
