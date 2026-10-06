import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth/auth-layout";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Log in | Forge",
};

export default function LoginPage() {
  return (
    <AuthLayout title="Welcome back" subtitle="Enter your credentials to access your account">
      <LoginForm />
    </AuthLayout>
  );
}
