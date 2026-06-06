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
import { PackageIcon, RulerIcon, ArrowRightIcon } from "lucide-react";

export const metadata: Metadata = {
  title: "My Account — DressCave",
  description: "Manage your DressCave account",
};

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ""}
        </h1>
        <p className="text-sm text-muted-foreground">
          {user?.email}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PackageIcon className="size-4" />
              Order History
            </CardTitle>
            <CardDescription>
              View your recent orders and track shipments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No orders yet. Start shopping to see your order history here.
            </p>
            <Link href="/women" className="mt-3 inline-block">
              <Button variant="outline" size="sm">
                Browse products
                <ArrowRightIcon className="size-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RulerIcon className="size-4" />
              Measurements
            </CardTitle>
            <CardDescription>
              Save your custom measurements for made-to-order clothing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Set up your measurement profile for a perfect fit every time.
            </p>
            <Link
              href="/account/measurements"
              className="mt-3 inline-block"
            >
              <Button variant="outline" size="sm">
                Manage measurements
                <ArrowRightIcon className="size-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
