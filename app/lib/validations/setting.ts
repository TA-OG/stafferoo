import { z } from 'zod';

/**
 * Validation schemas for setting profiles
 */

// Ofsted URN format: EY followed by 6 digits
const ofstedUrnRegex = /^EY\d{6}$/;

export const settingRegistrationSchema = z.object({
  setting_name: z.string().min(2, 'Setting name must be at least 2 characters').max(100),
  ofsted_urn: z.string().regex(ofstedUrnRegex, 'Ofsted URN must be in format EY123456'),
  ofsted_rating: z
    .enum(['Exceptional', 'Strong', 'Expected Standard', 'Needs Attention', 'Urgent Improvement'])
    .optional(),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').max(15),
  address_line_1: z.string().min(5, 'Address is required'),
  address_line_2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  postcode: z.string().min(5, 'Postcode is required').max(10),
  has_parking: z.boolean().default(false),
  number_of_children: z.number().int().positive().optional(),
  team_size: z.number().int().positive().optional(),
  operation_hours_start: z.string().optional(),
  operation_hours_end: z.string().optional(),
});

export type SettingRegistrationInput = z.infer<typeof settingRegistrationSchema>;

export const settingVerificationSchema = z.object({
  setting_id: z.string().uuid(),
  action: z.enum(['approve', 'reject']),
  notes: z.string().optional(),
});

export type SettingVerificationInput = z.infer<typeof settingVerificationSchema>;

export const settingProfileUpdateSchema = z.object({
  phone: z.string().min(10, 'Phone number must be at least 10 digits').max(15),
  operation_hours_start: z.string().optional(),
  operation_hours_end: z.string().optional(),
  number_of_children: z.number().int().positive().optional().nullable(),
  team_size: z.number().int().positive().optional().nullable(),
  has_parking: z.boolean(),
});

export type SettingProfileUpdateInput = z.infer<typeof settingProfileUpdateSchema>;
