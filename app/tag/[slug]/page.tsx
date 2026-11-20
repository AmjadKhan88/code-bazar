import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ProductCard } from "@/components/ProductCard";
import { JsonLd } from "@/components/JsonLd";
import { getTags, queryProducts } from "@/lib/catalog";
import { buildMetadata, getSiteUrl } from "@/lib/seo";

export const revalidate = 3600;

export async function generateStaticParams() {
  const tags = await getTags();
  return tags.map((t) => ({ slug: t.slug }));
}

interface TagPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string; q?: string; page?: string }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: TagPageProps): Promise<Metadata> {
  const { slug } = await params;
  const sp = await searchParams;
  const tags = await getTags();
  const tag = tags.find((t) => t.slug === slug);

  if (!tag) {
    return buildMetadata({
      title: "Tag Not Found",
      description: "The requested tag could not be found.",
      slug: `/tag/${slug}`,
      noIndex: true,
    });
  }

  const hasQueryFilters = Boolean(sp.sort || sp.q || sp.page);

  return buildMetadata({
    title: `${tag.name} Source Code & Templates`,
    description:
      tag.description ||
      `Explore production-ready ${tag.name} source code, templates, and boilerplates on CodeBazaar.`,
    slug: `/tag/${tag.slug}`,
    canonicalSlug: `/tag/${tag.slug}`,
    noIndex: hasQueryFilters,
  });
}

export default async function TagPage({ params, searchParams }: TagPageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const sort = sp.sort || "popular";
  const q = sp.q?.trim() || "";
  const pageNum = Math.max(1, Number(sp.page || "1") || 1);

  const { products, total, tag } = await queryProducts({
    tagSlug: slug,
    sort,
    query: q,
    page: pageNum,
    limit: 12,
  });

  if (!tag) {
    notFound();
  }

  const siteUrl = getSiteUrl();
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${tag.name} Source Code`,
    numberOfItems: products.length,
    itemListElement: products.map((p, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      url: `${siteUrl}/products/${p.slug}`,
      name: p.title,
    })),
  };

  return (
    <div className="flex min-h-screen flex-col">
      <JsonLd data={itemListJsonLd} />
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
          <span className="font-medium text-stone-950">#{tag.name}</span>
        </nav>

        <div className="border-b border-stone-200 pb-6">
          <h1 className="text-3xl font-bold tracking-tight text-stone-950">
            #{tag.name}
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-stone-600">
            {tag.description ||
              `Source code products tagged with ${tag.name}.`}
          </p>
          <p className="mt-2 text-xs font-medium text-stone-500">
            {total} {total === 1 ? "listing" : "listings"}
          </p>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              priority={index === 0}
            />
          ))}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
