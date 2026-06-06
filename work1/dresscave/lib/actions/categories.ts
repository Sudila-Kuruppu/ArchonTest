"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  CreateCategorySchema,
  UpdateCategorySchema,
  type CreateCategoryInput,
  type UpdateCategoryInput,
} from "@/lib/schemas/category";

export async function getCategories() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    return { success: false as const, error: error.message };
  }

  return { success: true as const, data };
}

export async function createCategory(formData: CreateCategoryInput) {
  const supabase = await createClient();

  const parsed = CreateCategorySchema.safeParse(formData);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.issues.map((e: { message: string }) => e.message).join(", "),
    };
  }

  // Generate slug from name
  const slug = parsed.data.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const { data, error } = await supabase
    .from("categories")
    .insert({
      name: parsed.data.name,
      slug,
      parent_id: parsed.data.parent_id || null,
    })
    .select()
    .single();

  if (error) {
    return { success: false as const, error: error.message };
  }

  revalidatePath("/admin/categories");
  return { success: true as const, data };
}

export async function updateCategory(
  id: string,
  formData: UpdateCategoryInput,
) {
  const supabase = await createClient();

  const parsed = UpdateCategorySchema.safeParse(formData);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.issues.map((e: { message: string }) => e.message).join(", "),
    };
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) {
    updateData.name = parsed.data.name;
    updateData.slug = parsed.data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }
  if (parsed.data.parent_id !== undefined) {
    updateData.parent_id = parsed.data.parent_id;
  }

  const { data, error } = await supabase
    .from("categories")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { success: false as const, error: error.message };
  }

  revalidatePath("/admin/categories");
  return { success: true as const, data };
}

export async function deleteCategory(id: string) {
  const supabase = await createClient();

  // Check if any products reference this category
  const { data: products, error: checkError } = await supabase
    .from("products")
    .select("id")
    .eq("category_id", id)
    .limit(1);

  if (checkError) {
    return { success: false as const, error: checkError.message };
  }

  if (products && products.length > 0) {
    return {
      success: false as const,
      error:
        "Cannot delete category with existing products. Reassign products first.",
    };
  }

  // Check if any subcategories reference this category
  const { data: subcategories, error: subError } = await supabase
    .from("categories")
    .select("id")
    .eq("parent_id", id)
    .limit(1);

  if (subError) {
    return { success: false as const, error: subError.message };
  }

  if (subcategories && subcategories.length > 0) {
    return {
      success: false as const,
      error:
        "Cannot delete category with subcategories. Remove subcategories first.",
    };
  }

  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) {
    return { success: false as const, error: error.message };
  }

  revalidatePath("/admin/categories");
  return { success: true as const };
}
