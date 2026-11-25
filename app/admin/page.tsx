import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SignOutButton } from "@/components/SignOutButton";
import { getAuthSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { License } from "@/models/License";
import { buildMetadata } from "@/lib/seo";
import {
  approveManualPaymentAction,
  rejectManualPaymentAction,
} from "@/app/admin/actions";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: "Admin Overview",
    description: "Marketplace orders and platform metrics for CodeBazaar.",
    slug: "/admin",
    noIndex: true,
  });
}

export default async function AdminOverviewPage() {
  const session = await getAuthSession();
  if (!session?.user) {
    redirect("/login?callbackUrl=/admin");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  await connectDB();

  const [allOrders, productCount, licenseCount] = await Promise.all([
    Order.find().sort({ createdAt: -1 }).limit(100).lean(),
    Product.countDocuments({ published: true }),
    License.countDocuments({ active: true }),
  ]);

  const paidRevenue = allOrders
    .filter((o) => o.status === "PAID")
    .reduce((sum, o) => sum + Number(o.totalAmount), 0);

  const pendingManualOrders = allOrders.filter(
    (o) => o.paymentMethod === "MANUAL" && o.status === "PENDING_VERIFICATION"
  );

  const resolvedOrders = allOrders.filter(
    (o) =>
      o.status === "PAID" ||
      o.status === "REJECTED" ||
      (o.paymentMethod !== "MANUAL" && o.status !== "PENDING_VERIFICATION")
  );

  function statusBadge(status: string) {
    switch (status) {
      case "PAID":
        return "bg-emerald-50 text-emerald-800";
      case "PENDING_VERIFICATION":
        return "bg-amber-50 text-amber-800";
      case "REJECTED":
        return "bg-red-50 text-red-700";
      default:
        return "bg-stone-100 text-stone-700";
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 pb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-stone-950">
              Admin Overview
            </h1>
            <p className="mt-1 text-sm text-stone-600">
              Review manual payments, approve orders, and monitor marketplace
              health.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/seller"
              className="rounded-lg border border-stone-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-stone-800 hover:bg-stone-100"
            >
              Creator Studio
            </Link>
            <SignOutButton />
          </div>
        </div>

        {/* KPI Cards */}
        <div className="mt-8 grid gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-stone-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Gross Revenue
            </p>
            <p className="mt-2 text-2xl font-bold text-stone-950">
              ${paidRevenue}
            </p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Total Orders
            </p>
            <p className="mt-2 text-2xl font-bold text-stone-950">
              {allOrders.length}
            </p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
              Pending Verification
            </p>
            <p className="mt-2 text-2xl font-bold text-amber-800">
              {pendingManualOrders.length}
            </p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Published Products
            </p>
            <p className="mt-2 text-2xl font-bold text-stone-950">
              {productCount}
            </p>
          </div>
        </div>

        {/* Pending Manual Payment Verifications */}
        {pendingManualOrders.length > 0 && (
          <section className="mt-10">
            <h2 className="flex items-center gap-2 text-lg font-bold text-stone-950">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-200 text-xs font-bold text-amber-900">
                {pendingManualOrders.length}
              </span>
              Manual Payments Awaiting Verification
            </h2>

            <div className="mt-4 space-y-5">
              {pendingManualOrders.map((order) => (
                <div
                  key={String(order._id)}
                  className="rounded-xl border-2 border-amber-200 bg-white p-5"
                >
                  <div className="grid gap-4 md:grid-cols-12">
                    {/* Order Info */}
                    <div className="space-y-2 md:col-span-7">
                      <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600">
                        <span className="font-mono font-bold text-stone-900">
                          #{String(order._id).slice(-8).toUpperCase()}
                        </span>
                        <span className={`rounded-full px-2.5 py-0.5 font-semibold ${statusBadge(order.status)}`}>
                          {order.status.replace("_", " ")}
                        </span>
                        <span>
                          {new Date(order.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <div className="rounded-lg bg-stone-50 p-3 text-sm">
                        <dl className="grid gap-y-1.5 sm:grid-cols-2">
                          <div>
                            <dt className="text-xs text-stone-500">Buyer Email</dt>
                            <dd className="font-medium text-stone-900">
                              {order.buyerEmail}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs text-stone-500">WhatsApp</dt>
                            <dd className="font-medium text-stone-900">
                              {order.buyerWhatsapp || "N/A"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs text-stone-500">Payment Account</dt>
                            <dd className="font-semibold text-emerald-800">
                              {order.paymentAccount}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs text-stone-500">Total</dt>
                            <dd className="font-bold text-stone-950">
                              ${order.totalAmount} {order.currency}
                            </dd>
                          </div>
                          {order.transactionReference && (
                            <div className="sm:col-span-2">
                              <dt className="text-xs text-stone-500">Transaction Ref</dt>
                              <dd className="font-mono text-stone-900">
                                {order.transactionReference}
                              </dd>
                            </div>
                          )}
                          {order.buyerNotes && (
                            <div className="sm:col-span-2">
                              <dt className="text-xs text-stone-500">Buyer Notes / Query</dt>
                              <dd className="text-stone-800">
                                {order.buyerNotes}
                              </dd>
                            </div>
                          )}
                        </dl>
                      </div>

                      <div className="text-xs text-stone-600">
                        <span className="font-semibold">Items:</span>{" "}
                        {order.items
                          .map((i) => `${i.title} ($${i.price})`)
                          .join(" · ")}
                      </div>
                    </div>

                    {/* Screenshot + Actions */}
                    <div className="flex flex-col gap-3 md:col-span-5">
                      {order.screenshotUrl && (
                        <a
                          href={order.screenshotUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block overflow-hidden rounded-lg border border-stone-200"
                        >
                          <Image
                            src={order.screenshotUrl}
                            alt="Payment screenshot"
                            width={500}
                            height={400}
                            className="h-auto max-h-56 w-full object-contain bg-stone-50"
                            unoptimized
                          />
                          <p className="bg-stone-50 px-2 py-1 text-center text-xs text-stone-600">
                            Click to view full screenshot
                          </p>
                        </a>
                      )}

                      {/* Approve */}
                      <form action={approveManualPaymentAction}>
                        <input
                          type="hidden"
                          name="orderId"
                          value={String(order._id)}
                        />
                        <input
                          type="text"
                          name="adminNote"
                          placeholder="Admin note (optional)"
                          className="mb-2 w-full rounded-lg border border-stone-300 px-3 py-1.5 text-xs"
                        />
                        <button
                          type="submit"
                          className="w-full rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800"
                        >
                          ✓ Approve &amp; Send Source Code
                        </button>
                      </form>

                      {/* Reject */}
                      <form action={rejectManualPaymentAction}>
                        <input
                          type="hidden"
                          name="orderId"
                          value={String(order._id)}
                        />
                        <input
                          type="text"
                          name="adminNote"
                          placeholder="Rejection reason (optional)"
                          className="mb-2 w-full rounded-lg border border-stone-300 px-3 py-1.5 text-xs"
                        />
                        <button
                          type="submit"
                          className="w-full rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-xs font-bold text-red-700 hover:bg-red-100"
                        >
                          ✕ Reject Payment
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* All Resolved Orders Table */}
        <section className="mt-10">
          <h2 className="text-lg font-bold text-stone-950">
            All Orders ({resolvedOrders.length})
          </h2>
          {resolvedOrders.length > 0 && (
            <div className="mt-4 overflow-x-auto rounded-xl border border-stone-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase text-stone-600">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Buyer</th>
                    <th className="px-4 py-3">Method</th>
                    <th className="px-4 py-3">Products</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {resolvedOrders.map((order) => (
                    <tr key={String(order._id)}>
                      <td className="px-4 py-3 text-xs text-stone-600">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-stone-900">
                          {order.buyerEmail}
                        </div>
                        {order.buyerWhatsapp && (
                          <div className="text-xs text-stone-500">
                            WA: {order.buyerWhatsapp}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            order.paymentMethod === "MANUAL"
                              ? "bg-blue-50 text-blue-800"
                              : "bg-indigo-50 text-indigo-800"
                          }`}
                        >
                          {order.paymentMethod === "MANUAL"
                            ? order.paymentAccount || "Manual"
                            : "Stripe"}
                        </span>
                      </td>
                      <td className="max-w-xs truncate px-4 py-3 text-stone-700">
                        {order.items.map((i) => i.title).join(", ")}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadge(order.status)}`}
                        >
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
