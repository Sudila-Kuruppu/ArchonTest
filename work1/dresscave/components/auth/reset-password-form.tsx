"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ResetPasswordSchema,
  type ResetPasswordInput,
} from "@/lib/schemas/user";
import { updatePassword } from "@/lib/actions/auth";
import { EyeIcon, EyeOffIcon, Loader2Icon } from "lucide-react";

export function ResetPasswordForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(ResetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    setServerError(null);

    const result = await updatePassword({
      password: data.new_password,
    });

    if (result.success) {
      router.push("/login");
    } else {
      setServerError(result.error);
    }
  };

  return (
    <Card size="sm" className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Set new password</CardTitle>
        <CardDescription>
          Enter your new password below
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
            <label htmlFor="new_password" className="text-sm font-medium">
              New Password
            </label>
            <div className="relative">
              <Input
                id="new_password"
                type={showPassword ? "text" : "password"}
                placeholder="Min. 8 characters"
                {...register("new_password")}
                aria-invalid={!!errors.new_password}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOffIcon className="size-4" />
                ) : (
                  <EyeIcon className="size-4" />
                )}
              </button>
            </div>
            {errors.new_password && (
              <p className="text-xs text-destructive">
                {errors.new_password.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="confirm_password" className="text-sm font-medium">
              Confirm New Password
            </label>
            <Input
              id="confirm_password"
              type="password"
              placeholder="Repeat your new password"
              {...register("confirm_password")}
              aria-invalid={!!errors.confirm_password}
            />
            {errors.confirm_password && (
              <p className="text-xs text-destructive">
                {errors.confirm_password.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                Resetting password...
              </>
            ) : (
              "Reset password"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
