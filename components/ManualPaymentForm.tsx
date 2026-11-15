"use client";

import { useEffect, useState, type FormEvent, type ChangeEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart";
import { MANUAL_PAYMENT_ACCOUNTS, type ManualPaymentAccount } from "@/lib/payment-accounts";

export function ManualPaymentForm() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const removeItem = useCartStore((s) => s.removeItem);
  const [mounted, setMounted] = useState(false);

  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [selectedAccount, setSelectedAccount] = useState<ManualPaymentAccount>(
    MANUAL_PAYMENT_ACCOUNTS[0]
  );
  const [transactionRef, setTransactionRef] = useState("");
  const [notes, setNotes] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setScreenshot(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (whatsapp.length < 7) {
      setError("Please enter a valid WhatsApp phone number with country code.");
      return;
    }
    if (!screenshot) {
      setError("Please upload a screenshot of your payment transfer.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("buyerEmail", email);
      formData.append("buyerWhatsapp", whatsapp);
      formData.append("paymentAccount", selectedAccount.id);
      formData.append("transactionReference", transactionRef);
      formData.append("buyerNotes", notes);
      formData.append("productIds", JSON.stringify(items.map((i) => i.productId)));
      formData.append("screenshot", screenshot);

      const res = await fetch("/api/manual-payment", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(data.error || "Failed to submit payment. Please try again.");
        setLoading(false);
        return;
      }

      clearCart();
      router.push(`/checkout/manual-pending?orderId=${data.orderId}`);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

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

  return (
    <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-12">
      {/* Cart Items */}
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
              <span className="text-sm font-bold text-stone-950">${item.price}</span>
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

        {/* Payment Account Selection */}
        <div className="rounded-xl border border-stone-200 bg-white p-6">
          <h2 className="text-base font-bold text-stone-950">
            Step 1: Send Payment to One of These Accounts
          </h2>
          <p className="mt-1.5 text-sm text-stone-600">
            Transfer exactly <span className="font-bold text-stone-950">${total} USD</span> to one of the accounts below, then fill in the details and upload a screenshot.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {MANUAL_PAYMENT_ACCOUNTS.map((acc) => (
              <label
                key={acc.id}
                className={`cursor-pointer rounded-lg border-2 p-4 transition ${
                  selectedAccount.id === acc.id
                    ? "border-emerald-700 bg-emerald-50"
                    : "border-stone-200 bg-white hover:border-stone-300"
                }`}
              >
                <input
                  type="radio"
                  name="paymentAccount"
                  value={acc.id}
                  checked={selectedAccount.id === acc.id}
                  onChange={() => setSelectedAccount(acc)}
                  className="sr-only"
                />
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
                  {acc.bankName}
                </p>
                <p className="mt-2 text-sm font-bold text-stone-950">
                  {acc.accountTitle}
                </p>
                <p className="mt-0.5 select-all font-mono text-sm font-semibold text-stone-800">
                  {acc.accountNumber}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-stone-600">
                  {acc.instructions}
                </p>
              </label>
            ))}
          </div>
        </div>

        {/* Screenshot Upload */}
        <div className="rounded-xl border border-stone-200 bg-white p-6">
          <h2 className="text-base font-bold text-stone-950">
            Step 2: Upload Payment Screenshot
          </h2>
          <p className="mt-1 text-sm text-stone-600">
            Upload a clear screenshot of your completed transaction (PNG, JPG, or WebP, max 5 MB).
          </p>

          <label
            htmlFor="payment-screenshot"
            className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-stone-300 bg-stone-50 p-6 hover:border-emerald-700 hover:bg-emerald-50"
          >
            {previewUrl ? (
              <Image
                src={previewUrl}
                alt="Payment screenshot preview"
                width={400}
                height={300}
                className="max-h-48 w-auto rounded-lg object-contain"
              />
            ) : (
              <div className="text-center">
                <svg className="mx-auto h-10 w-10 text-stone-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                </svg>
                <p className="mt-2 text-sm font-semibold text-stone-700">
                  Click or tap to select screenshot
                </p>
                <p className="mt-0.5 text-xs text-stone-500">
                  PNG, JPG, or WebP up to 5 MB
                </p>
              </div>
            )}
            <input
              id="payment-screenshot"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileChange}
              className="sr-only"
            />
          </label>
          {screenshot && (
            <p className="mt-2 text-xs text-stone-600">
              Selected: <span className="font-medium">{screenshot.name}</span> (
              {(screenshot.size / 1024).toFixed(0)} KB)
            </p>
          )}
        </div>
      </div>

      {/* Order Summary + Contact Info */}
      <div className="space-y-5 lg:col-span-5">
        <div className="rounded-xl border border-stone-200 bg-white p-6">
          <h2 className="text-lg font-bold text-stone-950">Order Summary</h2>
          <div className="mt-4 flex justify-between border-b border-stone-100 pb-4 text-sm">
            <span className="text-stone-600">
              Subtotal ({items.length} {items.length === 1 ? "item" : "items"})
            </span>
            <span className="font-bold text-stone-950">${total} USD</span>
          </div>

          <div className="mt-4 space-y-4">
            <div>
              <label
                htmlFor="buyer-email"
                className="block text-xs font-semibold uppercase tracking-wider text-stone-700"
              >
                Your Email Address
              </label>
              <input
                id="buyer-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@gmail.com"
                className="mt-1.5 w-full rounded-lg border border-stone-300 px-3.5 py-2 text-sm text-stone-900 focus:border-emerald-700 focus:outline-none focus:ring-1 focus:ring-emerald-700"
              />
              <p className="mt-1 text-xs text-stone-500">
                Source code download links will be sent to this email after approval.
              </p>
            </div>

            <div>
              <label
                htmlFor="buyer-whatsapp"
                className="block text-xs font-semibold uppercase tracking-wider text-stone-700"
              >
                WhatsApp Phone Number
              </label>
              <input
                id="buyer-whatsapp"
                type="tel"
                required
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+92 306 1234567"
                className="mt-1.5 w-full rounded-lg border border-stone-300 px-3.5 py-2 text-sm text-stone-900 focus:border-emerald-700 focus:outline-none focus:ring-1 focus:ring-emerald-700"
              />
              <p className="mt-1 text-xs text-stone-500">
                Include country code (e.g. +92 for Pakistan).
              </p>
            </div>

            <div>
              <label
                htmlFor="tx-ref"
                className="block text-xs font-semibold uppercase tracking-wider text-stone-700"
              >
                Transaction Reference / ID (Optional)
              </label>
              <input
                id="tx-ref"
                type="text"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder="TX-12345678"
                className="mt-1.5 w-full rounded-lg border border-stone-300 px-3.5 py-2 text-sm text-stone-900 focus:border-emerald-700 focus:outline-none focus:ring-1 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label
                htmlFor="buyer-notes"
                className="block text-xs font-semibold uppercase tracking-wider text-stone-700"
              >
                Any Questions or Notes? (Optional)
              </label>
              <textarea
                id="buyer-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="I need help deploying... / I want the extended license..."
                className="mt-1.5 w-full rounded-lg border border-stone-300 px-3.5 py-2 text-sm text-stone-900 focus:border-emerald-700 focus:outline-none focus:ring-1 focus:ring-emerald-700"
              />
            </div>
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
            {loading
              ? "Submitting Payment..."
              : `Submit Payment Proof — $${total} USD`}
          </button>

          <p className="mt-3 text-center text-xs text-stone-500">
            Your order will be verified within 24 hours. Download links will be emailed after approval.
          </p>
        </div>
      </div>
    </form>
  );
}
