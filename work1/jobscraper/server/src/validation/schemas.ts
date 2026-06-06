import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const searchSchema = z.object({
  q: z.string().min(1, 'Keyword is required'),
  location: z.string().min(1, 'Location is required'),
});

export const saveJobSchema = z.object({
  board: z.string().min(1),
  jobId: z.string().min(1),
  title: z.string().min(1),
  company: z.string().min(1),
  location: z.string().optional().default(''),
  url: z.string().optional().default(''),
  description: z.string().optional().default(''),
  postedAt: z.string().optional().default(''),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
export type SaveJobInput = z.infer<typeof saveJobSchema>;
