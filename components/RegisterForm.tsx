"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"BUYER" | "CREATOR">("BUYER");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed.");
        setLoading(false);
        return;
      }

      await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      router.push(role === "CREATOR" ? "/seller" : "/dashboard");
      router.refresh();
    } catch {
      setError("Network error during registration.");
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-stone-200 bg-white p-6"
    >
      <div className="space-y-4">
        <div>
          <label
            htmlFor="reg-name"
            className="block text-xs font-semibold uppercase tracking-wider text-stone-700"
          >
            Full Name
          </label>
          <input
            id="reg-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Alex Rivera"
            className="mt-1.5 w-full rounded-lg border border-stone-300 px-3.5 py-2 text-sm text-stone-900 focus:border-emerald-700 focus:outline-none focus:ring-1 focus:ring-emerald-700"
          />
        </div>

        <div>
          <label
            htmlFor="reg-email"
            className="block text-xs font-semibold uppercase tracking-wider text-stone-700"
          >
            Email
          </label>
          <input
            id="reg-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="alex@company.com"
            className="mt-1.5 w-full rounded-lg border border-stone-300 px-3.5 py-2 text-sm text-stone-900 focus:border-emerald-700 focus:outline-none focus:ring-1 focus:ring-emerald-700"
          />
        </div>

        <div>
          <label
            htmlFor="reg-password"
            className="block text-xs font-semibold uppercase tracking-wider text-stone-700"
          >
            Password (8+ characters)
          </label>
          <input
            id="reg-password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="mt-1.5 w-full rounded-lg border border-stone-300 px-3.5 py-2 text-sm text-stone-900 focus:border-emerald-700 focus:outline-none focus:ring-1 focus:ring-emerald-700"
          />
        </div>

        <div>
          <label
            htmlFor="reg-role"
            className="block text-xs font-semibold uppercase tracking-wider text-stone-700"
          >
            Account Type
          </label>
          <select
            id="reg-role"
            value={role}
            onChange={(e) => setRole(e.target.value as "BUYER" | "CREATOR")}
            className="mt-1.5 w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-sm text-stone-900 focus:border-emerald-700 focus:outline-none focus:ring-1 focus:ring-emerald-700"
          >
            <option value="BUYER">Buyer (Purchase &amp; Download Code)</option>
            <option value="CREATOR">Creator (List &amp; Sell Code)</option>
          </select>
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-5 w-full rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-50"
      >
        {loading ? "Creating account..." : "Create Account"}
      </button>

      <p className="mt-4 text-center text-xs text-stone-600">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-emerald-800 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
