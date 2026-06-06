import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DeleteAccountDialog } from "@/components/profile/delete-account-dialog";

export const metadata: Metadata = {
  title: "Delete Account — DressCave",
  description: "Permanently delete your DressCave account",
};

export default function DeleteAccountPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Delete Account
        </h1>
        <p className="text-sm text-muted-foreground">
          Permanently delete your account and personal data
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danger Zone</CardTitle>
          <CardDescription>
            Once you delete your account, there is no going back. Please be
            certain.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Deleting your account will:
          </p>
          <ul className="mb-6 list-disc space-y-1 pl-4 text-sm text-muted-foreground">
            <li>Immediately deactivate your account</li>
            <li>Schedule your personal data for deletion within 30 days</li>
            <li>Anonymize your order history</li>
            <li>Permanently delete saved measurements</li>
          </ul>
          <DeleteAccountDialog />
        </CardContent>
      </Card>
    </div>
  );
}
