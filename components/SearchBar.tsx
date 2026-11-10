"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

interface SearchBarProps {
  initialQuery?: string;
  basePath?: string;
  placeholder?: string;
}

export function SearchBar({
  initialQuery = "",
  basePath = "/products",
  placeholder = "Search Next.js templates, SaaS kits, CLIs...",
}: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      router.push(basePath);
      return;
    }
    const params = new URLSearchParams({ q: trimmed });
    router.push(`${basePath}?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} role="search" className="flex w-full gap-2">
      <label htmlFor="catalog-search" className="sr-only">
        Search source code products
      </label>
      <input
        id="catalog-search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-sm text-stone-900 placeholder:text-stone-500 focus:border-emerald-700 focus:outline-none focus:ring-1 focus:ring-emerald-700"
      />
      <button
        type="submit"
        className="shrink-0 rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800"
      >
        Search
      </button>
    </form>
  );
}
