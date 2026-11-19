import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ProductCard } from "@/components/ProductCard";
import { SearchBar } from "@/components/SearchBar";
import { JsonLd } from "@/components/JsonLd";
import { getCategories, getTags, queryProducts } from "@/lib/catalog";
import { buildMetadata, getSiteUrl } from "@/lib/seo";

const PAGE_SIZE = 4;

interface ProductsPageProps {
  searchParams: Promise<{
    page?: string;
    q?: string;
    sort?: string;
    category?: string;
    tag?: string;
  }>;
}

export async function generateMetadata({
  searchParams,
}: ProductsPageProps): Promise<Metadata> {
  const params = await searchParams;
  const pageNum = Math.max(1, Number(params.page || "1") || 1);
  const hasFilters = Boolean(
    params.q || params.sort || params.category || params.tag
  );

  const slugPath =
    !hasFilters && pageNum > 1 ? `/products?page=${pageNum}` : "/products";

  return buildMetadata({
    title:
      pageNum > 1 && !hasFilters
        ? `Source Code Catalog — Page ${pageNum}`
        : "Source Code Catalog — Templates, Boilerplates & Tools",
    description:
      "Browse verified Next.js 15 templates, SaaS boilerplates, and TypeScript developer tools on CodeBazaar.",
    slug: slugPath,
    canonicalSlug: hasFilters ? "/products" : slugPath,
    noIndex: hasFilters,
  });
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const params = await searchParams;
  const pageNum = Math.max(1, Number(params.page || "1") || 1);
  const q = params.q?.trim() || "";
  const sort = params.sort || "popular";
  const categorySlug = params.category || "";
  const tagSlug = params.tag || "";

  const [{ products, total, page, totalPages }, categories, tags] =
    await Promise.all([
      queryProducts({
        page: pageNum,
        limit: PAGE_SIZE,
        query: q,
        sort,
        categorySlug,
        tagSlug,
      }),
      getCategories(),
      getTags(),
    ]);

  const siteUrl = getSiteUrl();
  const offset = (page - 1) * PAGE_SIZE;

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "CodeBazaar Source Code Catalog",
    numberOfItems: products.length,
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: offset + index + 1,
      url: `${siteUrl}/products/${product.slug}`,
      name: product.title,
    })),
  };

  function buildPageHref(targetPage: number) {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (sort && sort !== "popular") sp.set("sort", sort);
    if (categorySlug) sp.set("category", categorySlug);
    if (tagSlug) sp.set("tag", tagSlug);
    if (targetPage > 1) sp.set("page", String(targetPage));
    const qs = sp.toString();
    return qs ? `/products?${qs}` : "/products";
  }

  return (
    <div className="flex min-h-screen flex-col">
      <JsonLd data={itemListJsonLd} />
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        <div className="border-b border-stone-200 pb-6">
          <h1 className="text-3xl font-bold tracking-tight text-stone-950">
            Source Code Catalog
          </h1>
          <p className="mt-2 text-sm text-stone-600">
            {total} {total === 1 ? "product" : "products"} available with
            instant download &amp; commercial licensing.
          </p>

          <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="w-full max-w-md">
              <SearchBar initialQuery={q} />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold text-stone-700">Sort:</span>
              {[
                { key: "popular", label: "Most Popular" },
                { key: "newest", label: "Newest" },
                { key: "price-asc", label: "Price: Low to High" },
                { key: "price-desc", label: "Price: High to Low" },
              ].map((opt) => {
                const active = sort === opt.key;
                const sp = new URLSearchParams();
                if (q) sp.set("q", q);
                if (opt.key !== "popular") sp.set("sort", opt.key);
                const href = sp.toString()
                  ? `/products?${sp.toString()}`
                  : "/products";
                return (
                  <Link
                    key={opt.key}
                    href={href}
                    className={`rounded-md px-2.5 py-1.5 font-medium transition ${
                      active
                        ? "bg-stone-900 text-white"
                        : "border border-stone-300 bg-white text-stone-700 hover:bg-stone-100"
                    }`}
                  >
                    {opt.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Shallow SEO-friendly Category & Tag Links */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-stone-700">
              Categories:
            </span>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                className="rounded-full border border-stone-300 bg-white px-3 py-1 text-xs font-medium text-stone-700 hover:border-emerald-700 hover:text-emerald-800"
              >
                {cat.name}
              </Link>
            ))}
            <span className="ml-2 text-xs font-semibold text-stone-700">
              Tags:
            </span>
            {tags.map((tag) => (
              <Link
                key={tag.id}
                href={`/tag/${tag.slug}`}
                className="rounded-full bg-stone-200/70 px-3 py-1 text-xs font-medium text-stone-700 hover:bg-stone-300"
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        {products.length === 0 ? (
          <div className="mt-10 rounded-xl border border-stone-200 bg-white p-10 text-center">
            <p className="text-base font-semibold text-stone-900">
              No matching source code products found.
            </p>
            <p className="mt-1 text-sm text-stone-600">
              Try clearing your search query or browsing all categories.
            </p>
            <Link
              href="/products"
              className="mt-4 inline-block rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              Reset Filters
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                priority={index === 0}
              />
            ))}
          </div>
        )}

        {/* Crawlable Pagination */}
        {totalPages > 1 && (
          <nav
            aria-label="Pagination"
            className="mt-10 flex items-center justify-center gap-2"
          >
            {page > 1 && (
              <Link
                href={buildPageHref(page - 1)}
                rel="prev"
                className="rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100"
              >
                Previous
              </Link>
            )}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={buildPageHref(p)}
                aria-current={p === page ? "page" : undefined}
                className={`rounded-lg px-3.5 py-2 text-sm font-semibold ${
                  p === page
                    ? "bg-emerald-700 text-white"
                    : "border border-stone-300 bg-white text-stone-700 hover:bg-stone-100"
                }`}
              >
                {p}
              </Link>
            ))}
            {page < totalPages && (
              <Link
                href={buildPageHref(page + 1)}
                rel="next"
                className="rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100"
              >
                Next
              </Link>
            )}
          </nav>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
