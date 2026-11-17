import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ProductCard } from "@/components/ProductCard";
import { SearchBar } from "@/components/SearchBar";
import { JsonLd } from "@/components/JsonLd";
import { getCategories, getFeaturedProducts } from "@/lib/catalog";
import { buildMetadata, getSiteUrl, SITE_NAME } from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata() {
  return buildMetadata({
    title: "CodeBazaar — Production Source Code, Templates & SaaS Boilerplates",
    description:
      "CodeBazaar is the source-code bazaar for builders. Buy production-ready Next.js 15 templates, SaaS boilerplates, and TypeScript developer tools.",
    slug: "/",
  });
}

export default async function HomePage() {
  const [categories, featuredProducts] = await Promise.all([
    getCategories(),
    getFeaturedProducts(),
  ]);

  const siteUrl = getSiteUrl();
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/products?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <div className="flex min-h-screen flex-col">
      <JsonLd data={orgJsonLd} />
      <SiteHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="border-b border-stone-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <div className="max-w-3xl">
              <p className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                Verified TypeScript &amp; Next.js 15 Source Code
              </p>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-stone-950 sm:text-5xl">
                CodeBazaar — the source-code bazaar for builders.
              </h1>
              <p className="mt-4 text-lg leading-relaxed text-stone-600">
                Skip boilerplate plumbing. Buy production-hardened SaaS
                starters, SEO-first Next.js templates, and developer CLIs with
                instant commercial licensing.
              </p>

              <div className="mt-8 max-w-xl">
                <SearchBar />
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-stone-600">
                <Link
                  href="/products"
                  className="font-semibold text-emerald-800 hover:underline"
                >
                  Browse all products &rarr;
                </Link>
                <span>&middot;</span>
                <span>Instant ZIP download</span>
                <span>&middot;</span>
                <span>Commercial license included</span>
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xl font-bold tracking-tight text-stone-950">
              Browse by Category
            </h2>
            <Link
              href="/products"
              className="text-sm font-medium text-emerald-800 hover:underline"
            >
              View catalog
            </Link>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                className="rounded-xl border border-stone-200 bg-white p-5 transition hover:border-emerald-700"
              >
                <h3 className="text-base font-semibold text-stone-950">
                  {cat.name}
                </h3>
                <p className="mt-1.5 line-clamp-2 text-sm text-stone-600">
                  {cat.description}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* Featured Products */}
        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xl font-bold tracking-tight text-stone-950">
              Featured Source Code
            </h2>
            <Link
              href="/products"
              className="text-sm font-medium text-emerald-800 hover:underline"
            >
              All products &rarr;
            </Link>
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredProducts.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                priority={index === 0}
              />
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
