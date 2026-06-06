"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  UploadIcon,
  XIcon,
  Loader2Icon,
  StarIcon,
  GripVerticalIcon,
  ImageIcon,
} from "lucide-react";

interface ImageEntry {
  url: string;
  is_primary: boolean;
  alt?: string;
}

interface ImageUploaderProps {
  productId: string;
  images: ImageEntry[];
  onImagesChange: (images: ImageEntry[]) => void;
}

export function ImageUploader({
  productId,
  images,
  onImagesChange,
}: ImageUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      setUploading(true);
      const formData = new FormData();

      for (const file of Array.from(files)) {
        formData.append("file", file);
      }

      try {
        const { uploadImage } = await import("@/lib/actions/products");
        const result = await uploadImage(productId, formData);

        if (result.success && result.data) {
          onImagesChange([...images, result.data]);
        }
      } catch (err) {
        console.error("Upload failed:", err);
      }

      setUploading(false);
    },
    [productId, images, onImagesChange],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleRemoveImage = useCallback(
    async (imageUrl: string) => {
      const { deleteImage } = await import("@/lib/actions/products");
      await deleteImage(productId, imageUrl);
      onImagesChange(images.filter((img) => img.url !== imageUrl));
    },
    [productId, images, onImagesChange],
  );

  const handleSetPrimary = useCallback(
    (imageUrl: string) => {
      onImagesChange(
        images.map((img) => ({
          ...img,
          is_primary: img.url === imageUrl,
        })),
      );
    },
    [images, onImagesChange],
  );

  const handleDragStart = useCallback(
    (e: React.DragEvent, index: number) => {
      setDragIndex(index);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(index));
    },
    [],
  );

  const handleDragOverItem = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      if (dragIndex === null || dragIndex === index) return;

      const newImages = [...images];
      const [moved] = newImages.splice(dragIndex, 1);
      newImages.splice(index, 0, moved);
      onImagesChange(newImages);
      setDragIndex(index);
    },
    [dragIndex, images, onImagesChange],
  );

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
  }, []);

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">Product Images</label>

      {/* Drop zone */}
      <div
        className={`relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Uploading...</p>
          </div>
        ) : (
          <>
            <UploadIcon className="size-8 text-muted-foreground" />
            <p className="mt-2 text-sm font-medium">
              Drag & drop images here, or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG, WebP up to 5MB each
            </p>
          </>
        )}
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />
      </div>

      {/* Image previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {images.map((img, index) => (
            <div
              key={img.url}
              className={`group relative aspect-square overflow-hidden rounded-lg border ${
                img.is_primary ? "ring-2 ring-primary" : ""
              }`}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOverItem(e, index)}
              onDragEnd={handleDragEnd}
            >
              <img
                src={img.url}
                alt={img.alt || `Product image ${index + 1}`}
                className="size-full object-cover"
              />

              {/* Drag handle */}
              <div className="absolute left-1 top-1 rounded-md bg-black/50 p-1 opacity-0 transition-opacity group-hover:opacity-100">
                <GripVerticalIcon className="size-3 text-white" />
              </div>

              {/* Primary badge */}
              {img.is_primary && (
                <div className="absolute right-1 top-1 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                  Primary
                </div>
              )}

              {/* Actions overlay */}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                {!img.is_primary && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="text-white hover:bg-white/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetPrimary(img.url);
                    }}
                    title="Set as primary"
                  >
                    <StarIcon className="size-3" />
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="text-white hover:bg-white/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveImage(img.url);
                  }}
                  title="Remove image"
                >
                  <XIcon className="size-3" />
                </Button>
              </div>

              {!img.is_primary && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                  <ImageIcon className="size-6 text-white drop-shadow-lg" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
