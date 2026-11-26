import type { MetadataRoute } from "next";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import { Category } from "@/models/Category";
import { Tag } from "@/models/Tag";
import { getSiteUrl } from "@/lib/seo";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/products`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  try {
    await connectDB();

    const [products, categories, tags] = await Promise.all([
      Product.find({ published: true })
        .select("slug updatedAt")
        .sort({ updatedAt: -1 })
        .lean(),
      Category.find().select("slug updatedAt").lean(),
      Tag.find().select("slug updatedAt").lean(),
    ]);

    const productEntries: MetadataRoute.Sitemap = products.map((product) => ({
      url: `${siteUrl}/products/${product.slug}`,
      lastModified: product.updatedAt ?? now,
      changeFrequency: "weekly",
      priority: 0.85,
    }));

    const categoryEntries: MetadataRoute.Sitemap = categories.map((cat) => ({
      url: `${siteUrl}/category/${cat.slug}`,
      lastModified: cat.updatedAt ?? now,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    const tagEntries: MetadataRoute.Sitemap = tags.map((tag) => ({
      url: `${siteUrl}/tag/${tag.slug}`,
      lastModified: tag.updatedAt ?? now,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    return [
      ...staticEntries,
      ...categoryEntries,
      ...productEntries,
      ...tagEntries,
    ];
  } catch {
    return staticEntries;
  }
}
