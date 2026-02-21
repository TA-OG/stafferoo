import { describe, it, expect } from 'vitest';
import { normalisePostcode, postcodeToggleSchema } from './postcode';

describe('normalisePostcode', () => {
  it('converts lowercase to uppercase', () => {
    expect(normalisePostcode('sw1a 1aa')).toBe('SW1A1AA');
  });

  it('removes internal spaces', () => {
    expect(normalisePostcode('SW1A 1AA')).toBe('SW1A1AA');
  });

  it('trims leading and trailing whitespace', () => {
    expect(normalisePostcode('  SW1A1AA  ')).toBe('SW1A1AA');
  });

  it('collapses multiple spaces', () => {
    expect(normalisePostcode('SW1A  1AA')).toBe('SW1A1AA');
  });

  it('passes through an already-normalised postcode unchanged', () => {
    expect(normalisePostcode('EC1A1BB')).toBe('EC1A1BB');
  });
});

describe('postcodeToggleSchema', () => {
  it('accepts a valid enable request', () => {
    const result = postcodeToggleSchema.safeParse({ postcode: 'SW1A 1AA', enabled: true });
    expect(result.success).toBe(true);
  });

  it('normalises postcode via transform on parse', () => {
    const result = postcodeToggleSchema.safeParse({ postcode: 'sw1a 1aa', enabled: false });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.postcode).toBe('SW1A1AA');
    }
  });

  it('accepts an optional notes field', () => {
    const result = postcodeToggleSchema.safeParse({
      postcode: 'SW1A1AA',
      enabled:  true,
      notes:    'Pilot area',
    });
    expect(result.success).toBe(true);
  });

  it('accepts a request without notes', () => {
    const result = postcodeToggleSchema.safeParse({ postcode: 'SW1A1AA', enabled: false });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.notes).toBeUndefined();
    }
  });

  it('rejects an empty postcode', () => {
    const result = postcodeToggleSchema.safeParse({ postcode: '', enabled: true });
    expect(result.success).toBe(false);
  });

  it('rejects a postcode longer than 10 characters', () => {
    const result = postcodeToggleSchema.safeParse({ postcode: 'TOOLONGCODE1', enabled: true });
    expect(result.success).toBe(false);
  });

  it('rejects a missing enabled field', () => {
    const result = postcodeToggleSchema.safeParse({ postcode: 'SW1A1AA' });
    expect(result.success).toBe(false);
  });

  it('rejects a non-boolean enabled field', () => {
    const result = postcodeToggleSchema.safeParse({ postcode: 'SW1A1AA', enabled: 'yes' });
    expect(result.success).toBe(false);
  });

  it('rejects notes exceeding 500 characters', () => {
    const result = postcodeToggleSchema.safeParse({
      postcode: 'SW1A1AA',
      enabled:  true,
      notes:    'x'.repeat(501),
    });
    expect(result.success).toBe(false);
  });
});
