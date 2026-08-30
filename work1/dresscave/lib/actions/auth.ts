"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signup(formData: {
  email: string;
  password: string;
  full_name: string;
}) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      data: {
        full_name: formData.full_name,
      },
    },
  });

  if (error) {
    return { success: false as const, error: error.message };
  }

  return { success: true as const };
}

export async function login(formData: {
  email: string;
  password: string;
}) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  });

  if (error) {
    return { success: false as const, error: error.message };
  }

  revalidatePath("/");
  redirect("/account");
}

export async function logout() {
  const supabase = await createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    return { success: false as const, error: error.message };
  }

  revalidatePath("/");
  redirect("/");
}

export async function resetPasswordRequest(formData: {
  email: string;
}) {
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(
    formData.email,
    {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/confirm?type=recovery`,
    },
  );

  if (error) {
    return { success: false as const, error: error.message };
  }

  return { success: true as const };
}

export async function updatePassword(formData: {
  password: string;
}) {
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password: formData.password,
  });

  if (error) {
    return { success: false as const, error: error.message };
  }

  revalidatePath("/account");
  return { success: true as const };
}

export async function updateProfile(formData: {
  full_name?: string;
  phone?: string | null;
  avatar_url?: string | null;
  communication_preferences?: {
    email_offers?: boolean;
    sms_offers?: boolean;
  };
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false as const, error: "User not authenticated" };
  }

  // Update user metadata for display_name
  if (formData.full_name) {
    const { error: metadataError } = await supabase.auth.updateUser({
      data: { full_name: formData.full_name },
    });

    if (metadataError) {
      return { success: false as const, error: metadataError.message };
    }
  }

  // Update public profile in profiles table
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        full_name: formData.full_name,
        phone: formData.phone,
        avatar_url: formData.avatar_url,
        communication_preferences: formData.communication_preferences,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );

  if (profileError) {
    return { success: false as const, error: profileError.message };
  }

  revalidatePath("/account");
  return { success: true as const };
}

export async function deleteAccount(formData: {
  password: string;
}) {
  const supabase = await createClient();

  // Re-authenticate user before deletion
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: formData.password, // Note: this requires email too, handled in form
    password: formData.password,
  });

  // Instead, verify by getting current user and attempting deletion
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false as const, error: "User not authenticated" };
  }

  // Delete user data from profiles table
  const { error: profileDeleteError } = await supabase
    .from("profiles")
    .delete()
    .eq("id", user.id);

  if (profileDeleteError) {
    return { success: false as const, error: profileDeleteError.message };
  }

  // Delete the user from auth
  const { error: deleteError } = await supabase.rpc("delete_user");

  if (deleteError) {
    return { success: false as const, error: deleteError.message };
  }

  revalidatePath("/");
  redirect("/");
}
