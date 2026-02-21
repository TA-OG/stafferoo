/**
 * Tests for app/lib/validations/references.ts
 *
 * Coverage:
 *  - isFreeEmailDomain / extractEmailDomain helpers
 *  - professionalReferenceSchema  (work email + URN required)
 *  - personalReferenceSchema      (any valid email)
 *  - sendReferencesSchema         (combined)
 *  - refereeAnswersSchema         (questionnaire)
 *  - generateReferenceToken       (format + uniqueness)
 *  - hashReferenceToken           (deterministic SHA-256, format)
 */

import { describe, it, expect } from 'vitest';
import {
  FREE_EMAIL_DOMAINS,
  isFreeEmailDomain,
  extractEmailDomain,
  professionalReferenceSchema,
  personalReferenceSchema,
  sendReferencesSchema,
  refereeAnswersSchema,
  generateReferenceToken,
  hashReferenceToken,
} from './references';

// ---------------------------------------------------------------------------
// isFreeEmailDomain
// ---------------------------------------------------------------------------

describe('isFreeEmailDomain', () => {
  it('returns true for every domain in FREE_EMAIL_DOMAINS', () => {
    for (const domain of FREE_EMAIL_DOMAINS) {
      expect(isFreeEmailDomain(domain)).toBe(true);
    }
  });

  it('is case-insensitive', () => {
    expect(isFreeEmailDomain('Gmail.COM')).toBe(true);
    expect(isFreeEmailDomain('HOTMAIL.COM')).toBe(true);
  });

  it('returns false for work / institutional domains', () => {
    expect(isFreeEmailDomain('sunshinenursery.co.uk')).toBe(false);
    expect(isFreeEmailDomain('ofsted.gov.uk')).toBe(false);
    expect(isFreeEmailDomain('nhs.net')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isFreeEmailDomain('')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// extractEmailDomain
// ---------------------------------------------------------------------------

describe('extractEmailDomain', () => {
  it('extracts the domain correctly', () => {
    expect(extractEmailDomain('user@example.com')).toBe('example.com');
    expect(extractEmailDomain('manager@nursery.co.uk')).toBe('nursery.co.uk');
  });

  it('lowercases the domain', () => {
    expect(extractEmailDomain('User@GMAIL.COM')).toBe('gmail.com');
  });

  it('returns empty string for malformed email', () => {
    expect(extractEmailDomain('notanemail')).toBe('');
    expect(extractEmailDomain('')).toBe('');
  });

  it('handles multiple @ signs by taking the last part', () => {
    // lastIndexOf('@') picks the last @ so "a@b@c.com" → "c.com"
    expect(extractEmailDomain('a@b@c.com')).toBe('c.com');
  });
});

// ---------------------------------------------------------------------------
// professionalReferenceSchema
// ---------------------------------------------------------------------------

describe('professionalReferenceSchema', () => {
  const valid = {
    referee_name:     'Jane Smith',
    referee_position: 'Room Leader',
    referee_email:    'jane@sunshinenursery.co.uk',
    setting_urn:      '123456',
    setting_name:     'Sunshine Day Nursery',
  };

  it('accepts a valid professional reference', () => {
    expect(professionalReferenceSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts EY-prefixed URNs', () => {
    expect(
      professionalReferenceSchema.safeParse({ ...valid, setting_urn: 'EY123456' }).success
    ).toBe(true);
  });

  it('rejects free/personal email providers', () => {
    const result = professionalReferenceSchema.safeParse({
      ...valid,
      referee_email: 'jane@gmail.com',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msg = result.error.issues[0].message;
      expect(msg).toMatch(/work email/i);
    }
  });

  it('rejects missing referee_name', () => {
    const result = professionalReferenceSchema.safeParse({ ...valid, referee_name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects missing referee_position', () => {
    const result = professionalReferenceSchema.safeParse({ ...valid, referee_position: '' });
    expect(result.success).toBe(false);
  });

  it('rejects missing setting_urn', () => {
    const result = professionalReferenceSchema.safeParse({ ...valid, setting_urn: '' });
    expect(result.success).toBe(false);
  });

  it('rejects malformed URN (letters only)', () => {
    const result = professionalReferenceSchema.safeParse({ ...valid, setting_urn: 'ABCDEF' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msg = result.error.issues[0].message;
      expect(msg).toMatch(/URN/i);
    }
  });

  it('rejects URN that is too short (< 6 digits)', () => {
    const result = professionalReferenceSchema.safeParse({ ...valid, setting_urn: '12345' });
    expect(result.success).toBe(false);
  });

  it('rejects missing setting_name', () => {
    const result = professionalReferenceSchema.safeParse({ ...valid, setting_name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email format', () => {
    const result = professionalReferenceSchema.safeParse({
      ...valid,
      referee_email: 'not-an-email',
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// personalReferenceSchema
// ---------------------------------------------------------------------------

describe('personalReferenceSchema', () => {
  const valid = {
    referee_name:     'Bob Jones',
    referee_email:    'bob@gmail.com',
  };

  it('accepts a valid personal reference', () => {
    expect(personalReferenceSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts free email providers (personal ref has no domain restriction)', () => {
    expect(
      personalReferenceSchema.safeParse({ ...valid, referee_email: 'bob@hotmail.co.uk' }).success
    ).toBe(true);
  });

  it('accepts an optional referee_position', () => {
    expect(
      personalReferenceSchema.safeParse({ ...valid, referee_position: 'Family friend' }).success
    ).toBe(true);
  });

  it('rejects missing referee_name', () => {
    expect(personalReferenceSchema.safeParse({ ...valid, referee_name: '' }).success).toBe(false);
  });

  it('rejects invalid email', () => {
    expect(
      personalReferenceSchema.safeParse({ ...valid, referee_email: 'bad-email' }).success
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// sendReferencesSchema
// ---------------------------------------------------------------------------

describe('sendReferencesSchema', () => {
  const validBody = {
    professional: {
      referee_name:     'Jane Smith',
      referee_position: 'Manager',
      referee_email:    'jane@nursery.co.uk',
      setting_urn:      '654321',
      setting_name:     'Bright Futures Nursery',
    },
    personal: {
      referee_name:  'Bob Jones',
      referee_email: 'bob@gmail.com',
    },
  };

  it('accepts a valid body', () => {
    expect(sendReferencesSchema.safeParse(validBody).success).toBe(true);
  });

  it('rejects when professional is missing', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { professional, ...rest } = validBody;
    expect(sendReferencesSchema.safeParse(rest).success).toBe(false);
  });

  it('rejects when personal is missing', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { personal, ...rest } = validBody;
    expect(sendReferencesSchema.safeParse(rest).success).toBe(false);
  });

  it('propagates professional email domain error', () => {
    const result = sendReferencesSchema.safeParse({
      ...validBody,
      professional: { ...validBody.professional, referee_email: 'jane@yahoo.com' },
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// refereeAnswersSchema
// ---------------------------------------------------------------------------

describe('refereeAnswersSchema', () => {
  const valid = {
    confirmed_name:        'Jane Smith',
    confirmed_position:    'Room Leader',
    known_applicant_since: '3 years',
    reliability:           'excellent',
    punctuality:           'good',
    safeguarding_concerns: false,
    eligible_for_rehire:   true,
  };

  it('accepts valid answers', () => {
    expect(refereeAnswersSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts optional comments', () => {
    expect(
      refereeAnswersSchema.safeParse({ ...valid, comments: 'A wonderful candidate.' }).success
    ).toBe(true);
  });

  it('rejects invalid reliability enum value', () => {
    const result = refereeAnswersSchema.safeParse({ ...valid, reliability: 'outstanding' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/reliability/i);
    }
  });

  it('rejects invalid punctuality enum value', () => {
    const result = refereeAnswersSchema.safeParse({ ...valid, punctuality: 'n/a' });
    expect(result.success).toBe(false);
  });

  it('rejects non-boolean safeguarding_concerns', () => {
    const result = refereeAnswersSchema.safeParse({
      ...valid,
      safeguarding_concerns: 'no',
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-boolean eligible_for_rehire', () => {
    const result = refereeAnswersSchema.safeParse({
      ...valid,
      eligible_for_rehire: 1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing confirmed_name', () => {
    const result = refereeAnswersSchema.safeParse({ ...valid, confirmed_name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects missing known_applicant_since', () => {
    const result = refereeAnswersSchema.safeParse({ ...valid, known_applicant_since: '' });
    expect(result.success).toBe(false);
  });

  it('rejects comments exceeding 2000 characters', () => {
    const result = refereeAnswersSchema.safeParse({
      ...valid,
      comments: 'x'.repeat(2001),
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// generateReferenceToken
// ---------------------------------------------------------------------------

describe('generateReferenceToken', () => {
  it('returns a 64-character hex string', () => {
    const token = generateReferenceToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it('generates unique tokens on each call', () => {
    const tokens = new Set(Array.from({ length: 20 }, () => generateReferenceToken()));
    expect(tokens.size).toBe(20);
  });
});

// ---------------------------------------------------------------------------
// hashReferenceToken
// ---------------------------------------------------------------------------

describe('hashReferenceToken', () => {
  it('returns a 64-character hex string', async () => {
    const hash = await hashReferenceToken('abc123');
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('is deterministic — same input gives same hash', async () => {
    const token = generateReferenceToken();
    const h1 = await hashReferenceToken(token);
    const h2 = await hashReferenceToken(token);
    expect(h1).toBe(h2);
  });

  it('produces different hashes for different tokens', async () => {
    const h1 = await hashReferenceToken(generateReferenceToken());
    const h2 = await hashReferenceToken(generateReferenceToken());
    expect(h1).not.toBe(h2);
  });

  it('the hash is not equal to the raw token', async () => {
    const token = generateReferenceToken();
    const hash = await hashReferenceToken(token);
    expect(hash).not.toBe(token);
  });

  it('matches the known SHA-256 of "hello"', async () => {
    // SHA-256("hello") = 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824
    const hash = await hashReferenceToken('hello');
    expect(hash).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
  });
});
