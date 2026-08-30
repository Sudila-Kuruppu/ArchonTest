import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { CategoriesManager } from "./categories-manager";

export const metadata: Metadata = {
  title: "Categories — Admin — DressCave",
  description: "Manage product categories",
};

export default async function AdminCategoriesPage() {
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
        <p className="text-sm text-muted-foreground">
          Manage product categories and subcategories
        </p>
      </div>

      <CategoriesManager categories={categories ?? []} />
    </div>
  );
}
