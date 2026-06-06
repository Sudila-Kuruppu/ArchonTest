"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
  ProfileUpdateSchema,
  type ProfileUpdateInput,
} from "@/lib/schemas/user";
import { updateProfile } from "@/lib/actions/auth";
import { Loader2Icon } from "lucide-react";

type ProfileFormProps = {
  defaultValues?: {
    full_name?: string;
    phone?: string | null;
    email?: string;
  };
};

export function ProfileForm({ defaultValues }: ProfileFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: zodResolver(ProfileUpdateSchema) as any,
    defaultValues: {
      full_name: defaultValues?.full_name || "",
      phone: defaultValues?.phone || "",
      communication_preferences: {
        email_offers: true,
        sms_offers: false,
      },
    },
  });

  const onSubmit = async (data: ProfileUpdateInput) => {
    setServerError(null);
    setSuccessMessage(null);

    const result = await updateProfile(data);

    if (result.success) {
      setSuccessMessage("Profile updated successfully");
    } else {
      setServerError(result.error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>
          Update your name, phone number, and communication preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {serverError}
            </div>
          )}
          {successMessage && (
            <div className="rounded-lg bg-primary/10 p-3 text-sm text-primary">
              {successMessage}
            </div>
          )}

          {defaultValues?.email && (
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                value={defaultValues.email}
                disabled
                className="opacity-60"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed here. Contact support to update your
                email address.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="full_name" className="text-sm font-medium">
              Full Name
            </label>
            <Input
              id="full_name"
              placeholder="Jane Doe"
              {...register("full_name")}
              aria-invalid={!!errors.full_name}
            />
            {errors.full_name && (
              <p className="text-xs text-destructive">
                {errors.full_name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="phone" className="text-sm font-medium">
              Phone Number
            </label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1 (555) 123-4567"
              {...register("phone")}
              aria-invalid={!!errors.phone}
            />
            {errors.phone && (
              <p className="text-xs text-destructive">
                {errors.phone.message}
              </p>
            )}
          </div>

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">
              Communication Preferences
            </legend>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                {...register("communication_preferences.email_offers")}
                className="size-4 rounded border-input text-primary focus:ring-ring"
              />
              Receive offers and updates via email
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                {...register("communication_preferences.sms_offers")}
                className="size-4 rounded border-input text-primary focus:ring-ring"
              />
              Receive offers via SMS
            </label>
          </fieldset>

          <Button type="submit" disabled={isSubmitting || !isDirty}>
            {isSubmitting ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
