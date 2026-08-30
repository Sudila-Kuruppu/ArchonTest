"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  SearchIcon,
  PencilIcon,
  StarIcon,
  SparklesIcon,
  Loader2Icon,
} from "lucide-react";
import { setFeatured, setNewArrival } from "@/lib/actions/products";
import { DeleteProductDialog } from "@/components/products/delete-product-dialog";

interface ProductRow {
  id: string;
  name: string;
  price: number;
  is_featured: boolean;
  is_new_arrival: boolean;
  created_at: string;
  categoryName: string;
}

interface ProductsTableProps {
  products: ProductRow[];
  search: string;
}

export function ProductsTable({ products, search }: ProductsTableProps) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState(search);
  const [togglingFeatured, setTogglingFeatured] = useState<string | null>(null);
  const [togglingNewArrival, setTogglingNewArrival] = useState<string | null>(
    null,
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchValue) {
      params.set("search", searchValue);
    }
    router.push(`/admin/products?${params.toString()}`);
  };

  const handleToggleFeatured = async (id: string, current: boolean) => {
    setTogglingFeatured(id);
    await setFeatured(id, !current);
    setTogglingFeatured(null);
    router.refresh();
  };

  const handleToggleNewArrival = async (id: string, current: boolean) => {
    setTogglingNewArrival(id);
    await setNewArrival(id, !current);
    setTogglingNewArrival(null);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Category</th>
              <th className="px-4 py-3 text-right font-medium">Price</th>
              <th className="px-4 py-3 text-center font-medium">Featured</th>
              <th className="px-4 py-3 text-center font-medium">New</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  {search
                    ? "No products match your search."
                    : "No products yet. Add your first product!"}
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="border-b last:border-b-0">
                  <td className="px-4 py-3 font-medium">{product.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {product.categoryName}
                  </td>
                  <td className="px-4 py-3 text-right">
                    ${product.price.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() =>
                        handleToggleFeatured(product.id, product.is_featured)
                      }
                      disabled={togglingFeatured === product.id}
                      aria-label={
                        product.is_featured
                          ? "Unmark as featured"
                          : "Mark as featured"
                      }
                    >
                      {togglingFeatured === product.id ? (
                        <Loader2Icon className="size-4 animate-spin" />
                      ) : (
                        <StarIcon
                          className={`size-4 ${
                            product.is_featured
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted-foreground"
                          }`}
                        />
                      )}
                    </Button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() =>
                        handleToggleNewArrival(
                          product.id,
                          product.is_new_arrival,
                        )
                      }
                      disabled={togglingNewArrival === product.id}
                      aria-label={
                        product.is_new_arrival
                          ? "Remove new arrival badge"
                          : "Mark as new arrival"
                      }
                    >
                      {togglingNewArrival === product.id ? (
                        <Loader2Icon className="size-4 animate-spin" />
                      ) : (
                        <SparklesIcon
                          className={`size-4 ${
                            product.is_new_arrival
                              ? "fill-blue-400 text-blue-400"
                              : "text-muted-foreground"
                          }`}
                        />
                      )}
                    </Button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/admin/products/${product.id}/edit`}>
                        <Button variant="ghost" size="icon-sm">
                          <PencilIcon className="size-4" />
                        </Button>
                      </Link>
                      <DeleteProductDialog
                        productId={product.id}
                        productName={product.name}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
