import { z } from "zod";

export const CategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Category name is required").max(100),
  slug: z.string().min(1).max(120),
  parent_id: z.string().uuid().nullable().optional(),
  created_at: z.string().datetime(),
});

export const CreateCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(100),
  parent_id: z.string().uuid().optional().nullable(),
});

export const UpdateCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(100).optional(),
  parent_id: z.string().uuid().optional().nullable(),
});

export type Category = z.infer<typeof CategorySchema>;
export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;
