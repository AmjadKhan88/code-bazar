# AGENTS.md — CodeBazaar

CodeBazaar — the source-code bazaar for builders.

## Project Stack
- **Framework:** Next.js 15 (App Router exclusively; no Pages Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Database:** MongoDB with Mongoose
- **Payments:** Manual Bank/JazzCash Transfer + Stripe Checkout (optional)
- **File Storage:** Cloudinary (with Multer for multipart parsing)
- **Email:** Nodemailer with Gmail SMTP
- **Auth:** NextAuth

## Commands (from `package.json`)
- **Build:** `npm run build` (`next build --turbopack`)
- **Dev:** `npm run dev` (`next dev --turbopack`)
- **Start:** `npm run start` (`next start`)
- **Lint:** `npm run lint` (`eslint`)
- **Seed:** `npx tsx scripts/seed.ts`
- **Test:** Not configured in `package.json` (no `test` script currently defined).

## SEO & Architecture Rules
1. **Metadata API (`generateMetadata`):** All public pages must export `generateMetadata` with `title`, `description`, and a self-referential `alternates.canonical` URL.
2. **Structured Data (JSON-LD):** All product detail pages (`/products/[slug]`) must include a server-side rendered JSON-LD `Product` schema (`offers`, `aggregateRating` when reviews exist) alongside `BreadcrumbList` and `FAQPage` schemas.
3. **Server Components First:** Prefer React Server Components; use `"use client"` only for interactive UI atoms.
4. **Crawl Discipline:** Filtered/sorted listing states with query parameters must return `robots: { index: false, follow: true }` and a canonical pointing to the clean base URL.
