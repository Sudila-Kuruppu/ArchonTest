import { z } from "zod";

/* ─── Shared ─── */

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[A-Z]/, "Password must contain an uppercase letter");

/* ─── Custom Measurement ─── */

export const CustomMeasurementSchema = z.object({
  chest: z.number().positive().optional(),
  waist: z.number().positive().optional(),
  hips: z.number().positive().optional(),
  inseam: z.number().positive().optional(),
  height: z.number().positive().optional(),
  weight: z.number().positive().optional(),
  notes: z.string().max(500).optional(),
});

export const MeasurementProfileSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().max(100).optional(),
  unit: z.enum(["cm", "inches"]).default("cm"),
  measurements: CustomMeasurementSchema,
});

/* ─── User ─── */

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email("Invalid email address"),
  full_name: z.string().min(1, "Full name is required").max(200),
  phone: z.string().optional(),
  avatar_url: z.string().url().optional().nullable(),
  custom_measurements: CustomMeasurementSchema.optional(),
  measurement_profiles: z.array(MeasurementProfileSchema).optional(),
  communication_preferences: z
    .object({
      email_offers: z.boolean().default(true),
      sms_offers: z.boolean().default(false),
    })
    .optional(),
  created_at: z.date().default(() => new Date()),
  updated_at: z.date().default(() => new Date()),
});

/* ─── Auth Schemas ─── */

export const SignupSchema = z
  .object({
    full_name: z.string().min(1, "Full name is required").max(200),
    email: z.string().email("Invalid email address"),
    password: passwordSchema,
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const ResetPasswordSchema = z
  .object({
    new_password: passwordSchema,
    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export const ProfileUpdateSchema = z.object({
  full_name: z.string().min(1, "Full name is required").max(200).optional(),
  phone: z
    .string()
    .regex(/^\+?[\d\s\-()]{7,20}$/, "Invalid phone number")
    .optional()
    .nullable()
    .or(z.literal("")),
  avatar_url: z.string().url().optional().nullable(),
  communication_preferences: z
    .object({
      email_offers: z.boolean(),
      sms_offers: z.boolean(),
    })
    .optional(),
});

export const AccountDeletionSchema = z.object({
  password: z.string().min(1, "Password is required to delete your account"),
  confirmation: z.string().min(1, "Please type 'I understand' to confirm"),
});

/* ─── Inferred Types ─── */

export type User = z.infer<typeof UserSchema>;
export type CustomMeasurement = z.infer<typeof CustomMeasurementSchema>;
export type MeasurementProfile = z.infer<typeof MeasurementProfileSchema>;
export type SignupInput = z.infer<typeof SignupSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type ProfileUpdateInput = z.infer<typeof ProfileUpdateSchema>;
export type AccountDeletionInput = z.infer<typeof AccountDeletionSchema>;
