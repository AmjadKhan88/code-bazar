"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/store/cart";

export function CheckoutClient() {
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-8 text-sm text-stone-600">
        Loading cart...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-10 text-center">
        <h2 className="text-lg font-semibold text-stone-950">
          Your cart is empty
        </h2>
        <p className="mt-1 text-sm text-stone-600">
          Explore Next.js templates, SaaS boilerplates, and developer tools.
        </p>
        <Link
          href="/products"
          className="mt-5 inline-block rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          Browse Catalog
        </Link>
      </div>
    );
  }

  const total = items.reduce((sum, item) => sum + item.price, 0);

  async function handleCheckout(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productIds: items.map((i) => i.productId),
          buyerEmail: email,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error || "Unable to start checkout.");
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Network error while creating checkout session.");
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <div className="space-y-4 lg:col-span-7">
        {items.map((item) => (
          <div
            key={item.productId}
            className="flex items-center justify-between gap-4 rounded-xl border border-stone-200 bg-white p-4"
          >
            <div className="flex items-center gap-4">
              <Image
                src={item.image || "/images/products/saas-launchpad.png"}
                alt={item.title}
                width={120}
                height={68}
                className="h-16 w-28 rounded-lg object-cover"
              />
              <div>
                <Link
                  href={`/products/${item.slug}`}
                  className="text-sm font-semibold text-stone-950 hover:text-emerald-800"
                >
                  {item.title}
                </Link>
                <p className="mt-0.5 text-xs text-stone-500">
                  Commercial License &middot; Instant ZIP
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm font-bold text-stone-950">
                ${item.price}
              </span>
              <button
                type="button"
                onClick={() => removeItem(item.productId)}
                className="text-xs font-medium text-stone-500 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <form
        onSubmit={handleCheckout}
        className="rounded-xl border border-stone-200 bg-white p-6 lg:col-span-5"
      >
        <h2 className="text-lg font-bold text-stone-950">Order Summary</h2>
        <div className="mt-4 flex justify-between border-b border-stone-100 pb-4 text-sm">
          <span className="text-stone-600">
            Subtotal ({items.length} {items.length === 1 ? "item" : "items"})
          </span>
          <span className="font-bold text-stone-950">${total} USD</span>
        </div>

        <div className="mt-4">
          <label
            htmlFor="buyer-email"
            className="block text-xs font-semibold uppercase tracking-wider text-stone-700"
          >
            Delivery Email
          </label>
          <input
            id="buyer-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="mt-1.5 w-full rounded-lg border border-stone-300 px-3.5 py-2 text-sm text-stone-900 focus:border-emerald-700 focus:outline-none focus:ring-1 focus:ring-emerald-700"
          />
          <p className="mt-1 text-xs text-stone-500">
            Your license keys and signed download links will be tied to this
            email.
          </p>
        </div>

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-5 w-full rounded-lg bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-50"
        >
          {loading ? "Redirecting to Checkout..." : `Pay $${total} with Stripe`}
        </button>
      </form>
    </div>
  );
}
