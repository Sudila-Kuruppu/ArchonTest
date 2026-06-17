"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  PlusIcon,
  PencilIcon,
  Trash2Icon,
  Loader2Icon,
  ChevronRightIcon,
  ChevronDownIcon,
  AlertTriangleIcon,
  FolderTreeIcon,
} from "lucide-react";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/actions/categories";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  created_at: string;
}

interface CategoriesManagerProps {
  categories: Category[];
}

export function CategoriesManager({ categories }: CategoriesManagerProps) {
  const router = useRouter();
  const [expandedParents, setExpandedParents] = useState<Set<string>>(
    new Set(),
  );
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newParentId, setNewParentId] = useState<string | null>(null);
  const [addingError, setAddingError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Organize categories into tree
  const parentCategories = categories.filter((c) => !c.parent_id);
  const getChildren = (parentId: string) =>
    categories.filter((c) => c.parent_id === parentId);

  const toggleExpand = (id: string) => {
    setExpandedParents((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setIsAdding(true);
    setAddingError(null);

    const result = await createCategory({
      name: newName.trim(),
      parent_id: newParentId,
    });

    if (result.success) {
      setNewName("");
      setNewParentId(null);
      router.refresh();
    } else {
      setAddingError(result.error);
    }

    setIsAdding(false);
  };

  const handleEdit = async (id: string) => {
    if (!editName.trim()) return;

    const result = await updateCategory(id, { name: editName.trim() });

    if (result.success) {
      setEditingId(null);
      setEditName("");
      router.refresh();
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setDeleteError(null);

    const result = await deleteCategory(id);

    if (result.success) {
      setDeleteDialogOpen(null);
      setDeleteError(null);
      router.refresh();
    } else {
      setDeleteError(result.error);
    }

    setDeletingId(null);
  };

  const availableParents = categories.filter(
    (c) => !c.parent_id && c.id !== deleteDialogOpen,
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      {/* Category Tree */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderTreeIcon className="size-4" />
            Category Tree
          </CardTitle>
        </CardHeader>
        <CardContent>
          {parentCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No categories yet. Add one to get started.
            </p>
          ) : (
            <div className="space-y-1">
              {parentCategories.map((cat) => {
                const children = getChildren(cat.id);
                const isExpanded = expandedParents.has(cat.id);
                return (
                  <div key={cat.id}>
                    <div className="group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted">
                      {children.length > 0 ? (
                        <button
                          onClick={() => toggleExpand(cat.id)}
                          className="text-muted-foreground"
                        >
                          {isExpanded ? (
                            <ChevronDownIcon className="size-4" />
                          ) : (
                            <ChevronRightIcon className="size-4" />
                          )}
                        </button>
                      ) : (
                        <span className="size-4" />
                      )}

                      {editingId === cat.id ? (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleEdit(cat.id);
                          }}
                          className="flex flex-1 items-center gap-2"
                        >
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="h-7 text-sm"
                            autoFocus
                          />
                          <Button type="submit" size="xs">
                            Save
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="xs"
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </Button>
                        </form>
                      ) : (
                        <>
                          <span className="flex-1 text-sm font-medium">
                            {cat.name}
                          </span>
                          <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => {
                                setEditingId(cat.id);
                                setEditName(cat.name);
                              }}
                            >
                              <PencilIcon className="size-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => setDeleteDialogOpen(cat.id)}
                            >
                              <Trash2Icon className="size-3 text-destructive" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Children */}
                    {children.length > 0 && isExpanded && (
                      <div className="ml-4 border-l pl-2">
                        {children.map((child) => (
                          <div
                            key={child.id}
                            className="group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted"
                          >
                            {editingId === child.id ? (
                              <form
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  handleEdit(child.id);
                                }}
                                className="flex flex-1 items-center gap-2"
                              >
                                <Input
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  className="h-7 text-sm"
                                  autoFocus
                                />
                                <Button type="submit" size="xs">
                                  Save
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="xs"
                                  onClick={() => setEditingId(null)}
                                >
                                  Cancel
                                </Button>
                              </form>
                            ) : (
                              <>
                                <span className="flex-1 text-sm">
                                  {child.name}
                                </span>
                                <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                                  <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    onClick={() => {
                                      setEditingId(child.id);
                                      setEditName(child.name);
                                    }}
                                  >
                                    <PencilIcon className="size-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    onClick={() =>
                                      setDeleteDialogOpen(child.id)
                                    }
                                  >
                                    <Trash2Icon className="size-3 text-destructive" />
                                  </Button>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Category */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlusIcon className="size-4" />
            Add Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAdd();
            }}
            className="space-y-4"
          >
            {addingError && (
              <div className="flex items-start gap-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
                <span>{addingError}</span>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="category-name" className="text-sm font-medium">
                Category Name
              </label>
              <Input
                id="category-name"
                placeholder="e.g., Dresses, Tops, Accessories"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="parent-category" className="text-sm font-medium">
                Parent Category (optional)
              </label>
              <Select
                value={newParentId ?? "none"}
                onValueChange={(value) =>
                  setNewParentId(value === "none" ? null : value)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="No parent (top-level)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No parent (top-level)</SelectItem>
                  {availableParents.map((parent) => (
                    <SelectItem key={parent.id} value={parent.id}>
                      {parent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" disabled={isAdding || !newName.trim()}>
              {isAdding ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Category"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteDialogOpen(null);
            setDeleteError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this category? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <div className="flex items-start gap-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
              <span>{deleteError}</span>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(null);
                setDeleteError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteDialogOpen && handleDelete(deleteDialogOpen)}
              disabled={deletingId === deleteDialogOpen}
            >
              {deletingId === deleteDialogOpen ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
