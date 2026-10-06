import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth/auth-layout";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Sign up | Forge",
};

export default function RegisterPage() {
  return (
    <AuthLayout title="Create an account" subtitle="Sign up to start tracking your fitness journey">
      <RegisterForm />
    </AuthLayout>
  );
}
