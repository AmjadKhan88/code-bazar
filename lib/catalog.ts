import { unstable_cache } from "next/cache";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import { Category } from "@/models/Category";
import { Tag } from "@/models/Tag";
import { Review } from "@/models/Review";
import "@/models/User";

export interface PublicCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  metaTitle: string;
  metaDescription: string;
}

export interface PublicTag {
  id: string;
  name: string;
  slug: string;
  description: string;
}

export interface PublicReview {
  id: string;
  rating: number;
  title: string;
  comment: string;
  authorName: string;
  verifiedPurchase: boolean;
  createdAt: string;
}

export interface PublicProduct {
  id: string;
  title: string;
  slug: string;
  tagline: string;
  description: string;
  metaTitle: string;
  metaDescription: string;
  price: number;
  currency: string;
  images: string[];
  techStack: string[];
  version: string;
  demoUrl: string;
  features: string[];
  faqs: { question: string; answer: string }[];
  featured: boolean;
  ratingAverage: number;
  ratingCount: number;
  salesCount: number;
  updatedAt: string;
  creatorName: string;
  category: { id: string; name: string; slug: string } | null;
  tags: { id: string; name: string; slug: string }[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeProduct(doc: any): PublicProduct {
  const cat = doc.categoryId;
  const creator = doc.creatorId;
  const tagList = Array.isArray(doc.tagIds) ? doc.tagIds : [];

  return {
    id: String(doc._id),
    title: String(doc.title),
    slug: String(doc.slug),
    tagline: String(doc.tagline),
    description: String(doc.description),
    metaTitle: String(doc.metaTitle),
    metaDescription: String(doc.metaDescription),
    price: Number(doc.price),
    currency: String(doc.currency || "USD"),
    images: Array.isArray(doc.images) ? doc.images.map(String) : [],
    techStack: Array.isArray(doc.techStack) ? doc.techStack.map(String) : [],
    version: String(doc.version || "1.0.0"),
    demoUrl: String(doc.demoUrl || ""),
    features: Array.isArray(doc.features) ? doc.features.map(String) : [],
    faqs: Array.isArray(doc.faqs)
      ? doc.faqs.map((f: { question: string; answer: string }) => ({
          question: String(f.question),
          answer: String(f.answer),
        }))
      : [],
    featured: Boolean(doc.featured),
    ratingAverage: Number(doc.ratingAverage || 0),
    ratingCount: Number(doc.ratingCount || 0),
    salesCount: Number(doc.salesCount || 0),
    updatedAt: doc.updatedAt
      ? new Date(doc.updatedAt).toISOString()
      : new Date().toISOString(),
    creatorName: creator?.name ? String(creator.name) : "CodeBazaar Creator",
    category:
      cat && cat.slug
        ? { id: String(cat._id), name: String(cat.name), slug: String(cat.slug) }
        : null,
    tags: tagList
      .filter((t: { slug?: string }) => t && t.slug)
      .map((t: { _id: unknown; name: string; slug: string }) => ({
        id: String(t._id),
        name: String(t.name),
        slug: String(t.slug),
      })),
  };
}

export const getCategories = unstable_cache(
  async (): Promise<PublicCategory[]> => {
    await connectDB();
    const docs = await Category.find().sort({ name: 1 }).lean();
    return docs.map((c) => ({
      id: String(c._id),
      name: c.name,
      slug: c.slug,
      description: c.description,
      metaTitle: c.metaTitle || `${c.name} | CodeBazaar`,
      metaDescription: c.metaDescription || c.description,
    }));
  },
  ["categories-all"],
  { revalidate: 3600, tags: ["categories", "products"] }
);

export const getTags = unstable_cache(
  async (): Promise<PublicTag[]> => {
    await connectDB();
    const docs = await Tag.find().sort({ name: 1 }).lean();
    return docs.map((t) => ({
      id: String(t._id),
      name: t.name,
      slug: t.slug,
      description: t.description || "",
    }));
  },
  ["tags-all"],
  { revalidate: 3600, tags: ["tags", "products"] }
);

export const getFeaturedProducts = unstable_cache(
  async (): Promise<PublicProduct[]> => {
    await connectDB();
    const docs = await Product.find({ published: true })
      .sort({ featured: -1, salesCount: -1 })
      .limit(6)
      .populate("categoryId", "name slug")
      .populate("tagIds", "name slug")
      .populate("creatorId", "name")
      .lean();
    return docs.map(serializeProduct);
  },
  ["featured-products"],
  { revalidate: 3600, tags: ["products"] }
);

export async function getAllProductSlugs(): Promise<string[]> {
  await connectDB();
  const docs = await Product.find({ published: true }).select("slug").lean();
  return docs.map((d) => d.slug);
}

export async function getProductBySlug(slug: string): Promise<{
  product: PublicProduct | null;
  reviews: PublicReview[];
}> {
  const fetcher = unstable_cache(
    async () => {
      await connectDB();
      const doc = await Product.findOne({ slug, published: true })
        .populate("categoryId", "name slug")
        .populate("tagIds", "name slug")
        .populate("creatorId", "name")
        .lean();

      if (!doc) {
        return { product: null, reviews: [] };
      }

      const reviewDocs = await Review.find({ productId: doc._id })
        .populate("userId", "name")
        .sort({ createdAt: -1 })
        .lean();

      const reviews: PublicReview[] = reviewDocs.map((r) => ({
        id: String(r._id),
        rating: Number(r.rating),
        title: String(r.title),
        comment: String(r.comment),
        authorName:
          (r.userId as { name?: string } | null)?.name || "Verified Buyer",
        verifiedPurchase: Boolean(r.verifiedPurchase),
        createdAt: r.createdAt
          ? new Date(r.createdAt).toISOString()
          : new Date().toISOString(),
      }));

      return {
        product: serializeProduct(doc),
        reviews,
      };
    },
    [`product-detail-${slug}`],
    { revalidate: 3600, tags: ["products", `product-${slug}`] }
  );

  return fetcher();
}

export interface ProductQueryOptions {
  page?: number;
  limit?: number;
  categorySlug?: string;
  tagSlug?: string;
  query?: string;
  sort?: string;
}

export async function queryProducts({
  page = 1,
  limit = 4,
  categorySlug,
  tagSlug,
  query,
  sort = "popular",
}: ProductQueryOptions): Promise<{
  products: PublicProduct[];
  total: number;
  page: number;
  totalPages: number;
  category: PublicCategory | null;
  tag: PublicTag | null;
}> {
  await connectDB();

  const filter: Record<string, unknown> = { published: true };
  let resolvedCategory: PublicCategory | null = null;
  let resolvedTag: PublicTag | null = null;

  if (categorySlug) {
    const cat = await Category.findOne({ slug: categorySlug }).lean();
    if (cat) {
      filter.categoryId = cat._id;
      resolvedCategory = {
        id: String(cat._id),
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        metaTitle: cat.metaTitle || `${cat.name} | CodeBazaar`,
        metaDescription: cat.metaDescription || cat.description,
      };
    } else {
      return {
        products: [],
        total: 0,
        page: 1,
        totalPages: 1,
        category: null,
        tag: null,
      };
    }
  }

  if (tagSlug) {
    const tag = await Tag.findOne({ slug: tagSlug }).lean();
    if (tag) {
      filter.tagIds = tag._id;
      resolvedTag = {
        id: String(tag._id),
        name: tag.name,
        slug: tag.slug,
        description: tag.description || "",
      };
    } else {
      return {
        products: [],
        total: 0,
        page: 1,
        totalPages: 1,
        category: resolvedCategory,
        tag: null,
      };
    }
  }

  if (query && query.trim().length > 0) {
    const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "i");
    filter.$or = [
      { title: regex },
      { tagline: regex },
      { description: regex },
      { techStack: regex },
    ];
  }

  const sortSpec: Record<string, 1 | -1> =
    sort === "price-asc"
      ? { price: 1 }
      : sort === "price-desc"
        ? { price: -1 }
        : sort === "newest"
          ? { createdAt: -1 }
          : { salesCount: -1, ratingAverage: -1 };

  const safePage = Math.max(1, page);
  const skip = (safePage - 1) * limit;

  const [total, docs] = await Promise.all([
    Product.countDocuments(filter),
    Product.find(filter)
      .sort(sortSpec)
      .skip(skip)
      .limit(limit)
      .populate("categoryId", "name slug")
      .populate("tagIds", "name slug")
      .populate("creatorId", "name")
      .lean(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    products: docs.map(serializeProduct),
    total,
    page: safePage,
    totalPages,
    category: resolvedCategory,
    tag: resolvedTag,
  };
}
