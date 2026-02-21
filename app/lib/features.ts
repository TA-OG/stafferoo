/**
 * Feature flags
 *
 * Flags are read from environment variables at runtime so they can be toggled
 * without a rebuild. All risky/new features default to disabled.
 *
 * Usage (server):
 *   import { features } from '@/app/lib/features';
 *   if (!features.references) return jsonError(404, 'FEATURE_DISABLED', '...');
 *
 * Usage (client):
 *   Use the NEXT_PUBLIC_ variants so they are inlined at build time for UI.
 */

function flag(envVar: string, defaultValue = false): boolean {
  const val = process.env[envVar];
  if (val === undefined || val === '') return defaultValue;
  return val === '1' || val.toLowerCase() === 'true';
}

export const features = {
  /** Staff references capture + referee link workflow. */
  references: flag('FEATURE_REFERENCES', false),
} as const;

export type FeatureKey = keyof typeof features;
