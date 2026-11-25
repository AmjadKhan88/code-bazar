import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SignOutButton } from "@/components/SignOutButton";
import { getAuthSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import { Category } from "@/models/Category";
import { buildMetadata } from "@/lib/seo";
import {
  createProductAction,
  deleteProductAction,
  togglePublishProductAction,
} from "@/app/seller/actions";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: "Creator Studio",
    description: "Manage and publish source code products on CodeBazaar.",
    slug: "/seller",
    noIndex: true,
  });
}

export default async function SellerStudioPage() {
  const session = await getAuthSession();
  if (!session?.user) {
    redirect("/login?callbackUrl=/seller");
  }
  if (session.user.role !== "CREATOR" && session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  await connectDB();

  const productFilter =
    session.user.role === "ADMIN" ? {} : { creatorId: session.user.id };

  const [products, categories] = await Promise.all([
    Product.find(productFilter)
      .populate("categoryId", "name")
      .sort({ updatedAt: -1 })
      .lean(),
    Category.find().sort({ name: 1 }).lean(),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 pb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-stone-950">
              Creator Studio
            </h1>
            <p className="mt-1 text-sm text-stone-600">
              Publish source code listings with automatic ISR cache
              revalidation.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-lg border border-stone-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-stone-800 hover:bg-stone-100"
            >
              Buyer Dashboard
            </Link>
            <SignOutButton />
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-12">
          {/* Create Product Form */}
          <section className="rounded-xl border border-stone-200 bg-white p-6 lg:col-span-5">
            <h2 className="text-lg font-bold text-stone-950">
              Publish New Source Code
            </h2>
            <form action={createProductAction} className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="prod-title"
                  className="block text-xs font-semibold uppercase tracking-wider text-stone-700"
                >
                  Title
                </label>
                <input
                  id="prod-title"
                  name="title"
                  type="text"
                  required
                  placeholder="Next.js Billing Kit"
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="prod-slug"
                    className="block text-xs font-semibold uppercase tracking-wider text-stone-700"
                  >
                    Slug
                  </label>
                  <input
                    id="prod-slug"
                    name="slug"
                    type="text"
                    placeholder="nextjs-billing-kit"
                    className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 font-mono text-sm"
                  />
                </div>
                <div>
                  <label
                    htmlFor="prod-price"
                    className="block text-xs font-semibold uppercase tracking-wider text-stone-700"
                  >
                    Price (USD)
                  </label>
                  <input
                    id="prod-price"
                    name="price"
                    type="number"
                    min={0}
                    required
                    defaultValue={79}
                    className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="prod-category"
                  className="block text-xs font-semibold uppercase tracking-wider text-stone-700"
                >
                  Category
                </label>
                <select
                  id="prod-category"
                  name="categoryId"
                  required
                  className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
                >
                  {categories.map((cat) => (
                    <option key={String(cat._id)} value={String(cat._id)}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="prod-tagline"
                  className="block text-xs font-semibold uppercase tracking-wider text-stone-700"
                >
                  Tagline
                </label>
                <input
                  id="prod-tagline"
                  name="tagline"
                  type="text"
                  required
                  placeholder="Production Stripe subscriptions and webhooks for Next.js 15."
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="prod-desc"
                  className="block text-xs font-semibold uppercase tracking-wider text-stone-700"
                >
                  Description
                </label>
                <textarea
                  id="prod-desc"
                  name="description"
                  rows={3}
                  required
                  placeholder="Detailed technical overview of architecture, database models, and setup."
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="prod-stack"
                  className="block text-xs font-semibold uppercase tracking-wider text-stone-700"
                >
                  Tech Stack (comma-separated)
                </label>
                <input
                  id="prod-stack"
                  name="techStack"
                  type="text"
                  defaultValue="Next.js 15, TypeScript, Tailwind CSS"
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-stone-700">
                <input
                  type="checkbox"
                  name="published"
                  defaultChecked
                  className="h-4 w-4 rounded border-stone-300 text-emerald-700"
                />
                <span>Publish immediately (triggers ISR revalidation)</span>
              </label>

              <button
                type="submit"
                className="w-full rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
              >
                Create Product
              </button>
            </form>
          </section>

          {/* Product List */}
          <section className="lg:col-span-7">
            <h2 className="text-lg font-bold text-stone-950">
              Your Listings ({products.length})
            </h2>
            <div className="mt-4 space-y-3">
              {products.map((p) => {
                const cat = p.categoryId as unknown as { name?: string } | null;
                return (
                  <div
                    key={String(p._id)}
                    className="flex flex-col justify-between gap-4 rounded-xl border border-stone-200 bg-white p-5 sm:flex-row sm:items-center"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/products/${p.slug}`}
                          className="text-base font-semibold text-stone-950 hover:text-emerald-800"
                        >
                          {p.title}
                        </Link>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            p.published
                              ? "bg-emerald-50 text-emerald-800"
                              : "bg-stone-100 text-stone-600"
                          }`}
                        >
                          {p.published ? "Published" : "Draft"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-stone-600">
                        {cat?.name || "Uncategorized"} &middot; ${p.price} &middot;{" "}
                        {p.salesCount} sales
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <form action={togglePublishProductAction}>
                        <input
                          type="hidden"
                          name="productId"
                          value={String(p._id)}
                        />
                        <button
                          type="submit"
                          className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-800 hover:bg-stone-100"
                        >
                          {p.published ? "Unpublish" : "Publish"}
                        </button>
                      </form>
                      <form action={deleteProductAction}>
                        <input
                          type="hidden"
                          name="productId"
                          value={String(p._id)}
                        />
                        <button
                          type="submit"
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
