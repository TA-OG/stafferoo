import { z } from 'zod';

const ALLOWED_DOC_TYPES = [
  'dbs_certificate',
  'safeguarding_certificate',
  'paediatric_first_aid',
  'right_to_work',
  'qualification_certificate',
] as const;

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const createUploadSchema = z.object({
  doc_type: z.enum(ALLOWED_DOC_TYPES),
  filename: z.string().min(1).max(255),
  mime_type: z.enum(ALLOWED_MIME_TYPES),
  size_bytes: z.number().int().positive().max(MAX_FILE_SIZE, 'File size must be under 10MB'),
});

export type CreateUploadInput = z.infer<typeof createUploadSchema>;

export const confirmUploadSchema = z.object({
  doc_type: z.enum(ALLOWED_DOC_TYPES),
  storage_path: z.string().min(1),
  original_filename: z.string().min(1).max(255),
  mime_type: z.enum(ALLOWED_MIME_TYPES),
  size_bytes: z.number().int().positive(),
});

export type ConfirmUploadInput = z.infer<typeof confirmUploadSchema>;
