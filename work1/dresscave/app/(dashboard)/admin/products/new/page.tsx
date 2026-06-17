import type { Metadata } from "next";
import { ProductForm } from "@/components/products/product-form";

export const metadata: Metadata = {
  title: "New Product — Admin — DressCave",
  description: "Add a new product to your catalog",
};

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New Product</h1>
        <p className="text-sm text-muted-foreground">
          Add a new product to your catalog
        </p>
      </div>
      <ProductForm mode="create" />
    </div>
  );
}