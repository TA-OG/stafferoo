import { describe, it, expect } from 'vitest';
import {
  settingRegistrationSchema,
  settingVerificationSchema,
  settingProfileUpdateSchema,
} from './setting';

// ── settingRegistrationSchema ─────────────────────────────────────────────────

describe('settingRegistrationSchema', () => {
  const validBase = {
    setting_name: 'Happy Days Nursery',
    ofsted_urn: 'EY123456',
    email: 'contact@happydays.co.uk',
    phone: '01234567890',
    address_line_1: '123 Main Street',
    city: 'London',
    postcode: 'SW1A 1AA',
    has_parking: false,
  };

  it('accepts a fully populated valid registration', () => {
    const result = settingRegistrationSchema.safeParse({
      ...validBase,
      ofsted_rating: 'Outstanding',
      address_line_2: 'Suite 1',
      has_parking: true,
      number_of_children: 30,
      team_size: 8,
      operation_hours_start: '07:30',
      operation_hours_end: '18:30',
    });
    expect(result.success).toBe(true);
  });

  it('accepts a minimal valid registration (optional fields omitted)', () => {
    const result = settingRegistrationSchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });

  // setting_name
  it('rejects setting_name shorter than 2 characters', () => {
    const result = settingRegistrationSchema.safeParse({ ...validBase, setting_name: 'X' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const field = result.error.flatten().fieldErrors.setting_name;
      expect(field).toBeDefined();
    }
  });

  it('rejects setting_name longer than 100 characters', () => {
    const result = settingRegistrationSchema.safeParse({
      ...validBase,
      setting_name: 'A'.repeat(101),
    });
    expect(result.success).toBe(false);
  });

  // ofsted_urn
  it('rejects Ofsted URN without EY prefix', () => {
    const result = settingRegistrationSchema.safeParse({ ...validBase, ofsted_urn: '123456' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.ofsted_urn).toBeDefined();
    }
  });

  it('rejects Ofsted URN with fewer than 6 digits after EY', () => {
    const result = settingRegistrationSchema.safeParse({ ...validBase, ofsted_urn: 'EY12345' });
    expect(result.success).toBe(false);
  });

  it('rejects Ofsted URN with more than 6 digits after EY', () => {
    const result = settingRegistrationSchema.safeParse({ ...validBase, ofsted_urn: 'EY1234567' });
    expect(result.success).toBe(false);
  });

  it('rejects Ofsted URN with letters in digit portion', () => {
    const result = settingRegistrationSchema.safeParse({ ...validBase, ofsted_urn: 'EY12345A' });
    expect(result.success).toBe(false);
  });

  it('accepts all valid Ofsted ratings', () => {
    const ratings = ['Outstanding', 'Good', 'Requires Improvement', 'Inadequate'] as const;
    for (const rating of ratings) {
      const result = settingRegistrationSchema.safeParse({ ...validBase, ofsted_rating: rating });
      expect(result.success).toBe(true);
    }
  });

  it('rejects an unrecognised Ofsted rating', () => {
    const result = settingRegistrationSchema.safeParse({
      ...validBase,
      ofsted_rating: 'Satisfactory',
    });
    expect(result.success).toBe(false);
  });

  // email
  it('rejects an invalid email address', () => {
    const result = settingRegistrationSchema.safeParse({ ...validBase, email: 'not-an-email' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.email).toBeDefined();
    }
  });

  // phone
  it('rejects phone shorter than 10 digits', () => {
    const result = settingRegistrationSchema.safeParse({ ...validBase, phone: '012345' });
    expect(result.success).toBe(false);
  });

  it('rejects phone longer than 15 characters', () => {
    const result = settingRegistrationSchema.safeParse({ ...validBase, phone: '0'.repeat(16) });
    expect(result.success).toBe(false);
  });

  // address_line_1
  it('rejects address_line_1 shorter than 5 characters', () => {
    const result = settingRegistrationSchema.safeParse({ ...validBase, address_line_1: '123' });
    expect(result.success).toBe(false);
  });

  // city
  it('rejects city shorter than 2 characters', () => {
    const result = settingRegistrationSchema.safeParse({ ...validBase, city: 'X' });
    expect(result.success).toBe(false);
  });

  // postcode
  it('rejects postcode shorter than 5 characters', () => {
    const result = settingRegistrationSchema.safeParse({ ...validBase, postcode: 'SW1' });
    expect(result.success).toBe(false);
  });

  it('rejects postcode longer than 10 characters', () => {
    // 11 characters — one over the max(10) limit
    const result = settingRegistrationSchema.safeParse({ ...validBase, postcode: 'SW1A 1AAAAA' });
    expect(result.success).toBe(false);
  });

  // number_of_children / team_size
  it('rejects non-positive number_of_children', () => {
    const result = settingRegistrationSchema.safeParse({
      ...validBase,
      number_of_children: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-positive team_size', () => {
    const result = settingRegistrationSchema.safeParse({ ...validBase, team_size: -1 });
    expect(result.success).toBe(false);
  });

  it('rejects fractional number_of_children', () => {
    const result = settingRegistrationSchema.safeParse({
      ...validBase,
      number_of_children: 30.5,
    });
    expect(result.success).toBe(false);
  });

  // has_parking default
  it('defaults has_parking to false when omitted', () => {
    const withoutParking = {
      setting_name: validBase.setting_name,
      ofsted_urn: validBase.ofsted_urn,
      email: validBase.email,
      phone: validBase.phone,
      address_line_1: validBase.address_line_1,
      city: validBase.city,
      postcode: validBase.postcode,
    };
    const result = settingRegistrationSchema.safeParse(withoutParking);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.has_parking).toBe(false);
    }
  });
});

// ── settingVerificationSchema ─────────────────────────────────────────────────

describe('settingVerificationSchema', () => {
  const validSettingId = '550e8400-e29b-41d4-a716-446655440000';

  it('accepts an approve action with no notes', () => {
    const result = settingVerificationSchema.safeParse({
      setting_id: validSettingId,
      action: 'approve',
    });
    expect(result.success).toBe(true);
  });

  it('accepts a reject action with notes', () => {
    const result = settingVerificationSchema.safeParse({
      setting_id: validSettingId,
      action: 'reject',
      notes: 'Ofsted URN not found in register',
    });
    expect(result.success).toBe(true);
  });

  it('accepts an approve action with notes', () => {
    const result = settingVerificationSchema.safeParse({
      setting_id: validSettingId,
      action: 'approve',
      notes: 'All checks passed',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid setting_id (not a UUID)', () => {
    const result = settingVerificationSchema.safeParse({
      setting_id: 'not-a-uuid',
      action: 'approve',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.setting_id).toBeDefined();
    }
  });

  it('rejects a missing setting_id', () => {
    const result = settingVerificationSchema.safeParse({ action: 'approve' });
    expect(result.success).toBe(false);
  });

  it('rejects an unrecognised action', () => {
    const result = settingVerificationSchema.safeParse({
      setting_id: validSettingId,
      action: 'suspend',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.action).toBeDefined();
    }
  });

  it('rejects a missing action', () => {
    const result = settingVerificationSchema.safeParse({ setting_id: validSettingId });
    expect(result.success).toBe(false);
  });
});

// ── settingProfileUpdateSchema ────────────────────────────────────────────────

describe('settingProfileUpdateSchema', () => {
  const validBase = {
    phone: '01234567890',
    has_parking: false,
  };

  it('accepts a minimal valid update (phone + has_parking only)', () => {
    const result = settingProfileUpdateSchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });

  it('accepts a fully populated valid update', () => {
    const result = settingProfileUpdateSchema.safeParse({
      phone: '07700900123',
      operation_hours_start: '07:30',
      operation_hours_end: '18:30',
      number_of_children: 40,
      team_size: 10,
      has_parking: true,
    });
    expect(result.success).toBe(true);
  });

  it('accepts null for number_of_children and team_size (clearing the fields)', () => {
    const result = settingProfileUpdateSchema.safeParse({
      ...validBase,
      number_of_children: null,
      team_size: null,
    });
    expect(result.success).toBe(true);
  });

  it('rejects phone shorter than 10 digits', () => {
    const result = settingProfileUpdateSchema.safeParse({ ...validBase, phone: '012345' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.phone).toBeDefined();
    }
  });

  it('rejects phone longer than 15 characters', () => {
    const result = settingProfileUpdateSchema.safeParse({ ...validBase, phone: '0'.repeat(16) });
    expect(result.success).toBe(false);
  });

  it('rejects missing phone', () => {
    const result = settingProfileUpdateSchema.safeParse({ has_parking: false });
    expect(result.success).toBe(false);
  });

  it('rejects missing has_parking', () => {
    const result = settingProfileUpdateSchema.safeParse({ phone: '01234567890' });
    expect(result.success).toBe(false);
  });

  it('rejects non-positive number_of_children', () => {
    const result = settingProfileUpdateSchema.safeParse({
      ...validBase,
      number_of_children: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects fractional team_size', () => {
    const result = settingProfileUpdateSchema.safeParse({
      ...validBase,
      team_size: 4.5,
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative team_size', () => {
    const result = settingProfileUpdateSchema.safeParse({
      ...validBase,
      team_size: -3,
    });
    expect(result.success).toBe(false);
  });

  it('preserves existing optional hours when not supplied', () => {
    const result = settingProfileUpdateSchema.safeParse(validBase);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.operation_hours_start).toBeUndefined();
      expect(result.data.operation_hours_end).toBeUndefined();
    }
  });
});
