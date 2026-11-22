import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ClearCartOnSuccess } from "@/components/ClearCartOnSuccess";
import { connectDB } from "@/lib/db";
import { Order } from "@/models/Order";
import { License } from "@/models/License";
import { buildSignedDownloadUrl } from "@/lib/download";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: "Order Confirmed",
    description: "Your CodeBazaar order and signed download links.",
    slug: "/checkout/success",
    noIndex: true,
  });
}

interface CheckoutSuccessProps {
  searchParams: Promise<{ session_id?: string }>;
}

export default async function CheckoutSuccessPage({
  searchParams,
}: CheckoutSuccessProps) {
  const { session_id: sessionId } = await searchParams;

  await connectDB();
  const order = sessionId
    ? await Order.findOne({ stripeSessionId: sessionId }).lean()
    : null;

  const licenses = order
    ? await License.find({ orderId: order._id })
        .populate("productId", "title slug")
        .lean()
    : [];

  return (
    <div className="flex min-h-screen flex-col">
      <ClearCartOnSuccess />
      <SiteHeader />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6">
        {!order ? (
          <div className="rounded-xl border border-stone-200 bg-white p-8 text-center">
            <h1 className="text-2xl font-bold text-stone-950">
              Order Not Found
            </h1>
            <p className="mt-2 text-sm text-stone-600">
              We could not locate a completed order for this session.
            </p>
            <Link
              href="/products"
              className="mt-5 inline-block rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white"
            >
              Return to Catalog
            </Link>
          </div>
        ) : (
          <div className="rounded-xl border border-stone-200 bg-white p-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              Payment Confirmed
            </p>
            <h1 className="mt-2 text-2xl font-bold text-stone-950">
              Thank you for your purchase!
            </h1>
            <p className="mt-1 text-sm text-stone-600">
              Order confirmation &amp; licenses issued for{" "}
              <span className="font-medium text-stone-900">
                {order.buyerEmail}
              </span>
              . Download links are time-limited (15 minutes) and can also be
              regenerated anytime in your{" "}
              <Link href="/dashboard" className="text-emerald-800 underline">
                Buyer Dashboard
              </Link>
              .
            </p>

            <div className="mt-6 space-y-4 border-t border-stone-100 pt-6">
              {licenses.map((lic) => {
                const prod = lic.productId as unknown as {
                  _id: unknown;
                  title?: string;
                  slug?: string;
                };
                const signedUrl = buildSignedDownloadUrl(
                  String(lic._id),
                  String(prod?._id || lic.productId)
                );
                return (
                  <div
                    key={String(lic._id)}
                    className="flex flex-col justify-between gap-4 rounded-lg border border-stone-200 bg-stone-50 p-4 sm:flex-row sm:items-center"
                  >
                    <div>
                      <p className="text-sm font-semibold text-stone-950">
                        {prod?.title || "Source Code Package"}
                      </p>
                      <p className="mt-1 font-mono text-xs text-stone-600">
                        License: {lic.licenseKey}
                      </p>
                    </div>
                    <a
                      href={signedUrl}
                      className="inline-flex shrink-0 items-center justify-center rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
                    >
                      Download Source Code
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
