import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-stone-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-4 sm:px-6">
        <div className="sm:col-span-2">
          <Link
            href="/"
            className="text-base font-bold tracking-tight text-stone-950"
          >
            CodeBazaar
          </Link>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-stone-600">
            CodeBazaar — the source-code bazaar for builders. Production-ready
            Next.js templates, SaaS boilerplates, and developer tools with
            instant commercial licensing.
          </p>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-900">
            Categories
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-stone-600">
            <li>
              <Link href="/category/nextjs-templates" className="hover:text-stone-950">
                Next.js Templates
              </Link>
            </li>
            <li>
              <Link href="/category/saas-boilerplates" className="hover:text-stone-950">
                SaaS Boilerplates
              </Link>
            </li>
            <li>
              <Link href="/category/developer-tools" className="hover:text-stone-950">
                Developer Tools
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-900">
            Account &amp; Creators
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-stone-600">
            <li>
              <Link href="/dashboard" className="hover:text-stone-950">
                Buyer Dashboard
              </Link>
            </li>
            <li>
              <Link href="/seller" className="hover:text-stone-950">
                Creator Studio
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-stone-950">
                Sign In
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-stone-200 py-5 text-center text-xs text-stone-500">
        &copy; {new Date().getFullYear()} CodeBazaar. Built with Next.js 15 App
        Router &amp; MongoDB.
      </div>
    </footer>
  );
}
