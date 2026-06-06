import { z } from "zod";

export const SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;

export const CATEGORIES = [
  "women",
  "children-0-6",
  "children-7-12",
  "children-13-plus",
] as const;

export const ProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Product name is required").max(200),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(5000),
  price: z.number().positive("Price must be positive"),
  category: z.enum(CATEGORIES),
  subcategory: z.string().optional(),
  sizes: z
    .array(z.enum(SIZES))
    .min(1, "At least one size required"),
  colors: z
    .array(z.string())
    .min(1, "At least one color required"),
  images: z
    .array(z.string().url("Invalid image URL"))
    .min(1, "At least one image required"),
  is_featured: z.boolean().default(false),
  is_on_sale: z.boolean().default(false),
  sale_price: z.number().positive().optional().nullable(),
  age_range: z
    .object({
      min: z.number().min(0).max(18),
      max: z.number().min(0).max(18),
    })
    .optional(),
});

export type Product = z.infer<typeof ProductSchema>;
