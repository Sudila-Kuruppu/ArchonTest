import { describe, it, expect } from "vitest";
import {
  ProductSchema,
  CreateProductSchema,
  UpdateProductSchema,
  SIZES,
  CATEGORIES,
} from "@/lib/schemas/product";
import {
  CategorySchema,
  CreateCategorySchema,
} from "@/lib/schemas/category";

const validProductData = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  name: "Classic Fit T-Shirt",
  description: "A comfortable cotton t-shirt perfect for everyday wear.",
  category_id: "123e4567-e89b-12d3-a456-426614174001",
  price: 29.99,
  sizes: ["S", "M", "L"] as ("S" | "M" | "L")[],
  colors: ["Black", "White"],
  images: [{ url: "https://example.com/image.jpg", is_primary: false }],
  is_featured: true,
  is_new_arrival: false,
  is_on_sale: false,
};

const validCreateData = {
  name: "Classic Fit T-Shirt",
  description: "A comfortable cotton t-shirt perfect for everyday wear.",
  category_id: "123e4567-e89b-12d3-a456-426614174001",
  price: 29.99,
  sizes: ["S", "M", "L"] as ("S" | "M" | "L")[],
  colors: ["Black", "White"],
};

const validCategoryData = {
  id: "123e4567-e89b-12d3-a456-426614174002",
  name: "Women",
  slug: "women",
  created_at: "2026-01-01T00:00:00.000Z",
};

describe("ProductSchema", () => {
  it("accepts valid full product data", () => {
    const result = ProductSchema.safeParse(validProductData);
    expect(result.success).toBe(true);
  });

  it("accepts product data with deleted_at", () => {
    const result = ProductSchema.safeParse({
      ...validProductData,
      deleted_at: "2026-06-01T00:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });

  it("accepts product data with optional age_range", () => {
    const result = ProductSchema.safeParse({
      ...validProductData,
      age_range: { min: 3, max: 6 },
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing name", () => {
    const result = ProductSchema.safeParse({
      ...validProductData,
      name: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative price", () => {
    const result = ProductSchema.safeParse({
      ...validProductData,
      price: -10,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid UUID for category_id", () => {
    const result = ProductSchema.safeParse({
      ...validProductData,
      category_id: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty sizes array", () => {
    const result = ProductSchema.safeParse({
      ...validProductData,
      sizes: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty description", () => {
    const result = ProductSchema.safeParse({
      ...validProductData,
      description: "short",
    });
    expect(result.success).toBe(false);
  });
});

describe("CreateProductSchema", () => {
  it("accepts valid create data", () => {
    const result = CreateProductSchema.safeParse(validCreateData);
    expect(result.success).toBe(true);
  });

  it("defaults images to empty array when not provided", () => {
    const result = CreateProductSchema.safeParse(validCreateData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.images).toEqual([]);
    }
  });

  it("rejects missing name", () => {
    const result = CreateProductSchema.safeParse({
      ...validCreateData,
      name: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative price", () => {
    const result = CreateProductSchema.safeParse({
      ...validCreateData,
      price: -5,
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty sizes", () => {
    const result = CreateProductSchema.safeParse({
      ...validCreateData,
      sizes: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty colors", () => {
    const result = CreateProductSchema.safeParse({
      ...validCreateData,
      colors: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-array sizes", () => {
    const result = CreateProductSchema.safeParse({
      ...validCreateData,
      sizes: "S",
    });
    expect(result.success).toBe(false);
  });
});

describe("UpdateProductSchema", () => {
  it("accepts partial update with name only", () => {
    const result = UpdateProductSchema.safeParse({
      name: "Updated T-Shirt",
    });
    expect(result.success).toBe(true);
  });

  it("accepts full update", () => {
    const result = UpdateProductSchema.safeParse({
      name: "Updated T-Shirt",
      price: 39.99,
      is_featured: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid field type (string for price)", () => {
    const result = UpdateProductSchema.safeParse({
      price: "not-a-number",
    });
    expect(result.success).toBe(false);
  });

  it("accepts empty update object", () => {
    const result = UpdateProductSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts null for age_range", () => {
    const result = UpdateProductSchema.safeParse({
      age_range: null,
    });
    expect(result.success).toBe(true);
  });
});

describe("SIZES and CATEGORIES constants", () => {
  it("exports SIZES with correct values", () => {
    expect(SIZES).toEqual(["XS", "S", "M", "L", "XL", "XXL"]);
  });

  it("exports CATEGORIES with correct values", () => {
    expect(CATEGORIES).toEqual([
      "women",
      "children-0-6",
      "children-7-12",
      "children-13-plus",
    ]);
  });
});

describe("CategorySchema", () => {
  it("accepts valid category data", () => {
    const result = CategorySchema.safeParse(validCategoryData);
    expect(result.success).toBe(true);
  });

  it("rejects missing name", () => {
    const result = CategorySchema.safeParse({
      ...validCategoryData,
      name: "",
    });
    expect(result.success).toBe(false);
  });

  it("accepts category with parent_id", () => {
    const result = CategorySchema.safeParse({
      ...validCategoryData,
      parent_id: "123e4567-e89b-12d3-a456-426614174003",
    });
    expect(result.success).toBe(true);
  });
});

describe("CreateCategorySchema", () => {
  it("accepts category without parent_id", () => {
    const result = CreateCategorySchema.safeParse({
      name: "Kids",
    });
    expect(result.success).toBe(true);
  });

  it("accepts category with parent_id", () => {
    const result = CreateCategorySchema.safeParse({
      name: "Tops",
      parent_id: "123e4567-e89b-12d3-a456-426614174002",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = CreateCategorySchema.safeParse({
      name: "",
    });
    expect(result.success).toBe(false);
  });
});
