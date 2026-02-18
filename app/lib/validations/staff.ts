import { z } from 'zod';

// Step 2: Profile basics
export const staffProfileBasicsSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  national_insurance_number: z.string()
    .regex(/^[A-Z]{2}[0-9]{6}[A-Z]$/, 'Invalid NI number format (e.g., AB123456C)')
    .optional()
    .or(z.literal('')),
  date_of_birth: z.string().refine((val) => {
    if (!val) return false;
    const date = new Date(val);
    const age = (Date.now() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    return age >= 18 && age <= 75;
  }, 'Must be between 18 and 75 years old'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').max(15),
  address_line_1: z.string().min(5, 'Address is required'),
  address_line_2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  postcode: z.string()
    .min(5, 'Postcode is required')
    .max(10)
    .regex(/^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i, 'Invalid UK postcode format'),
  travel_radius_miles: z.number().int().min(1).max(50),
  transport_mode: z.enum(['car', 'public_transport', 'bicycle', 'walking']),
  years_experience: z.number().int().min(0).max(50),
  qualification_level: z.enum(['level_2', 'level_3', 'level_4_plus', 'unqualified']),
  criminal_conviction_declared: z.boolean(),
  criminal_conviction_details: z.string().optional(),
});

export type StaffProfileBasicsInput = z.infer<typeof staffProfileBasicsSchema>;

// Step 3: DBS and compliance
export const staffComplianceSchema = z.object({
  dbs_update_service: z.boolean().refine((val) => val === true, {
    message: 'You must subscribe to the DBS Update Service to continue',
  }),
  dbs_certificate_number: z.string().min(8, 'DBS certificate number is required'),
  dbs_issue_date: z.string().refine((val) => {
    if (!val) return false;
    const date = new Date(val);
    const monthsAgo = (Date.now() - date.getTime()) / (30.44 * 24 * 60 * 60 * 1000);
    return monthsAgo <= 36; // DBS must be within 3 years
  }, 'DBS certificate must be issued within the last 3 years'),
  dbs_surname_on_certificate: z.string().min(2, 'Surname on certificate is required'),
});

export type StaffComplianceInput = z.infer<typeof staffComplianceSchema>;

// Step 4: Health and safety
export const staffHealthSafetySchema = z.object({
  emergency_contact_1_name: z.string().min(2, 'Emergency contact name is required'),
  emergency_contact_1_phone: z.string().min(10, 'Emergency contact phone is required'),
  emergency_contact_1_relationship: z.string().min(2, 'Relationship is required'),
  emergency_contact_2_name: z.string().optional(),
  emergency_contact_2_phone: z.string().optional(),
  emergency_contact_2_relationship: z.string().optional(),
  gp_name: z.string().min(2, 'GP name is required'),
  gp_address: z.string().min(10, 'GP address is required'),
  health_declaration: z.object({
    conditions: z.array(z.string()),
    notes: z.string().optional(),
  }),
  smoking_declaration: z.enum(['non_smoker', 'smoker', 'ex_smoker']),
  drugs_alcohol_declaration: z.string().min(10, 'Declaration is required'),
  disqualified_person_declaration: z.boolean().refine((val) => val === false, {
    message: 'You must not be disqualified from working with children',
  }),
});

export type StaffHealthSafetyInput = z.infer<typeof staffHealthSafetySchema>;

// Step 5: Signature
export const staffSignatureSchema = z.object({
  digital_signature_svg: z.string().min(10, 'Signature is required'),
});

export type StaffSignatureInput = z.infer<typeof staffSignatureSchema>;

// Combined schema for validation on submit
export const staffOnboardingCompleteSchema = staffProfileBasicsSchema
  .merge(staffComplianceSchema)
  .merge(staffHealthSafetySchema)
  .merge(staffSignatureSchema);

export type StaffOnboardingCompleteInput = z.infer<typeof staffOnboardingCompleteSchema>;
