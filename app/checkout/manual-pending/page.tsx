import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ClearCartOnSuccess } from "@/components/ClearCartOnSuccess";
import { connectDB } from "@/lib/db";
import { Order } from "@/models/Order";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: "Payment Submitted — Pending Verification",
    description:
      "Your manual payment has been submitted and is awaiting verification.",
    slug: "/checkout/manual-pending",
    noIndex: true,
  });
}

interface ManualPendingPageProps {
  searchParams: Promise<{ orderId?: string }>;
}

export default async function ManualPendingPage({
  searchParams,
}: ManualPendingPageProps) {
  const { orderId } = await searchParams;

  await connectDB();
  const order = orderId ? await Order.findById(orderId).lean() : null;

  return (
    <div className="flex min-h-screen flex-col">
      <ClearCartOnSuccess />
      <SiteHeader />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-14 sm:px-6">
        <div className="rounded-xl border border-stone-200 bg-white p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
            <svg
              className="h-7 w-7 text-amber-700"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h1 className="mt-5 text-2xl font-bold text-stone-950">
            Payment Submitted — Awaiting Verification
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-stone-600">
            Your payment screenshot and details have been received. We will
            verify the transfer and email your source code download links
            within <strong>24 hours</strong>.
          </p>

          {order && (
            <div className="mx-auto mt-6 max-w-sm rounded-lg border border-stone-200 bg-stone-50 p-4 text-left text-sm">
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-stone-500">Order ID</dt>
                  <dd className="font-mono text-xs text-stone-900">
                    {String(order._id).slice(-8).toUpperCase()}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone-500">Amount</dt>
                  <dd className="font-semibold text-stone-900">
                    ${order.totalAmount} {order.currency}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone-500">Account</dt>
                  <dd className="font-medium text-stone-900">
                    {order.paymentAccount}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone-500">Email</dt>
                  <dd className="text-stone-900">{order.buyerEmail}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone-500">WhatsApp</dt>
                  <dd className="text-stone-900">{order.buyerWhatsapp}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone-500">Status</dt>
                  <dd>
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                      Pending Verification
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
          )}

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/products"
              className="rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              Continue Browsing
            </Link>
            <Link
              href="/dashboard"
              className="rounded-lg border border-stone-300 bg-white px-5 py-2.5 text-sm font-semibold text-stone-800 hover:bg-stone-100"
            >
              View Dashboard
            </Link>
          </div>

          <p className="mt-6 text-xs text-stone-500">
            Need help? Contact us on WhatsApp at{" "}
            <strong>+92 306 9534618</strong> or email{" "}
            <strong>admin@codebazaar.dev</strong>
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
