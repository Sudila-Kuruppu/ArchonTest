import { z } from "zod";

export const CustomMeasurementSchema = z.object({
  chest: z.number().positive().optional(),
  waist: z.number().positive().optional(),
  hips: z.number().positive().optional(),
  inseam: z.number().positive().optional(),
  height: z.number().positive().optional(),
  weight: z.number().positive().optional(),
  notes: z.string().max(500).optional(),
});

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email("Invalid email address"),
  full_name: z.string().min(1, "Full name is required").max(200),
  phone: z.string().optional(),
  avatar_url: z.string().url().optional().nullable(),
  custom_measurements: CustomMeasurementSchema.optional(),
  created_at: z.date().default(() => new Date()),
  updated_at: z.date().default(() => new Date()),
});

export type User = z.infer<typeof UserSchema>;
export type CustomMeasurement = z.infer<typeof CustomMeasurementSchema>;
