import type { Metadata } from "next";

export const SITE_NAME = "CodeBazaar";
export const SITE_TAGLINE = "CodeBazaar — the source-code bazaar for builders.";

export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}

export interface BuildMetadataInput {
  title: string;
  description: string;
  /** Route path starting with '/', e.g. '/products/launchpad-pro' or '/' */
  slug: string;
  images?: string[];
  /** Override canonical path (e.g., clean base category URL when query filters are active) */
  canonicalSlug?: string;
  noIndex?: boolean;
  type?: "website" | "article";
}

export function buildMetadata({
  title,
  description,
  slug,
  images = ["/images/products/saas-launchpad.png"],
  canonicalSlug,
  noIndex = false,
  type = "website",
}: BuildMetadataInput): Metadata {
  const siteUrl = getSiteUrl();
  const normalizedPath = slug.startsWith("/") ? slug : `/${slug}`;
  const canonicalPath = canonicalSlug
    ? canonicalSlug.startsWith("/")
      ? canonicalSlug
      : `/${canonicalSlug}`
    : normalizedPath;

  const canonicalUrl = `${siteUrl}${canonicalPath === "/" ? "" : canonicalPath}` || siteUrl;
  const absoluteImages = images.map((img) =>
    img.startsWith("http") ? img : `${siteUrl}${img.startsWith("/") ? img : `/${img}`}`
  );

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: noIndex
      ? { index: false, follow: true }
      : { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: SITE_NAME,
      type,
      images: absoluteImages.map((url) => ({
        url,
        width: 1200,
        height: 675,
        alt: title,
      })),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: absoluteImages,
    },
  };
}

export function serializeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
