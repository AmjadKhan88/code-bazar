import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { AddToCartButton } from "@/components/AddToCartButton";
import { JsonLd } from "@/components/JsonLd";
import { getAllProductSlugs, getProductBySlug } from "@/lib/catalog";
import { buildMetadata, getSiteUrl, SITE_NAME } from "@/lib/seo";

export const revalidate = 3600;

const STANDARD_LICENSING_FAQS = [
  {
    question: "What does the CodeBazaar Commercial License include?",
    answer:
      "Every purchase includes full access to the source code repository, lifetime updates for the major version, and commercial rights to build and deploy a production application.",
  },
  {
    question: "How do I download the source code after purchase?",
    answer:
      "Immediately after Stripe Checkout completes, your order and license key are generated and a signed, time-limited download link is unlocked on your order confirmation and Buyer Dashboard.",
  },
];

export async function generateStaticParams() {
  const slugs = await getAllProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { product } = await getProductBySlug(slug);

  if (!product) {
    return buildMetadata({
      title: "Product Not Found",
      description: "The requested source code product could not be found.",
      slug: `/products/${slug}`,
      noIndex: true,
    });
  }

  return buildMetadata({
    title: product.metaTitle || product.title,
    description: product.metaDescription || product.tagline,
    slug: `/products/${product.slug}`,
    images: product.images,
  });
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { slug } = await params;
  const { product, reviews } = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const siteUrl = getSiteUrl();
  const productUrl = `${siteUrl}/products/${product.slug}`;
  const primaryImage =
    product.images[0] || "/images/products/saas-launchpad.png";
  const absoluteImageUrl = primaryImage.startsWith("http")
    ? primaryImage
    : `${siteUrl}${primaryImage}`;

  const allFaqs = [...product.faqs, ...STANDARD_LICENSING_FAQS];

  const productJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.metaDescription || product.tagline,
    image: [absoluteImageUrl],
    sku: product.slug,
    brand: {
      "@type": "Brand",
      name: SITE_NAME,
    },
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: product.currency,
      price: product.price.toFixed(2),
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: SITE_NAME,
      },
    },
  };

  if (reviews.length > 0 || product.ratingCount > 0) {
    const count = reviews.length > 0 ? reviews.length : product.ratingCount;
    const avg =
      reviews.length > 0
        ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
        : product.ratingAverage;
    productJsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(avg.toFixed(1)),
      reviewCount: count,
      bestRating: 5,
      worstRating: 1,
    };
  }

  const breadcrumbItems = [
    { name: "Home", url: siteUrl },
    { name: "Products", url: `${siteUrl}/products` },
  ];
  if (product.category) {
    breadcrumbItems.push({
      name: product.category.name,
      url: `${siteUrl}/category/${product.category.slug}`,
    });
  }
  breadcrumbItems.push({ name: product.title, url: productUrl });

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: item.url,
    })),
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: allFaqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <div className="flex min-h-screen flex-col">
      <JsonLd data={productJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={faqJsonLd} />
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {/* Visible Breadcrumb Trail */}
        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex flex-wrap items-center gap-2 text-xs text-stone-600"
        >
          <Link href="/" className="hover:text-stone-950 hover:underline">
            Home
          </Link>
          <span aria-hidden="true">/</span>
          <Link
            href="/products"
            className="hover:text-stone-950 hover:underline"
          >
            Products
          </Link>
          {product.category && (
            <>
              <span aria-hidden="true">/</span>
              <Link
                href={`/category/${product.category.slug}`}
                className="hover:text-stone-950 hover:underline"
              >
                {product.category.name}
              </Link>
            </>
          )}
          <span aria-hidden="true">/</span>
          <span className="font-medium text-stone-950">{product.title}</span>
        </nav>

        {/* Product Hero */}
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
              <Image
                src={primaryImage}
                alt={product.title}
                width={1200}
                height={675}
                priority
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="h-auto w-full object-cover"
              />
            </div>

            {/* Description & Features */}
            <section className="mt-8 rounded-xl border border-stone-200 bg-white p-6">
              <h2 className="text-lg font-bold text-stone-950">Overview</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-stone-700">
                {product.description}
              </p>

              {product.features.length > 0 && (
                <div className="mt-6 border-t border-stone-100 pt-6">
                  <h3 className="text-base font-semibold text-stone-950">
                    What&apos;s Included
                  </h3>
                  <ul className="mt-3 space-y-2 text-sm text-stone-700">
                    {product.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <span className="font-bold text-emerald-700">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          </div>

          {/* Purchase Sidebar */}
          <aside className="lg:col-span-5">
            <div className="rounded-xl border border-stone-200 bg-white p-6">
              <div className="flex items-center justify-between text-xs text-stone-600">
                <span>By {product.creatorName}</span>
                <span className="font-mono">v{product.version}</span>
              </div>

              <h1 className="mt-2 text-2xl font-bold tracking-tight text-stone-950">
                {product.title}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">
                {product.tagline}
              </p>

              <div className="mt-5 flex items-baseline justify-between border-y border-stone-100 py-4">
                <div>
                  <span className="text-3xl font-bold text-stone-950">
                    ${product.price}
                  </span>
                  <span className="ml-1.5 text-xs font-medium text-stone-500">
                    {product.currency} &middot; one-time
                  </span>
                </div>
                {product.ratingCount > 0 && (
                  <div className="text-sm text-stone-700">
                    <span className="font-semibold text-stone-950">
                      ★ {product.ratingAverage.toFixed(1)}
                    </span>{" "}
                    <span className="text-stone-500">
                      ({reviews.length || product.ratingCount} reviews)
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-5">
                <AddToCartButton
                  item={{
                    productId: product.id,
                    slug: product.slug,
                    title: product.title,
                    price: product.price,
                    currency: product.currency,
                    image: primaryImage,
                  }}
                />
              </div>

              <dl className="mt-6 space-y-3 border-t border-stone-100 pt-5 text-xs">
                <div className="flex justify-between">
                  <dt className="text-stone-500">License</dt>
                  <dd className="font-medium text-stone-900">
                    Commercial Single-Team
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone-500">Delivery</dt>
                  <dd className="font-medium text-stone-900">
                    Signed ZIP Download
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone-500">Last Updated</dt>
                  <dd className="font-medium text-stone-900">
                    {new Date(product.updatedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </dd>
                </div>
              </dl>

              {/* Tech Stack */}
              {product.techStack.length > 0 && (
                <div className="mt-6 border-t border-stone-100 pt-5">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-700">
                    Tech Stack
                  </h2>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {product.techStack.map((tech) => (
                      <span
                        key={tech}
                        className="rounded-md bg-stone-100 px-2.5 py-1 font-mono text-xs text-stone-800"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {product.tags.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {product.tags.map((tag) => (
                    <Link
                      key={tag.id}
                      href={`/tag/${tag.slug}`}
                      className="rounded-full border border-stone-200 px-2.5 py-0.5 text-xs text-stone-600 hover:border-emerald-700 hover:text-emerald-800"
                    >
                      #{tag.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>

        {/* Reviews */}
        {reviews.length > 0 && (
          <section className="mt-12 rounded-xl border border-stone-200 bg-white p-6">
            <h2 className="text-lg font-bold text-stone-950">
              Verified Buyer Reviews ({reviews.length})
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {reviews.map((review) => (
                <article
                  key={review.id}
                  className="rounded-lg border border-stone-100 bg-stone-50 p-4"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-stone-900">
                      {review.authorName}
                    </span>
                    <span className="font-semibold text-amber-700">
                      {"★".repeat(review.rating)}
                    </span>
                  </div>
                  <h3 className="mt-1.5 text-sm font-semibold text-stone-950">
                    {review.title}
                  </h3>
                  <p className="mt-1 text-sm text-stone-600">
                    {review.comment}
                  </p>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Visible FAQ Section matching FAQPage Schema */}
        <section className="mt-10 rounded-xl border border-stone-200 bg-white p-6">
          <h2 className="text-lg font-bold text-stone-950">
            Licensing &amp; Technical FAQ
          </h2>
          <dl className="mt-4 divide-y divide-stone-100">
            {allFaqs.map((faq) => (
              <div key={faq.question} className="py-4 first:pt-0 last:pb-0">
                <dt className="text-sm font-semibold text-stone-950">
                  {faq.question}
                </dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-stone-600">
                  {faq.answer}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
