import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { LoginForm } from "@/components/LoginForm";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: "Sign In",
    description: "Sign in to your CodeBazaar buyer or creator account.",
    slug: "/login",
    noIndex: true,
  });
}

interface LoginPageProps {
  searchParams: Promise<{ callbackUrl?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { callbackUrl } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-14 sm:px-6">
        <h1 className="mb-2 text-2xl font-bold tracking-tight text-stone-950">
          Sign in to CodeBazaar
        </h1>
        <p className="mb-6 text-sm text-stone-600">
          Access your purchased licenses, downloads, or creator listings.
        </p>
        <LoginForm callbackUrl={callbackUrl || "/dashboard"} />
      </main>
      <SiteFooter />
    </div>
  );
}
