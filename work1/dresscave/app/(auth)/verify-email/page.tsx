import type { Metadata } from "next";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MailIcon } from "lucide-react";

export const metadata: Metadata = {
  title: "Verify Email — DressCave",
  description: "Check your email for verification link",
};

export default function VerifyEmailPage() {
  return (
    <Card size="sm" className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Check your email</CardTitle>
        <CardDescription>
          We&apos;ve sent a verification link to your email address
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4 py-6">
        <MailIcon className="size-12 text-primary" />
        <p className="text-center text-sm text-muted-foreground">
          Click the link in the email to verify your account. If you don&apos;t
          see the email, check your spam folder.
        </p>
      </CardContent>
      <CardFooter className="justify-center">
        <Link href="/login">
          <Button variant="outline">Go to login</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
