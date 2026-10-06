"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgeApi } from "@/lib/api-client";
import { forge, useForge } from "@/store/forge-store";

export function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData(e.currentTarget);
      const email = fd.get("email") as string;
      const name = fd.get("name") as string;
      const password = fd.get("password") as string;

      const res = await forgeApi.register({ email, name, password });

      if (res.success) {
        // Auto login after register
        const loginRes = await forgeApi.login({ email, password });
        if (loginRes.success) {
          await forge.reload();
          toast.success("Account created successfully!");
          router.push("/onboarding");
        } else {
          router.push("/login");
        }
      } else {
        if (res.error?.code === "VALIDATION_ERROR" && res.error?.details?.length > 0) {
          toast.error(res.error.details[0].message);
        } else {
          toast.error(res.error?.message || "Failed to create account");
        }
      }
    } catch (err) {
      toast.error("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" type="text" placeholder="John Doe" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" placeholder="m@example.com" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" required />
      </div>
      <Button type="submit" className="w-full mt-2" disabled={loading}>
        {loading ? "Creating account..." : "Create account"}
      </Button>
      <div className="mt-2 text-center text-sm">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-brand hover:underline">
          Log in
        </Link>
      </div>
    </form>
  );
}
