/**
 * Zod schemas and helpers for the staff references workflow.
 *
 * Key design decisions:
 * - FREE_EMAIL_DOMAINS is the central blocklist; extend here to block domains.
 * - Professional email must NOT be from a free provider.
 * - Professional reference requires setting URN.
 * - Personal reference may use any validated email.
 * - Token validation is at the API layer, not in these schemas.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Free / personal email domain blocklist
// Extend this array to block additional domains — one source of truth.
// ---------------------------------------------------------------------------
export const FREE_EMAIL_DOMAINS: ReadonlyArray<string> = [
  'gmail.com',
  'googlemail.com',
  'hotmail.com',
  'hotmail.co.uk',
  'outlook.com',
  'live.com',
  'live.co.uk',
  'msn.com',
  'yahoo.com',
  'yahoo.co.uk',
  'yandex.com',
  'gmx.com',
  'aol.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'proton.me',
  'protonmail.com',
  'zoho.com',
  'mail.com',
  'fastmail.com',
  'fastmail.fm',
  'tutanota.com',
  'tutanota.de',
  'hey.com',
  'pm.me',
];

const FREE_EMAIL_SET = new Set(FREE_EMAIL_DOMAINS);

/**
 * Returns true when the domain is a known free / personal email provider.
 * Domain matching is case-insensitive.
 */
export function isFreeEmailDomain(domain: string): boolean {
  return FREE_EMAIL_SET.has(domain.toLowerCase().trim());
}

/**
 * Extracts the domain part from an email address.
 * Returns empty string if the email is malformed.
 */
export function extractEmailDomain(email: string): string {
  const idx = email.lastIndexOf('@');
  if (idx < 0) return '';
  return email.slice(idx + 1).toLowerCase().trim();
}

// ---------------------------------------------------------------------------
// Zod helpers
// ---------------------------------------------------------------------------

/** Any valid email. */
const emailSchema = z
  .string()
  .email('Please enter a valid email address')
  .max(254);

/** Email that must NOT be from a free provider (professional refs). */
const professionalEmailSchema = emailSchema.refine(
  (email) => !isFreeEmailDomain(extractEmailDomain(email)),
  {
    message:
      'The professional reference email must be a work email address, not a personal email provider (e.g. Gmail, Hotmail, Yahoo).',
  }
);

// ---------------------------------------------------------------------------
// Reference sub-schemas
// ---------------------------------------------------------------------------

export const professionalReferenceSchema = z.object({
  referee_name:     z.string().min(2, 'Referee full name is required').max(100),
  referee_position: z.string().min(2, 'Referee job title is required').max(100),
  referee_email:    professionalEmailSchema,
  setting_urn:      z.string()
    .min(1, 'Ofsted URN is required for a professional reference')
    .max(20)
    .regex(/^\d{6,9}$|^EY\d{6,9}$/i, 'URN should be a 6-9 digit number or start with EY'),
  setting_name:     z.string().min(2, 'Setting name is required').max(200),
});

export type ProfessionalReferenceInput = z.infer<typeof professionalReferenceSchema>;

export const personalReferenceSchema = z.object({
  referee_name:     z.string().min(2, 'Referee full name is required').max(100),
  referee_position: z.string().max(100).optional(),
  referee_email:    emailSchema,
  /** Optional — only relevant when the personal referee works at an Ofsted setting. */
  setting_urn:      z
    .string()
    .max(20)
    .refine(
      (v) => v === '' || /^\d{6,9}$|^EY\d{6,9}$/i.test(v),
      'URN should be a 6–9 digit number or start with EY'
    )
    .optional(),
});

export type PersonalReferenceInput = z.infer<typeof personalReferenceSchema>;

/** Body sent to POST /api/staff/onboarding/references/send */
export const sendReferencesSchema = z.object({
  professional: professionalReferenceSchema,
  personal:     personalReferenceSchema,
});

export type SendReferencesInput = z.infer<typeof sendReferencesSchema>;

// ---------------------------------------------------------------------------
// Referee questionnaire answer schema
// Used to validate POST /api/r/reference/[token]/submit
// ---------------------------------------------------------------------------

export const refereeAnswersSchema = z.object({
  confirmed_name:        z.string().min(2, 'Please confirm your name').max(100),
  confirmed_position:    z.string().min(2, 'Please confirm your job title').max(100),
  known_applicant_since: z.string().min(4, 'Please state how long you have known the applicant').max(200),
  reliability:           z.enum(['excellent', 'good', 'satisfactory', 'poor'], {
    errorMap: () => ({ message: 'Please rate reliability' }),
  }),
  punctuality:           z.enum(['excellent', 'good', 'satisfactory', 'poor'], {
    errorMap: () => ({ message: 'Please rate punctuality' }),
  }),
  safeguarding_concerns: z.boolean({
    required_error: 'Please answer the safeguarding question',
  }),
  eligible_for_rehire:   z.boolean({
    required_error: 'Please answer the rehire eligibility question',
  }),
  comments:              z.string().max(2000).optional(),
});

export type RefereeAnswersInput = z.infer<typeof refereeAnswersSchema>;

/** Body sent to POST /api/r/reference/[token]/submit */
export const submitReferenceSchema = z.object({
  answers: refereeAnswersSchema,
});

export type SubmitReferenceInput = z.infer<typeof submitReferenceSchema>;

// ---------------------------------------------------------------------------
// Token helpers (application layer — not Zod)
// ---------------------------------------------------------------------------

/** Raw token byte length — 32 bytes → 256 bits of entropy. */
const TOKEN_BYTES = 32;

/** Default expiry in milliseconds (14 days). */
export const TOKEN_EXPIRY_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * Generates a cryptographically random URL-safe token (hex string).
 * The raw token is included in the referee link and MUST NOT be stored.
 */
export function generateReferenceToken(): string {
  const bytes = new Uint8Array(TOKEN_BYTES);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Hashes a raw token with SHA-256 and returns the hex digest.
 * This is what is stored in the database.
 */
export async function hashReferenceToken(rawToken: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(rawToken);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
