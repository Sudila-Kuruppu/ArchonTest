import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  PackageIcon,
  FolderTreeIcon,
  StarIcon,
  SparklesIcon,
  PlusIcon,
  ArrowRightIcon,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Admin Dashboard — DressCave",
  description: "Manage your DressCave store",
};

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [productsCount, featuredCount, newArrivalsCount, categoriesCount] =
    await Promise.all([
      supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .is("deleted_at", null),
      supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("is_featured", true)
        .is("deleted_at", null),
      supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("is_new_arrival", true)
        .is("deleted_at", null),
      supabase.from("categories").select("id", { count: "exact", head: true }),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Admin Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your product catalog, categories, and store settings.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PackageIcon className="size-4" />
              Total Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{productsCount.count ?? 0}</p>
            <p className="text-xs text-muted-foreground">
              Active products in catalog
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <StarIcon className="size-4" />
              Featured
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{featuredCount.count ?? 0}</p>
            <p className="text-xs text-muted-foreground">
              Products marked as featured
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SparklesIcon className="size-4" />
              New Arrivals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{newArrivalsCount.count ?? 0}</p>
            <p className="text-xs text-muted-foreground">
              Products marked as new
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderTreeIcon className="size-4" />
              Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{categoriesCount.count ?? 0}</p>
            <p className="text-xs text-muted-foreground">
              Product categories
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/products/new">
            <Button>
              <PlusIcon className="size-4" />
              Add Product
            </Button>
          </Link>
          <Link href="/admin/categories">
            <Button variant="outline">
              <FolderTreeIcon className="size-4" />
              Manage Categories
            </Button>
          </Link>
          <Link href="/admin/products">
            <Button variant="outline">
              <PackageIcon className="size-4" />
              View All Products
              <ArrowRightIcon className="size-3" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
