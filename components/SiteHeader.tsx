import Link from "next/link";
import { CartBadgeButton } from "@/components/CartBadgeButton";

export function SiteHeader() {
  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-bold tracking-tight text-stone-950"
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-emerald-700 font-mono text-xs font-bold text-white">
              CB
            </span>
            <span>CodeBazaar</span>
          </Link>

          <nav aria-label="Primary" className="hidden items-center gap-6 md:flex">
            <Link
              href="/products"
              className="text-sm font-medium text-stone-700 transition hover:text-stone-950"
            >
              All Products
            </Link>
            <Link
              href="/category/nextjs-templates"
              className="text-sm font-medium text-stone-700 transition hover:text-stone-950"
            >
              Next.js Templates
            </Link>
            <Link
              href="/category/saas-boilerplates"
              className="text-sm font-medium text-stone-700 transition hover:text-stone-950"
            >
              SaaS Boilerplates
            </Link>
            <Link
              href="/category/developer-tools"
              className="text-sm font-medium text-stone-700 transition hover:text-stone-950"
            >
              Developer Tools
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/seller"
            className="hidden text-sm font-medium text-stone-700 transition hover:text-stone-950 sm:inline-block"
          >
            Sell Code
          </Link>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-stone-700 transition hover:text-stone-950"
          >
            Dashboard
          </Link>
          <CartBadgeButton />
        </div>
      </div>
    </header>
  );
}
