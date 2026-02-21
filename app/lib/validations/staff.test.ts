import { describe, it, expect } from 'vitest';
import {
  staffProfileBasicsSchema,
  staffComplianceSchema,
  staffHealthSafetySchema,
  staffSignatureSchema,
  staffVerificationSchema,
} from './staff';

describe('Staff validation schemas', () => {
  describe('staffProfileBasicsSchema', () => {
    it('should accept valid profile data', () => {
      const validData = {
        full_name: 'John Smith',
        national_insurance_number: 'AB123456C',
        date_of_birth: '1990-01-15',
        phone: '07700900123',
        address_line_1: '123 High Street',
        city: 'London',
        postcode: 'SW1A 1AA',
        travel_radius_miles: 15,
        transport_mode: 'public_transport' as const,
        years_experience: 5,
        qualification_level: 'level_3' as const,
        criminal_conviction_declared: false,
      };

      const result = staffProfileBasicsSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid postcode format', () => {
      const invalidData = {
        full_name: 'John Smith',
        date_of_birth: '1990-01-15',
        phone: '07700900123',
        address_line_1: '123 High Street',
        city: 'London',
        postcode: 'INVALID',
        travel_radius_miles: 15,
        transport_mode: 'public_transport' as const,
        years_experience: 5,
        qualification_level: 'level_3' as const,
        criminal_conviction_declared: false,
      };

      const result = staffProfileBasicsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject age under 18', () => {
      const invalidData = {
        full_name: 'John Smith',
        date_of_birth: new Date(Date.now() - 15 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        phone: '07700900123',
        address_line_1: '123 High Street',
        city: 'London',
        postcode: 'SW1A 1AA',
        travel_radius_miles: 15,
        transport_mode: 'public_transport' as const,
        years_experience: 5,
        qualification_level: 'level_3' as const,
        criminal_conviction_declared: false,
      };

      const result = staffProfileBasicsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('staffComplianceSchema', () => {
    it('should accept valid DBS data', () => {
      const validData = {
        dbs_update_service: true,
        dbs_certificate_number: '001234567890',
        dbs_issue_date: '2024-01-15',
        dbs_surname_on_certificate: 'Smith',
      };

      const result = staffComplianceSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject if DBS Update Service not subscribed', () => {
      const invalidData = {
        dbs_update_service: false,
        dbs_certificate_number: '001234567890',
        dbs_issue_date: '2024-01-15',
        dbs_surname_on_certificate: 'Smith',
      };

      const result = staffComplianceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject DBS older than 3 years', () => {
      const invalidData = {
        dbs_update_service: true,
        dbs_certificate_number: '001234567890',
        dbs_issue_date: '2020-01-15',
        dbs_surname_on_certificate: 'Smith',
      };

      const result = staffComplianceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('staffHealthSafetySchema', () => {
    it('should accept valid health and safety data', () => {
      const validData = {
        emergency_contact_1_name: 'Jane Smith',
        emergency_contact_1_phone: '07700900456',
        emergency_contact_1_relationship: 'Spouse',
        gp_name: 'Dr. Sarah Johnson',
        gp_address: '456 Medical Centre, London',
        health_declaration: {
          has_disability:      false,
          needs_adjustments:   false,
          has_health_concerns: false,
          notes:               '',
        },
        smoking_declaration: 'non_smoker' as const,
        drugs_alcohol_declaration: false,
        disqualified_person_declaration: false,
      };

      const result = staffHealthSafetySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept data even when declarations are true (hard stop enforced at UI/submit layer)', () => {
      // The schema accepts any boolean — enforcement of disqualification and
      // drugs/alcohol hard stops is done in the UI (disabled button) and the
      // final submit route, not at the Zod schema level.
      const data = {
        emergency_contact_1_name: 'Jane Smith',
        emergency_contact_1_phone: '07700900456',
        emergency_contact_1_relationship: 'Spouse',
        gp_name: 'Dr. Sarah Johnson',
        gp_address: '456 Medical Centre, London',
        health_declaration: {
          has_disability:      true,
          needs_adjustments:   true,
          has_health_concerns: true,
          notes:               'Details here',
        },
        smoking_declaration: 'non_smoker' as const,
        drugs_alcohol_declaration: true,
        disqualified_person_declaration: true,
      };

      const result = staffHealthSafetySchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject missing required emergency contact fields', () => {
      const invalidData = {
        emergency_contact_1_name: '',
        emergency_contact_1_phone: '07700900456',
        emergency_contact_1_relationship: 'Spouse',
        gp_name: 'Dr. Sarah Johnson',
        gp_address: '456 Medical Centre, London',
        health_declaration: {
          has_disability:      false,
          needs_adjustments:   false,
          has_health_concerns: false,
        },
        smoking_declaration: 'non_smoker' as const,
        drugs_alcohol_declaration: false,
        disqualified_person_declaration: false,
      };

      const result = staffHealthSafetySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('staffSignatureSchema', () => {
    it('should accept valid signature', () => {
      const validData = {
        digital_signature_svg: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA',
      };

      const result = staffSignatureSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty signature', () => {
      const invalidData = {
        digital_signature_svg: '',
      };

      const result = staffSignatureSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('staffVerificationSchema', () => {
    it('should accept valid verification action', () => {
      const validData = {
        staff_id: '123e4567-e89b-12d3-a456-426614174000',
        action: 'approve' as const,
        notes: 'All checks passed',
      };

      const result = staffVerificationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID', () => {
      const invalidData = {
        staff_id: 'not-a-uuid',
        action: 'approve' as const,
      };

      const result = staffVerificationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid action', () => {
      const invalidData = {
        staff_id: '123e4567-e89b-12d3-a456-426614174000',
        action: 'invalid',
      };

      const result = staffVerificationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
