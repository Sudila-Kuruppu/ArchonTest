"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  CreateProductSchema,
  UpdateProductSchema,
  type CreateProductInput,
  type UpdateProductInput,
} from "@/lib/schemas/product";

export async function getProducts(search?: string) {
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select(
      `
      *,
      categories:category_id (
        name,
        slug
      )
    `,
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    return { success: false as const, error: error.message };
  }

  return { success: true as const, data };
}

export async function getProduct(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select(
      `
      *,
      categories:category_id (
        name,
        slug
      )
    `,
    )
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error) {
    return { success: false as const, error: error.message };
  }

  return { success: true as const, data };
}

export async function createProduct(formData: CreateProductInput) {
  const supabase = await createClient();

  const parsed = CreateProductSchema.safeParse(formData);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.issues.map((e: { message: string }) => e.message).join(", "),
    };
  }

  const { data, error } = await supabase
    .from("products")
    .insert({
      name: parsed.data.name,
      description: parsed.data.description,
      category_id: parsed.data.category_id,
      subcategory: parsed.data.subcategory || null,
      price: parsed.data.price,
      sizes: parsed.data.sizes,
      colors: parsed.data.colors,
      images: parsed.data.images,
      is_featured: parsed.data.is_featured,
      is_new_arrival: parsed.data.is_new_arrival,
      age_range: parsed.data.age_range || null,
    })
    .select()
    .single();

  if (error) {
    return { success: false as const, error: error.message };
  }

  revalidatePath("/admin/products");
  return { success: true as const, data };
}

export async function updateProduct(id: string, formData: UpdateProductInput) {
  const supabase = await createClient();

  const parsed = UpdateProductSchema.safeParse(formData);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.issues.map((e: { message: string }) => e.message).join(", "),
    };
  }

  const { data, error } = await supabase
    .from("products")
    .update({
      ...parsed.data,
      age_range: parsed.data.age_range ?? null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { success: false as const, error: error.message };
  }

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}/edit`);
  return { success: true as const, data };
}

export async function deleteProduct(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("products")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { success: false as const, error: error.message };
  }

  revalidatePath("/admin/products");
  return { success: true as const };
}

export async function setFeatured(id: string, isFeatured: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("products")
    .update({ is_featured: isFeatured })
    .eq("id", id);

  if (error) {
    return { success: false as const, error: error.message };
  }

  revalidatePath("/admin/products");
  return { success: true as const };
}

export async function setNewArrival(id: string, isNewArrival: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("products")
    .update({ is_new_arrival: isNewArrival })
    .eq("id", id);

  if (error) {
    return { success: false as const, error: error.message };
  }

  revalidatePath("/admin/products");
  return { success: true as const };
}

export async function uploadImage(productId: string, formData: FormData) {
  const supabase = await createClient();

  const file = formData.get("file") as File;
  if (!file) {
    return { success: false as const, error: "No file provided" };
  }

  // Validate file type
  if (!file.type.startsWith("image/")) {
    return { success: false as const, error: "File must be an image" };
  }

  // Generate unique file path
  const fileExt = file.name.split(".").pop() || "jpg";
  const filePath = `${productId}/${crypto.randomUUID()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("product-images")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    return { success: false as const, error: uploadError.message };
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from("product-images")
    .getPublicUrl(filePath);

  // Add image to product's images array
  const imageEntry = {
    url: urlData.publicUrl,
    is_primary: false,
    alt: file.name,
  };

  const { data: product } = await supabase
    .from("products")
    .select("images")
    .eq("id", productId)
    .single();

  if (product) {
    const currentImages = product.images || [];
    const updatedImages = [...currentImages, imageEntry];

    await supabase
      .from("products")
      .update({ images: updatedImages })
      .eq("id", productId);
  }

  revalidatePath(`/admin/products/${productId}/edit`);
  return { success: true as const, data: imageEntry };
}

export async function deleteImage(productId: string, imageUrl: string) {
  const supabase = await createClient();

  // Extract file path from URL
  const storageUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const publicPrefix = `${storageUrl}/storage/v1/object/public/product-images/`;
  const filePath = imageUrl.replace(publicPrefix, "");

  // Remove from storage
  if (filePath && filePath !== imageUrl) {
    await supabase.storage.from("product-images").remove([filePath]);
  }

  // Remove from product's images array
  const { data: product } = await supabase
    .from("products")
    .select("images")
    .eq("id", productId)
    .single();

  if (product) {
    const currentImages: any[] = product.images || [];
    const updatedImages = currentImages.filter(
      (img: any) => img.url !== imageUrl,
    );

    await supabase
      .from("products")
      .update({ images: updatedImages })
      .eq("id", productId);
  }

  revalidatePath(`/admin/products/${productId}/edit`);
  return { success: true as const };
}
