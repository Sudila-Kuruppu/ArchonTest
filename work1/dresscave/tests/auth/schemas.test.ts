import { describe, it, expect } from "vitest";
import {
  SignupSchema,
  LoginSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  ProfileUpdateSchema,
  AccountDeletionSchema,
  CustomMeasurementSchema,
} from "@/lib/schemas/user";

describe("SignupSchema", () => {
  it("accepts valid signup data", () => {
    const result = SignupSchema.safeParse({
      full_name: "Jane Doe",
      email: "jane@example.com",
      password: "Password123",
      confirm_password: "Password123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    const result = SignupSchema.safeParse({
      full_name: "Jane Doe",
      email: "jane@example.com",
      password: "Password123",
      confirm_password: "Different123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short password", () => {
    const result = SignupSchema.safeParse({
      full_name: "Jane Doe",
      email: "jane@example.com",
      password: "Short1A",
      confirm_password: "Short1A",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password without uppercase", () => {
    const result = SignupSchema.safeParse({
      full_name: "Jane Doe",
      email: "jane@example.com",
      password: "password123",
      confirm_password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = SignupSchema.safeParse({
      full_name: "Jane Doe",
      email: "not-an-email",
      password: "Password123",
      confirm_password: "Password123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty full_name", () => {
    const result = SignupSchema.safeParse({
      full_name: "",
      email: "jane@example.com",
      password: "Password123",
      confirm_password: "Password123",
    });
    expect(result.success).toBe(false);
  });
});

describe("LoginSchema", () => {
  it("accepts valid login data", () => {
    const result = LoginSchema.safeParse({
      email: "jane@example.com",
      password: "mypassword",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing password", () => {
    const result = LoginSchema.safeParse({
      email: "jane@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = LoginSchema.safeParse({
      email: "invalid",
      password: "mypassword",
    });
    expect(result.success).toBe(false);
  });
});

describe("ForgotPasswordSchema", () => {
  it("accepts valid email", () => {
    const result = ForgotPasswordSchema.safeParse({
      email: "jane@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty email", () => {
    const result = ForgotPasswordSchema.safeParse({
      email: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("ResetPasswordSchema", () => {
  it("accepts matching passwords", () => {
    const result = ResetPasswordSchema.safeParse({
      new_password: "NewPass123",
      confirm_password: "NewPass123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    const result = ResetPasswordSchema.safeParse({
      new_password: "NewPass123",
      confirm_password: "Different456",
    });
    expect(result.success).toBe(false);
  });
});

describe("ProfileUpdateSchema", () => {
  it("accepts partial update with full_name only", () => {
    const result = ProfileUpdateSchema.safeParse({
      full_name: "Jane Smith",
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty phone", () => {
    const result = ProfileUpdateSchema.safeParse({
      phone: "",
    });
    expect(result.success).toBe(true);
  });

  it("accepts communication preferences", () => {
    const result = ProfileUpdateSchema.safeParse({
      communication_preferences: {
        email_offers: false,
        sms_offers: true,
      },
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty full_name", () => {
    const result = ProfileUpdateSchema.safeParse({
      full_name: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("AccountDeletionSchema", () => {
  it("accepts valid deletion data", () => {
    const result = AccountDeletionSchema.safeParse({
      password: "mypassword",
      confirmation: "I understand",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty password", () => {
    const result = AccountDeletionSchema.safeParse({
      password: "",
      confirmation: "I understand",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty confirmation", () => {
    const result = AccountDeletionSchema.safeParse({
      password: "mypassword",
      confirmation: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("CustomMeasurementSchema", () => {
  it("accepts valid measurements", () => {
    const result = CustomMeasurementSchema.safeParse({
      chest: 90,
      waist: 75,
      hips: 95,
      inseam: 80,
      height: 170,
      weight: 65,
      notes: "Standard fit",
    });
    expect(result.success).toBe(true);
  });

  it("accepts partial measurements", () => {
    const result = CustomMeasurementSchema.safeParse({
      chest: 90,
      waist: 75,
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative measurements", () => {
    const result = CustomMeasurementSchema.safeParse({
      chest: -10,
    });
    expect(result.success).toBe(false);
  });

  it("rejects notes exceeding 500 characters", () => {
    const result = CustomMeasurementSchema.safeParse({
      notes: "x".repeat(501),
    });
    expect(result.success).toBe(false);
  });
});
