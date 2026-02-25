/**
 * Validation schemas for job postings
 */

import { z } from 'zod';

// Valid job roles for early years
export const jobRoles = [
  'nursery_practitioner',
  'senior_nursery_practitioner',
  'room_leader',
  'deputy_manager',
  'nursery_manager',
  'early_years_teacher',
  'supply_staff',
  'kitchen_staff',
  'cleaner',
] as const;

export type JobRole = typeof jobRoles[number];

export const jobRoleLabels: Record<JobRole, string> = {
  nursery_practitioner: 'Nursery Practitioner',
  senior_nursery_practitioner: 'Senior Nursery Practitioner',
  room_leader: 'Room Leader',
  deputy_manager: 'Deputy Manager',
  nursery_manager: 'Nursery Manager',
  early_years_teacher: 'Early Years Teacher',
  supply_staff: 'Supply Staff',
  kitchen_staff: 'Kitchen Staff',
  cleaner: 'Cleaner',
};

// Base job schema without refinements
const baseJobSchema = z.object({
  title: z.string()
    .min(5, 'Job title must be at least 5 characters')
    .max(100, 'Job title must be less than 100 characters'),
  
  description: z.string()
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description must be less than 2000 characters'),
  
  job_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  
  start_time: z.string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:MM format'),
  
  end_time: z.string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:MM format'),
  
  role_required: z.enum(jobRoles as unknown as [JobRole, ...JobRole[]]),
  
  hourly_rate: z.number()
    .min(15, 'Hourly rate must be at least £15')
    .max(50, 'Hourly rate must be less than £50'),
  
  postcode: z.string()
    .min(5, 'Postcode is required')
    .max(10, 'Postcode is too long'),
});

// Form validation schema with business logic refinements
export const createJobSchema = baseJobSchema
  .refine((data) => {
    // Check that end time is after start time
    const [startHour, startMin] = data.start_time.split(':').map(Number);
    const [endHour, endMin] = data.end_time.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    return endMinutes > startMinutes;
  }, {
    message: 'End time must be after start time',
    path: ['end_time'],
  })
  .refine((data) => {
    // Check job date is not in the past
    const jobDate = new Date(data.job_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return jobDate >= today;
  }, {
    message: 'Job date cannot be in the past',
    path: ['job_date'],
  });

export type CreateJobInput = z.infer<typeof createJobSchema>;

// API validation schema that transforms data for database
export const createJobApiSchema = baseJobSchema
  .refine((data) => {
    const [startHour, startMin] = data.start_time.split(':').map(Number);
    const [endHour, endMin] = data.end_time.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    return endMinutes > startMinutes;
  }, {
    message: 'End time must be after start time',
    path: ['end_time'],
  })
  .refine((data) => {
    const jobDate = new Date(data.job_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return jobDate >= today;
  }, {
    message: 'Job date cannot be in the past',
    path: ['job_date'],
  })
  .transform((data) => {
    const jobDate = new Date(data.job_date);
    const [startHour, startMin] = data.start_time.split(':').map(Number);
    const [endHour, endMin] = data.end_time.split(':').map(Number);
    
    // Create start and end timestamps
    const startTime = new Date(jobDate);
    startTime.setHours(startHour, startMin, 0, 0);
    
    const endTime = new Date(jobDate);
    endTime.setHours(endHour, endMin, 0, 0);
    
    // Calculate estimated total
    const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    const estimatedTotal = Math.round(hours * data.hourly_rate * 100) / 100;
    
    return {
      ...data,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      estimated_total: estimatedTotal,
    };
  });

export type CreateJobApiInput = z.infer<typeof createJobApiSchema>;
