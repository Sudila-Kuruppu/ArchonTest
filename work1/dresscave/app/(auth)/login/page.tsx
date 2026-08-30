import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Log In — DressCave",
  description: "Log in to your DressCave account",
};

export default function LoginPage() {
  return <LoginForm />;
}
