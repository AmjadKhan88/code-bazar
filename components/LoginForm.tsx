"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface LoginFormProps {
  callbackUrl?: string;
}

export function LoginForm({ callbackUrl = "/dashboard" }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });

    if (res?.error) {
      setError("Invalid email or password.");
      setLoading(false);
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-stone-200 bg-white p-6"
    >
      <div className="space-y-4">
        <div>
          <label
            htmlFor="login-email"
            className="block text-xs font-semibold uppercase tracking-wider text-stone-700"
          >
            Email
          </label>
          <input
            id="login-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="buyer@codebazaar.dev"
            className="mt-1.5 w-full rounded-lg border border-stone-300 px-3.5 py-2 text-sm text-stone-900 focus:border-emerald-700 focus:outline-none focus:ring-1 focus:ring-emerald-700"
          />
        </div>

        <div>
          <label
            htmlFor="login-password"
            className="block text-xs font-semibold uppercase tracking-wider text-stone-700"
          >
            Password
          </label>
          <input
            id="login-password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="mt-1.5 w-full rounded-lg border border-stone-300 px-3.5 py-2 text-sm text-stone-900 focus:border-emerald-700 focus:outline-none focus:ring-1 focus:ring-emerald-700"
          />
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
        {loading ? "Signing in..." : "Sign In"}
      </button>

      <div className="mt-5 rounded-lg border border-stone-200 bg-stone-50 p-3 text-xs text-stone-600">
        <p className="font-semibold text-stone-800">Seeded Demo Accounts:</p>
        <ul className="mt-1 space-y-0.5 font-mono">
          <li>buyer@codebazaar.dev / Password123!</li>
          <li>creator@codebazaar.dev / Password123!</li>
          <li>admin@codebazaar.dev / Password123!</li>
        </ul>
      </div>

      <p className="mt-4 text-center text-xs text-stone-600">
        New to CodeBazaar?{" "}
        <Link href="/register" className="font-semibold text-emerald-800 hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
