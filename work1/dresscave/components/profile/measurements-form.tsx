"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2Icon, PlusIcon, Trash2Icon } from "lucide-react";

const MeasurementEntrySchema = z.object({
  label: z.string().max(100).optional(),
  chest: z.coerce.number().positive("Must be positive").optional(),
  waist: z.coerce.number().positive("Must be positive").optional(),
  hips: z.coerce.number().positive("Must be positive").optional(),
  inseam: z.coerce.number().positive("Must be positive").optional(),
  height: z.coerce.number().positive("Must be positive").optional(),
  weight: z.coerce.number().positive("Must be positive").optional(),
  notes: z.string().max(500).optional(),
});

const MeasurementsFormSchema = z.object({
  unit: z.enum(["cm", "inches"]),
  profiles: z.array(MeasurementEntrySchema),
});

type MeasurementsFormData = z.infer<typeof MeasurementsFormSchema>;

export function MeasurementsForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({
    resolver: zodResolver(MeasurementsFormSchema) as any,
    defaultValues: {
      unit: "cm",
      profiles: [
        {
          label: "Default",
          chest: undefined,
          waist: undefined,
          hips: undefined,
          inseam: undefined,
          height: undefined,
          weight: undefined,
          notes: "",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "profiles",
  });

  const onSubmit = async (data: any) => {
    setServerError(null);
    setSuccessMessage(null);

    try {
      // TODO: Save measurements to Supabase profiles table
      console.log("Saving measurements:", data);
      setSuccessMessage("Measurements saved successfully");
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Failed to save measurements",
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Custom Measurements</CardTitle>
        <CardDescription>
          Save your measurements for made-to-order clothing. You can save
          multiple measurement profiles.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {serverError && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {serverError}
            </div>
          )}
          {successMessage && (
            <div className="rounded-lg bg-primary/10 p-3 text-sm text-primary">
              {successMessage}
            </div>
          )}

          {/* Unit Selector */}
          <div className="flex items-center gap-2">
            <label htmlFor="unit" className="text-sm font-medium">
              Unit:
            </label>
            <Select
              defaultValue="cm"
              onValueChange={(value) => {
                // Handle unit change
              }}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cm">Centimeters (cm)</SelectItem>
                <SelectItem value="inches">Inches</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Measurement Profiles */}
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="space-y-4 rounded-lg border p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Input
                    placeholder="Profile label (e.g. Default, Petite)"
                    {...register(`profiles.${index}.label`)}
                    className="max-w-xs"
                  />
                </div>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => remove(index)}
                    aria-label="Remove profile"
                  >
                    <Trash2Icon className="size-4 text-destructive" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Chest</label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="cm"
                    {...register(`profiles.${index}.chest`, {
                      valueAsNumber: true,
                    })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Waist</label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="cm"
                    {...register(`profiles.${index}.waist`, {
                      valueAsNumber: true,
                    })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Hips</label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="cm"
                    {...register(`profiles.${index}.hips`, {
                      valueAsNumber: true,
                    })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Inseam</label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="cm"
                    {...register(`profiles.${index}.inseam`, {
                      valueAsNumber: true,
                    })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Height</label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="cm"
                    {...register(`profiles.${index}.height`, {
                      valueAsNumber: true,
                    })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Weight</label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="kg"
                    {...register(`profiles.${index}.weight`, {
                      valueAsNumber: true,
                    })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Notes</label>
                <Input
                  placeholder="Optional notes about fit preferences"
                  {...register(`profiles.${index}.notes`)}
                />
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={() =>
              append({
                label: "",
                chest: undefined,
                waist: undefined,
                hips: undefined,
                inseam: undefined,
                height: undefined,
                weight: undefined,
                notes: "",
              })
            }
          >
            <PlusIcon className="size-4" />
            Add profile
          </Button>

          <div className="pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save measurements"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
