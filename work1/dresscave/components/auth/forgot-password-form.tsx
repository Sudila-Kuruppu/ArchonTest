"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ForgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/lib/schemas/user";
import { resetPasswordRequest } from "@/lib/actions/auth";
import { Loader2Icon, ArrowLeftIcon, CheckCircle2Icon } from "lucide-react";

export function ForgotPasswordForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(ForgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setServerError(null);

    const result = await resetPasswordRequest({
      email: data.email,
    });

    if (result.success) {
      setEmailSent(true);
    } else {
      setServerError(result.error);
    }
  };

  if (emailSent) {
    return (
      <Card size="sm" className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            If an account exists with that email, we&apos;ve sent a password
            reset link.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 py-6">
          <CheckCircle2Icon className="size-12 text-primary" />
          <p className="text-center text-sm text-muted-foreground">
            Click the link in the email to reset your password. The link expires
            in 1 hour.
          </p>
        </CardContent>
        <CardFooter className="justify-center">
          <Link
            href="/login"
            className="flex items-center gap-2 text-sm font-medium text-foreground underline underline-offset-3 hover:text-primary"
          >
            <ArrowLeftIcon className="size-4" />
            Back to login
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card size="sm" className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Reset your password</CardTitle>
        <CardDescription>
          Enter your email and we&apos;ll send you a reset link
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {serverError}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="jane@example.com"
              {...register("email")}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="text-xs text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                Sending...
              </>
            ) : (
              "Send reset link"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <Link
          href="/login"
          className="flex items-center gap-2 text-sm font-medium text-foreground underline underline-offset-3 hover:text-primary"
        >
          <ArrowLeftIcon className="size-4" />
          Back to login
        </Link>
      </CardFooter>
    </Card>
  );
}
