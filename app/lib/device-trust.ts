/**
 * Device trust management - silent fraud detection
 * 
 * How it works:
 * - Creates a fingerprint from browser characteristics (not PII)
 * - Tracks known devices per user
 * - Flags unusual access patterns
 * - No user action required unless anomaly detected
 */

import { createHash } from 'crypto';

export interface DeviceFingerprint {
  userAgent: string;
  language: string;
  platform: string;
  screenSize: string;
  timezone: string;
  colorDepth: number;
}

export interface TrustedDevice {
  id: string;
  fingerprint: string;
  firstSeen: Date;
  lastSeen: Date;
  lastIp: string;
  trusted: boolean;
}

/**
 * Generate a device fingerprint from browser characteristics
 * This is NOT personally identifiable - it's just for detecting new devices
 */
export function generateFingerprint(): DeviceFingerprint {
  if (typeof window === 'undefined') {
    return {
      userAgent: '',
      language: '',
      platform: '',
      screenSize: '',
      timezone: '',
      colorDepth: 0,
    };
  }

  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    screenSize: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    colorDepth: screen.colorDepth,
  };
}

/**
 * Create a hash from the fingerprint for storage
 */
export function hashFingerprint(fp: DeviceFingerprint): string {
  const data = `${fp.userAgent}|${fp.language}|${fp.platform}|${fp.screenSize}|${fp.timezone}|${fp.colorDepth}`;
  return createHash('sha256').update(data).digest('hex').substring(0, 32);
}

/**
 * Calculate trust score for a device (0-100)
 * Higher = more trusted
 */
export function calculateTrustScore(
  device: TrustedDevice | null,
  currentIp: string
): number {
  if (!device) {
    return 0; // New device
  }

  let score = 50; // Base score for known device

  // Bonus for long-standing device
  const daysSinceFirstSeen = Math.floor(
    (Date.now() - device.firstSeen.getTime()) / (1000 * 60 * 60 * 24)
  );
  score += Math.min(daysSinceFirstSeen * 2, 30); // Up to +30 for 15+ days

  // Penalty for IP change
  if (device.lastIp !== currentIp) {
    score -= 20;
  }

  // Bonus for recently used
  const hoursSinceLastSeen = Math.floor(
    (Date.now() - device.lastSeen.getTime()) / (1000 * 60 * 60)
  );
  if (hoursSinceLastSeen < 24) {
    score += 10;
  }

  // Explicitly trusted device
  if (device.trusted) {
    score += 20;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Determine if an action should be allowed silently or requires verification
 * Returns: 'allow' | 'verify' | 'block'
 */
export function assessRisk(
  deviceTrustScore: number,
  isSensitiveOperation: boolean
): 'allow' | 'verify' | 'block' {
  // High trust devices get everything
  if (deviceTrustScore >= 80) {
    return 'allow';
  }

  // Medium trust is fine for normal operations
  if (deviceTrustScore >= 40 && !isSensitiveOperation) {
    return 'allow';
  }

  // Low trust or sensitive ops need verification
  if (deviceTrustScore >= 20) {
    return 'verify'; // Send email/SMS verification
  }

  // Very low trust - block and alert
  return 'block';
}

/**
 * Store device info in localStorage (client-side only)
 * Used to remember "trusted" status
 */
export const deviceStorage = {
  getDeviceId(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('device_id');
  },

  setDeviceId(id: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('device_id', id);
  },

  isTrusted(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('device_trusted') === 'true';
  },

  setTrusted(trusted: boolean): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('device_trusted', trusted.toString());
  },
};
