"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgeApi } from "@/lib/api-client";

export function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData(e.currentTarget);
      const email = fd.get("email") as string;

      const res = await forgeApi.forgotPassword(email);
      if (res.success) {
        setSent(true);
        toast.success("Reset link sent!");
      } else {
        toast.error(res.error?.message || "Failed to request reset");
      }
    } catch (err) {
      toast.error("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="rounded-full bg-green-500/20 p-3">
          <svg className="size-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-sm text-muted-foreground">
          If an account exists with that email, we have sent a password reset link.
        </p>
        <Button variant="outline" className="w-full mt-4" asChild>
          <Link href="/login">Back to Login</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" placeholder="m@example.com" required />
      </div>
      <Button type="submit" className="w-full mt-2" disabled={loading}>
        {loading ? "Sending..." : "Send Reset Link"}
      </Button>
      <div className="mt-2 text-center text-sm">
        <Link href="/login" className="font-medium text-brand hover:underline">
          Back to Login
        </Link>
      </div>
    </form>
  );
}
