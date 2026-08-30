"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Loader2Icon,
  PlusIcon,
  XIcon,
  AlertTriangleIcon,
} from "lucide-react";
import {
  CreateProductSchema,
  UpdateProductSchema,
  SIZES,
  type Product,
  type CreateProductInput,
  type UpdateProductInput,
} from "@/lib/schemas/product";
import { createProduct, updateProduct } from "@/lib/actions/products";
import { getCategories } from "@/lib/actions/categories";
import { ImageUploader } from "@/components/products/image-uploader";

interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
}

interface ProductFormProps {
  mode: "create" | "edit";
  defaultValues?: Product;
  productId?: string;
}

type FormData = z.infer<typeof CreateProductSchema>;

const colorPresets = [
  "Black",
  "White",
  "Gray",
  "Navy",
  "Red",
  "Blue",
  "Green",
  "Pink",
  "Purple",
  "Beige",
  "Brown",
  "Olive",
  "Burgundy",
  "Coral",
  "Teal",
];

export function ProductForm({ mode, defaultValues, productId }: ProductFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [colors, setColors] = useState<string[]>(defaultValues?.colors ?? []);
  const [newColor, setNewColor] = useState("");
  const [images, setImages] = useState(
    (defaultValues?.images as { url: string; is_primary: boolean; alt?: string }[]) ?? [],
  );

  useEffect(() => {
    getCategories().then((result) => {
      if (result.success) {
        setCategories(result.data);
      }
    });
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(
      mode === "create" ? CreateProductSchema : (UpdateProductSchema as any),
    ) as any,
    defaultValues: defaultValues
      ? {
          name: defaultValues.name,
          description: defaultValues.description,
          category_id: defaultValues.category_id,
          subcategory: defaultValues.subcategory || "",
          price: defaultValues.price,
          sizes: defaultValues.sizes as FormData["sizes"],
          colors: defaultValues.colors,
          is_featured: defaultValues.is_featured,
          is_new_arrival: defaultValues.is_new_arrival,
        }
      : {
          name: "",
          description: "",
          category_id: "",
          subcategory: "",
          price: undefined as unknown as number,
          sizes: [],
          colors: [],
          is_featured: false,
          is_new_arrival: false,
        },
  });

  const selectedCategoryId = watch("category_id");

  // Determine if selected category is a children's category
  const selectedCategory = categories.find(
    (c) => c.id === selectedCategoryId,
  );
  const isChildrenCategory =
    selectedCategory?.name.toLowerCase().includes("children") ||
    selectedCategory?.name.toLowerCase().includes("kids") ||
    selectedCategory?.name.toLowerCase().includes("baby") ||
    selectedCategory?.slug.startsWith("children") ||
    selectedCategory?.slug.startsWith("kids");

  const handleAddColor = () => {
    const trimmed = newColor.trim();
    if (trimmed && !colors.includes(trimmed)) {
      const updated = [...colors, trimmed];
      setColors(updated);
      setValue("colors", updated as any);
      setNewColor("");
    }
  };

  const handleRemoveColor = (color: string) => {
    const updated = colors.filter((c) => c !== color);
    setColors(updated);
    setValue("colors", updated as any);
  };

  const handleSizeToggle = (size: string) => {
    const currentSizes = watch("sizes") as string[];
    const updated = currentSizes.includes(size)
      ? currentSizes.filter((s) => s !== size)
      : [...currentSizes, size];
    setValue("sizes", updated as FormData["sizes"]);
  };

  const onSubmit = async (data: FormData) => {
    setServerError(null);

    if (mode === "create") {
      const result = await createProduct({
        ...data,
        colors: colors,
        images: images,
      } as unknown as CreateProductInput);

      if (result.success) {
        router.push("/admin/products");
        router.refresh();
      } else {
        setServerError(result.error);
      }
    } else if (mode === "edit" && productId) {
      const updateData: UpdateProductInput = {};
      if (data.name !== defaultValues?.name) updateData.name = data.name;
      if (data.description !== defaultValues?.description)
        updateData.description = data.description;
      if (data.category_id !== defaultValues?.category_id)
        updateData.category_id = data.category_id;
      if (data.subcategory !== defaultValues?.subcategory)
        updateData.subcategory = data.subcategory;
      if (data.price !== defaultValues?.price) updateData.price = data.price;
      if (JSON.stringify(data.sizes) !== JSON.stringify(defaultValues?.sizes))
        updateData.sizes = data.sizes as UpdateProductInput["sizes"];
      updateData.colors = colors;
      updateData.is_featured = data.is_featured;
      updateData.is_new_arrival = data.is_new_arrival;

      const result = await updateProduct(productId, updateData);

      if (result.success) {
        router.push("/admin/products");
        router.refresh();
      } else {
        setServerError(result.error);
      }
    }
  };

  const parentCategories = categories.filter((c) => !c.parent_id);
  const subcategories = categories.filter(
    (c) => c.parent_id === selectedCategoryId,
  );

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{mode === "create" ? "New Product" : "Edit Product"}</CardTitle>
        <CardDescription>
          {mode === "create"
            ? "Add a new product to your catalog"
            : "Update product details"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {serverError && (
            <div className="flex items-start gap-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Name */}
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Product Name
            </label>
            <Input
              id="name"
              placeholder="e.g., Classic Fit T-Shirt"
              {...register("name")}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-xs text-destructive">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <textarea
              id="description"
              rows={4}
              className="h-20 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive md:text-sm dark:bg-input/30"
              placeholder="Describe your product..."
              {...register("description")}
              aria-invalid={!!errors.description}
            />
            {errors.description && (
              <p className="text-xs text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label htmlFor="category" className="text-sm font-medium">
              Category
            </label>
            <Select
              value={selectedCategoryId || ""}
              onValueChange={(value) =>
                setValue("category_id", value ?? "", { shouldValidate: true })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {parentCategories.map((cat) => {
                  const children = categories.filter(
                    (c) => c.parent_id === cat.id,
                  );
                  return (
                    <div key={cat.id}>
                      <SelectItem value={cat.id}>{cat.name}</SelectItem>
                      {children.map((child) => (
                        <SelectItem key={child.id} value={child.id} className="pl-6">
                          {child.name}
                        </SelectItem>
                      ))}
                    </div>
                  );
                })}
              </SelectContent>
            </Select>
            {errors.category_id && (
              <p className="text-xs text-destructive">
                {errors.category_id.message}
              </p>
            )}
          </div>

          {/* Subcategory */}
          <div className="space-y-2">
            <label htmlFor="subcategory" className="text-sm font-medium">
              Subcategory (optional)
            </label>
            <Input
              id="subcategory"
              placeholder="e.g., Casual, Formal, Sport"
              {...register("subcategory")}
            />
          </div>

          {/* Price */}
          <div className="space-y-2">
            <label htmlFor="price" className="text-sm font-medium">
              Price ($)
            </label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="29.99"
              {...register("price", { valueAsNumber: true })}
              aria-invalid={!!errors.price}
            />
            {errors.price && (
              <p className="text-xs text-destructive">
                {errors.price.message}
              </p>
            )}
          </div>

          {/* Sizes */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Sizes</label>
            <div className="flex flex-wrap gap-2">
              {SIZES.map((size) => {
                const selected = (
                  (watch("sizes") as string[]) ?? []
                ).includes(size);
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => handleSizeToggle(size)}
                    className={`flex h-8 w-10 items-center justify-center rounded-md border text-xs font-medium transition-colors ${
                      selected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input hover:border-muted-foreground"
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
            {errors.sizes && (
              <p className="text-xs text-destructive">
                {errors.sizes.message}
              </p>
            )}
          </div>

          {/* Colors */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Colors</label>
            <div className="flex flex-wrap gap-2">
              {colors.map((color) => (
                <span
                  key={color}
                  className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs"
                >
                  {color}
                  <button
                    type="button"
                    onClick={() => handleRemoveColor(color)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <XIcon className="size-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  placeholder="Add a color..."
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddColor();
                    }
                  }}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddColor}
                disabled={!newColor.trim()}
              >
                <PlusIcon className="size-3" />
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {colorPresets
                .filter((c) => !colors.includes(c))
                .map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      const updated = [...colors, preset];
                      setColors(updated);
                      setValue("colors", updated as any);
                    }}
                    className="rounded-md border px-2 py-0.5 text-[11px] text-muted-foreground hover:border-muted-foreground hover:text-foreground"
                  >
                    {preset}
                  </button>
                ))}
            </div>
            {errors.colors && (
              <p className="text-xs text-destructive">
                {errors.colors.message}
              </p>
            )}
          </div>

          {/* Age Range (shown for children categories) */}
          {isChildrenCategory && (
            <div className="space-y-2 rounded-lg border p-4">
              <label className="text-sm font-medium">Age Range</label>
              <p className="text-xs text-muted-foreground">
                This category appears to be for children. Set the age range.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Min Age</label>
                  <Input
                    type="number"
                    min={0}
                    max={18}
                    placeholder="3"
                    defaultValue={
                      (defaultValues?.age_range as { min?: number })?.min
                    }
                    onChange={(e) =>
                      setValue("age_range", {
                        min: parseInt(e.target.value) || 0,
                        max:
                          (defaultValues?.age_range as { max?: number })?.max ??
                          0,
                      })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Max Age</label>
                  <Input
                    type="number"
                    min={0}
                    max={18}
                    placeholder="6"
                    defaultValue={
                      (defaultValues?.age_range as { max?: number })?.max
                    }
                    onChange={(e) =>
                      setValue("age_range", {
                        min:
                          (defaultValues?.age_range as { min?: number })?.min ??
                          0,
                        max: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* Featured & New Arrival toggles */}
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4 rounded border-input"
                {...register("is_featured")}
              />
              Featured
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4 rounded border-input"
                {...register("is_new_arrival")}
              />
              New Arrival
            </label>
          </div>

          {/* Image Uploader (edit mode only) */}
          {mode === "edit" && productId && (
            <ImageUploader
              productId={productId}
              images={images}
              onImagesChange={setImages}
            />
          )}

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
              {isSubmitting ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  {mode === "create" ? "Creating..." : "Saving..."}
                </>
              ) : mode === "create" ? (
                "Create Product"
              ) : (
                "Save Changes"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
