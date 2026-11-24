import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SignOutButton } from "@/components/SignOutButton";
import { getAuthSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Order } from "@/models/Order";
import { License } from "@/models/License";
import "@/models/Product";
import { buildSignedDownloadUrl } from "@/lib/download";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: "Buyer Dashboard",
    description: "View your CodeBazaar order history and source code downloads.",
    slug: "/dashboard",
    noIndex: true,
  });
}

export default async function BuyerDashboardPage() {
  const session = await getAuthSession();
  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard");
  }

  await connectDB();

  const email = session.user.email?.toLowerCase() || "";
  const [orders, licenses] = await Promise.all([
    Order.find({
      $or: [{ buyerId: session.user.id }, { buyerEmail: email }],
    })
      .sort({ createdAt: -1 })
      .lean(),
    License.find({
      $or: [{ buyerId: session.user.id }, { buyerEmail: email }],
      active: true,
    })
      .populate("productId", "title slug version")
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 pb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-stone-950">
              Buyer Dashboard
            </h1>
            <p className="mt-1 text-sm text-stone-600">
              Signed in as{" "}
              <span className="font-medium text-stone-900">
                {session.user.email}
              </span>{" "}
              ({session.user.role})
            </p>
          </div>
          <div className="flex items-center gap-3">
            {(session.user.role === "CREATOR" ||
              session.user.role === "ADMIN") && (
              <Link
                href="/seller"
                className="rounded-lg border border-stone-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-stone-800 hover:bg-stone-100"
              >
                Creator Studio
              </Link>
            )}
            {session.user.role === "ADMIN" && (
              <Link
                href="/admin"
                className="rounded-lg border border-stone-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-stone-800 hover:bg-stone-100"
              >
                Admin Overview
              </Link>
            )}
            <SignOutButton />
          </div>
        </div>

        {/* Active Licenses & Downloads */}
        <section className="mt-8">
          <h2 className="text-lg font-bold text-stone-950">
            Your Licenses &amp; Downloads ({licenses.length})
          </h2>
          {licenses.length === 0 ? (
            <div className="mt-4 rounded-xl border border-stone-200 bg-white p-8 text-center">
              <p className="text-sm text-stone-600">
                You have not purchased any source code licenses yet.
              </p>
              <Link
                href="/products"
                className="mt-4 inline-block rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white"
              >
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {licenses.map((lic) => {
                const prod = lic.productId as unknown as {
                  _id?: unknown;
                  title?: string;
                  slug?: string;
                  version?: string;
                };
                const productIdStr = String(prod?._id || lic.productId);
                const signedUrl = buildSignedDownloadUrl(
                  String(lic._id),
                  productIdStr
                );

                return (
                  <div
                    key={String(lic._id)}
                    className="flex flex-col justify-between gap-4 rounded-xl border border-stone-200 bg-white p-5 sm:flex-row sm:items-center"
                  >
                    <div>
                      <Link
                        href={prod?.slug ? `/products/${prod.slug}` : "/products"}
                        className="text-base font-semibold text-stone-950 hover:text-emerald-800"
                      >
                        {prod?.title || "Source Code License"}
                      </Link>
                      <div className="mt-1 flex flex-wrap gap-3 text-xs text-stone-600">
                        <span className="font-mono">
                          Key: {lic.licenseKey}
                        </span>
                        <span>&middot;</span>
                        <span>
                          Downloads: {lic.downloadCount}/{lic.maxDownloads}
                        </span>
                        {prod?.version && (
                          <>
                            <span>&middot;</span>
                            <span className="font-mono">v{prod.version}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <a
                      href={signedUrl}
                      className="inline-flex shrink-0 items-center justify-center rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
                    >
                      Download Archive
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Order History */}
        <section className="mt-12">
          <h2 className="text-lg font-bold text-stone-950">
            Order History ({orders.length})
          </h2>
          {orders.length > 0 && (
            <div className="mt-4 overflow-x-auto rounded-xl border border-stone-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase text-stone-600">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Items</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {orders.map((order) => (
                    <tr key={String(order._id)}>
                      <td className="px-4 py-3 text-xs text-stone-600">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 font-medium text-stone-900">
                        {order.items.map((i) => i.title).join(", ")}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-stone-950">
                        ${order.totalAmount} {order.currency}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
