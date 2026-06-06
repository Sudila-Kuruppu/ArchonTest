import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/profile/profile-form";

export const metadata: Metadata = {
  title: "Account Settings — DressCave",
  description: "Update your profile and communication preferences",
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const defaultValues = user
    ? {
        full_name: user.user_metadata?.full_name as string | undefined,
        email: user.email,
        phone: user.user_metadata?.phone as string | null | undefined,
      }
    : undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Account Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Update your profile information and communication preferences
        </p>
      </div>
      <ProfileForm defaultValues={defaultValues} />
    </div>
  );
}
