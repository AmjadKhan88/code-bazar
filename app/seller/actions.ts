"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getAuthSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createProductAction(formData: FormData) {
  const session = await getAuthSession();
  if (
    !session?.user ||
    (session.user.role !== "CREATOR" && session.user.role !== "ADMIN")
  ) {
    throw new Error("Unauthorized");
  }

  const title = String(formData.get("title") || "").trim();
  const rawSlug = String(formData.get("slug") || "").trim();
  const slug = slugify(rawSlug || title);
  const tagline = String(formData.get("tagline") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const price = Number(formData.get("price") || 0);
  const categoryId = String(formData.get("categoryId") || "").trim();
  const techStackRaw = String(formData.get("techStack") || "");
  const techStack = techStackRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const downloadUrl =
    String(formData.get("downloadUrl") || "").trim() ||
    `private://archives/${slug}-v1.0.0.zip`;
  const published = formData.get("published") === "on";

  if (!title || !slug || !tagline || !description || !categoryId || price < 0) {
    throw new Error("Missing required product fields.");
  }

  await connectDB();

  await Product.create({
    title,
    slug,
    tagline,
    description,
    metaTitle: `${title} | CodeBazaar`,
    metaDescription: tagline.slice(0, 155),
    price,
    currency: "USD",
    images: ["/images/products/saas-launchpad.png"],
    downloadUrl,
    techStack,
    version: "1.0.0",
    features: [
      "Complete TypeScript source code",
      "Production Next.js 15 App Router architecture",
      "Commercial license included",
    ],
    published,
    featured: false,
    creatorId: session.user.id,
    categoryId,
    tagIds: [],
  });

  revalidateTag("products");
  revalidateTag(`product-${slug}`);
  revalidatePath("/products");
  revalidatePath("/seller");
}

export async function togglePublishProductAction(formData: FormData) {
  const session = await getAuthSession();
  if (
    !session?.user ||
    (session.user.role !== "CREATOR" && session.user.role !== "ADMIN")
  ) {
    throw new Error("Unauthorized");
  }

  const productId = String(formData.get("productId") || "");
  await connectDB();

  const filter =
    session.user.role === "ADMIN"
      ? { _id: productId }
      : { _id: productId, creatorId: session.user.id };

  const product = await Product.findOne(filter);
  if (!product) return;

  product.published = !product.published;
  await product.save();

  revalidateTag("products");
  revalidateTag(`product-${product.slug}`);
  revalidatePath("/products");
  revalidatePath(`/products/${product.slug}`);
  revalidatePath("/seller");
}

export async function deleteProductAction(formData: FormData) {
  const session = await getAuthSession();
  if (
    !session?.user ||
    (session.user.role !== "CREATOR" && session.user.role !== "ADMIN")
  ) {
    throw new Error("Unauthorized");
  }

  const productId = String(formData.get("productId") || "");
  await connectDB();

  const filter =
    session.user.role === "ADMIN"
      ? { _id: productId }
      : { _id: productId, creatorId: session.user.id };

  const deleted = await Product.findOneAndDelete(filter);
  if (deleted) {
    revalidateTag("products");
    revalidateTag(`product-${deleted.slug}`);
    revalidatePath("/products");
    revalidatePath("/seller");
  }
}
