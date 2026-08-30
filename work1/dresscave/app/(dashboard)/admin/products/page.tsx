import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { ProductsTable } from "./products-table";

export const metadata: Metadata = {
  title: "Products — Admin — DressCave",
  description: "Manage your product catalog",
};

interface ProductsPageProps {
  searchParams: Promise<{ search?: string }>;
}

export default async function AdminProductsPage({
  searchParams,
}: ProductsPageProps) {
  const { search } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select(
      `
      id,
      name,
      price,
      is_featured,
      is_new_arrival,
      created_at,
      category_id,
      categories:category_id(name)
    `,
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const { data: products, error } = await query;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground">
            Manage your product catalog
          </p>
        </div>
        <Link href="/admin/products/new">
          <Button>
            <PlusIcon className="size-4" />
            Add Product
          </Button>
        </Link>
      </div>

      <ProductsTable
        products={
          products?.map((p) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            is_featured: p.is_featured,
            is_new_arrival: p.is_new_arrival,
            created_at: p.created_at,
            categoryName:
              ((p.categories as unknown as { name: string })?.name ?? "Uncategorized"),
          })) ?? []
        }
        search={search ?? ""}
      />
    </div>
  );
}
