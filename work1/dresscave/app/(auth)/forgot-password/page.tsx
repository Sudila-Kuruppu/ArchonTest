import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot Password — DressCave",
  description: "Reset your DressCave account password",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
