import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { RegisterForm } from "@/components/RegisterForm";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: "Create Account",
    description: "Register a CodeBazaar buyer or creator account.",
    slug: "/register",
    noIndex: true,
  });
}

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-14 sm:px-6">
        <h1 className="mb-2 text-2xl font-bold tracking-tight text-stone-950">
          Create your CodeBazaar account
        </h1>
        <p className="mb-6 text-sm text-stone-600">
          Join builders buying and selling production TypeScript source code.
        </p>
        <RegisterForm />
      </main>
      <SiteFooter />
    </div>
  );
}
