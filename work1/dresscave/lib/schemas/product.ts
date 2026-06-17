import { z } from "zod";

export const SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;

export const CATEGORIES = [
  "women",
  "children-0-6",
  "children-7-12",
  "children-13-plus",
] as const;

export const ImageEntrySchema = z.object({
  url: z.string().url("Invalid image URL"),
  is_primary: z.boolean().default(false),
  alt: z.string().optional(),
});

export const ProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Product name is required").max(200),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(5000),
  category_id: z.string().uuid("Category is required"),
  subcategory: z.string().optional(),
  price: z.number().positive("Price must be positive"),
  sizes: z
    .array(z.enum(SIZES))
    .min(1, "At least one size required"),
  colors: z
    .array(z.string())
    .min(1, "At least one color required"),
  images: z
    .array(ImageEntrySchema)
    .default([]),
  is_featured: z.boolean().default(false),
  is_new_arrival: z.boolean().default(false),
  is_on_sale: z.boolean().default(false),
  sale_price: z.number().positive().optional().nullable(),
  age_range: z
    .object({
      min: z.number().min(0).max(18),
      max: z.number().min(0).max(18),
    })
    .optional(),
  deleted_at: z.string().datetime().nullable().optional(),
});

export const CreateProductSchema = z.object({
  name: z.string().min(1, "Product name is required").max(200),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(5000),
  category_id: z.string().uuid("Category is required"),
  subcategory: z.string().optional(),
  price: z.number().positive("Price must be positive"),
  sizes: z
    .array(z.enum(SIZES))
    .min(1, "At least one size required"),
  colors: z
    .array(z.string())
    .min(1, "At least one color required"),
  images: z
    .array(ImageEntrySchema)
    .optional()
    .default([]),
  is_featured: z.boolean().default(false),
  is_new_arrival: z.boolean().default(false),
  is_on_sale: z.boolean().default(false),
  sale_price: z.number().positive().optional().nullable(),
  age_range: z
    .object({
      min: z.number().min(0).max(18),
      max: z.number().min(0).max(18),
    })
    .optional(),
});

export const UpdateProductSchema = z.object({
  name: z.string().min(1, "Product name is required").max(200).optional(),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(5000)
    .optional(),
  category_id: z.string().uuid("Category is required").optional(),
  subcategory: z.string().optional(),
  price: z.number().positive("Price must be positive").optional(),
  sizes: z
    .array(z.enum(SIZES))
    .min(1, "At least one size required")
    .optional(),
  colors: z
    .array(z.string())
    .min(1, "At least one color required")
    .optional(),
  images: z
    .array(ImageEntrySchema)
    .optional(),
  is_featured: z.boolean().optional(),
  is_new_arrival: z.boolean().optional(),
  is_on_sale: z.boolean().optional(),
  sale_price: z.number().positive().optional().nullable(),
  age_range: z
    .object({
      min: z.number().min(0).max(18),
      max: z.number().min(0).max(18),
    })
    .optional()
    .nullable(),
});

export type Product = z.infer<typeof ProductSchema>;
export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
export type ImageEntry = z.infer<typeof ImageEntrySchema>;
