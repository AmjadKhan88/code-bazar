import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ProductCard } from "@/components/ProductCard";
import { SearchBar } from "@/components/SearchBar";
import { JsonLd } from "@/components/JsonLd";
import { getCategories, queryProducts } from "@/lib/catalog";
import { buildMetadata, getSiteUrl } from "@/lib/seo";

export const revalidate = 3600;

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((c) => ({ slug: c.slug }));
}

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    q?: string;
    sort?: string;
    tag?: string;
    page?: string;
  }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const sp = await searchParams;
  const categories = await getCategories();
  const category = categories.find((c) => c.slug === slug);

  if (!category) {
    return buildMetadata({
      title: "Category Not Found",
      description: "The requested category could not be found.",
      slug: `/category/${slug}`,
      noIndex: true,
    });
  }

  const hasQueryFilters = Boolean(sp.q || sp.sort || sp.tag || sp.page);

  return buildMetadata({
    title: category.metaTitle || `${category.name} — Source Code`,
    description: category.metaDescription || category.description,
    slug: `/category/${category.slug}`,
    canonicalSlug: `/category/${category.slug}`,
    noIndex: hasQueryFilters,
  });
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const q = sp.q?.trim() || "";
  const sort = sp.sort || "popular";
  const tagSlug = sp.tag || "";
  const pageNum = Math.max(1, Number(sp.page || "1") || 1);

  const { products, total, category } = await queryProducts({
    categorySlug: slug,
    query: q,
    sort,
    tagSlug,
    page: pageNum,
    limit: 12,
  });

  if (!category) {
    notFound();
  }

  const siteUrl = getSiteUrl();
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: category.name,
    numberOfItems: products.length,
    itemListElement: products.map((p, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      url: `${siteUrl}/products/${p.slug}`,
      name: p.title,
    })),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      {
        "@type": "ListItem",
        position: 2,
        name: "Products",
        item: `${siteUrl}/products`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: category.name,
        item: `${siteUrl}/category/${category.slug}`,
      },
    ],
  };

  return (
    <div className="flex min-h-screen flex-col">
      <JsonLd data={itemListJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        <nav
          aria-label="Breadcrumb"
          className="mb-4 flex items-center gap-2 text-xs text-stone-600"
        >
          <Link href="/" className="hover:text-stone-950 hover:underline">
            Home
          </Link>
          <span>/</span>
          <Link
            href="/products"
            className="hover:text-stone-950 hover:underline"
          >
            Products
          </Link>
          <span>/</span>
          <span className="font-medium text-stone-950">{category.name}</span>
        </nav>

        <div className="border-b border-stone-200 pb-6">
          <h1 className="text-3xl font-bold tracking-tight text-stone-950">
            {category.name}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-stone-600">
            {category.description}
          </p>
          <p className="mt-2 text-xs font-medium text-stone-500">
            {total} {total === 1 ? "listing" : "listings"}
          </p>

          <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="w-full max-w-md">
              <SearchBar
                initialQuery={q}
                basePath={`/category/${category.slug}`}
                placeholder={`Search within ${category.name}...`}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold text-stone-700">Sort:</span>
              {[
                { key: "popular", label: "Popular" },
                { key: "newest", label: "Newest" },
                { key: "price-asc", label: "Price: Low" },
                { key: "price-desc", label: "Price: High" },
              ].map((opt) => {
                const active = sort === opt.key;
                const nextSp = new URLSearchParams();
                if (q) nextSp.set("q", q);
                if (opt.key !== "popular") nextSp.set("sort", opt.key);
                const href = nextSp.toString()
                  ? `/category/${category.slug}?${nextSp.toString()}`
                  : `/category/${category.slug}`;
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
        </div>

        {products.length === 0 ? (
          <div className="mt-10 rounded-xl border border-stone-200 bg-white p-10 text-center">
            <p className="text-base font-semibold text-stone-900">
              No products matched your filter in {category.name}.
            </p>
            <Link
              href={`/category/${category.slug}`}
              className="mt-4 inline-block rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              Clear Filters
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
      </main>

      <SiteFooter />
    </div>
  );
}
