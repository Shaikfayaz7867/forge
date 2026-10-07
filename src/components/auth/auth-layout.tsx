import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="flex flex-col items-center w-full relative">
      <Link 
        href="/" 
        className="absolute left-0 top-0 sm:-left-12 sm:top-2 p-2 text-muted-foreground hover:text-foreground hover:bg-surface-2/50 rounded-full transition-colors flex items-center justify-center"
        aria-label="Back to home"
      >
        <ArrowLeft className="size-5" />
      </Link>
      <div className="flex w-full flex-col gap-6">
        <Link href="/" className="flex items-center gap-2 self-center font-medium">
          <div className="flex size-10 items-center justify-center rounded-md bg-foreground text-background">
            <Logo className="size-6" collapsed={true} />
          </div>
          <span className="text-xl text-white">Forge</span>
        </Link>
        <Card className="rounded-2xl border-none bg-card/80 shadow-2xl backdrop-blur-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold tracking-tight">{title}</CardTitle>
            <CardDescription>{subtitle}</CardDescription>
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      </div>
    </div>
  );
}
