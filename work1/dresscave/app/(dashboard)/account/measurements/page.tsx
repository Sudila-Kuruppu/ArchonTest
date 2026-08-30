import type { Metadata } from "next";
import { MeasurementsForm } from "@/components/profile/measurements-form";

export const metadata: Metadata = {
  title: "My Measurements — DressCave",
  description: "Manage your custom measurements for made-to-order clothing",
};

export default function MeasurementsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Custom Measurements
        </h1>
        <p className="text-sm text-muted-foreground">
          Save your measurements to ensure a perfect fit for made-to-order
          clothing. You can save multiple measurement profiles.
        </p>
      </div>
      <MeasurementsForm />
    </div>
  );
}
