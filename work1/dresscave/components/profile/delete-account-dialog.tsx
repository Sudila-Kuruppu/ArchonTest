"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AccountDeletionSchema,
  type AccountDeletionInput,
} from "@/lib/schemas/user";
import { deleteAccount } from "@/lib/actions/auth";
import { Loader2Icon, Trash2Icon, AlertTriangleIcon } from "lucide-react";

export function DeleteAccountDialog() {
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(AccountDeletionSchema) as any,
    defaultValues: {
      password: "",
      confirmation: "" as const,
    },
  });

  const onSubmit = async (data: AccountDeletionInput) => {
    setServerError(null);

    const result = await deleteAccount({
      password: data.password,
    });

    if (!result.success) {
      setServerError(result.error);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      reset();
      setServerError(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger>
        <Button variant="destructive" className="w-full sm:w-auto">
          <Trash2Icon className="size-4" />
          Delete Account
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete your account</DialogTitle>
          <DialogDescription>
            This action is permanent and cannot be undone. Your account and
            personal data will be scheduled for deletion within 30 days in
            accordance with our privacy policy.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <div className="flex items-start gap-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          <div className="rounded-lg bg-muted p-4 text-sm">
            <p className="font-medium text-foreground">What happens next:</p>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-muted-foreground">
              <li>Your account will be immediately deactivated</li>
              <li>Your personal data will be queued for deletion</li>
              <li>Order history will be anonymized</li>
              <li>Saved measurements will be permanently deleted</li>
              <li>You will receive a confirmation email</li>
            </ul>
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Enter your password to confirm
            </label>
            <Input
              id="password"
              type="password"
              placeholder="Your current password"
              {...register("password")}
              aria-invalid={!!errors.password}
            />
            {errors.password && (
              <p className="text-xs text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmation" className="text-sm font-medium">
              Type &ldquo;I understand&rdquo; to confirm
            </label>
            <Input
              id="confirmation"
              placeholder='Type "I understand"'
              {...register("confirmation")}
              aria-invalid={!!errors.confirmation}
            />
            {errors.confirmation && (
              <p className="text-xs text-destructive">
                {errors.confirmation.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="submit"
              variant="destructive"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Permanently delete my account"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
