/**
 * Postcode validation schemas.
 *
 * Used by the admin postcode density API routes.
 */

import { z } from 'zod';

/**
 * Normalise a raw UK postcode to uppercase with all whitespace removed.
 * Matches the normalisation applied in the DB RPC and in settings registration.
 */
export function normalisePostcode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '');
}

/** Schema for POST /api/admin/postcodes/toggle */
export const postcodeToggleSchema = z.object({
  postcode: z
    .string()
    .min(1, 'Postcode is required')
    .max(10, 'Postcode too long')
    .transform(normalisePostcode),
  enabled: z.boolean({ required_error: 'enabled is required' }),
  notes:   z.string().max(500, 'Notes must be 500 characters or fewer').optional(),
});

export type PostcodeToggleInput = z.infer<typeof postcodeToggleSchema>;
