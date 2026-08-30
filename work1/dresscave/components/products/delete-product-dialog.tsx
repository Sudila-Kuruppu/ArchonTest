"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { deleteProduct } from "@/lib/actions/products";
import { Trash2Icon, Loader2Icon, AlertTriangleIcon } from "lucide-react";

interface DeleteProductDialogProps {
  productId: string;
  productName: string;
}

export function DeleteProductDialog({
  productId,
  productName,
}: DeleteProductDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    setServerError(null);

    const result = await deleteProduct(productId);

    if (result.success) {
      setOpen(false);
      router.refresh();
    } else {
      setServerError(result.error);
    }

    setIsDeleting(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setServerError(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger>
        <Button variant="ghost" size="icon-sm" aria-label="Delete product">
          <Trash2Icon className="size-4 text-destructive" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Product</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{productName}</strong>?
            This action uses soft delete — the product will no longer appear
            in your catalog but related records (orders, reviews) will remain
            intact.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {serverError && (
            <div className="flex items-start gap-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete product"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
