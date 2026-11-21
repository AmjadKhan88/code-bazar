import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CheckoutClient } from "@/components/CheckoutClient";
import { ManualPaymentForm } from "@/components/ManualPaymentForm";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: "Checkout",
    description: "Complete your source code purchase on CodeBazaar.",
    slug: "/checkout",
    noIndex: true,
  });
}

export default function CheckoutPage() {
  const isStripeConfigured = Boolean(
    process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith("sk_")
  );

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-stone-950">
          Checkout
        </h1>
        <p className="mb-8 text-sm text-stone-600">
          Complete your purchase using bank transfer or mobile wallet. Source
          code download links are emailed after payment verification.
        </p>

        {/* Manual Bank / JazzCash Payment — always visible */}
        <section>
          <ManualPaymentForm />
        </section>

        {/* Stripe option — only when STRIPE_SECRET_KEY is set */}
        {isStripeConfigured && (
          <section className="mt-12">
            <div className="rounded-xl border border-stone-200 bg-white p-6">
              <h2 className="text-lg font-bold text-stone-950">
                Or Pay Instantly with Stripe
              </h2>
              <p className="mt-1 text-sm text-stone-600">
                Use a credit card, debit card, or international payment method
                via Stripe Checkout for instant access.
              </p>
              <div className="mt-6">
                <CheckoutClient />
              </div>
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
