import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import mongoose from "mongoose";
import { User } from "../models/User";
import { Category } from "../models/Category";
import { Tag } from "../models/Tag";
import { Product } from "../models/Product";
import { Review } from "../models/Review";
import { Order } from "../models/Order";
import { License } from "../models/License";
import { hashPassword } from "../lib/password";

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const val = trimmed.slice(eqIndex + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = val;
    }
  }
}

async function seed() {
  loadEnvLocal();

  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/codebazaar";
  await mongoose.connect(uri);
  console.log("Connected to MongoDB:", uri);

  // Sync indexes across all collections
  await Promise.all([
    User.syncIndexes(),
    Category.syncIndexes(),
    Tag.syncIndexes(),
    Product.syncIndexes(),
    Review.syncIndexes(),
    Order.syncIndexes(),
    License.syncIndexes(),
  ]);
  console.log("Synced Mongoose indexes for all 7 collections.");

  // 1. Seed Users
  const defaultPasswordHash = hashPassword("Password123!");
  const usersData = [
    {
      name: "CodeBazaar Admin",
      email: "admin@codebazaar.dev",
      passwordHash: defaultPasswordHash,
      role: "ADMIN" as const,
      bio: "Platform administrator and marketplace curator.",
    },
    {
      name: "Amina Tariq",
      email: "creator@codebazaar.dev",
      passwordHash: defaultPasswordHash,
      role: "CREATOR" as const,
      bio: "Full-stack architect building production Next.js & TypeScript kits.",
    },
    {
      name: "Liam Vance",
      email: "buyer@codebazaar.dev",
      passwordHash: defaultPasswordHash,
      role: "BUYER" as const,
      bio: "Indie founder shipping SaaS products rapidly.",
    },
  ];

  const userMap = new Map<string, mongoose.Types.ObjectId>();
  for (const u of usersData) {
    const doc = await User.findOneAndUpdate(
      { email: u.email },
      { $setOnInsert: u },
      { upsert: true, new: true }
    );
    userMap.set(u.email, doc._id);
  }

  const creatorId = userMap.get("creator@codebazaar.dev")!;
  const buyerId = userMap.get("buyer@codebazaar.dev")!;
  const adminId = userMap.get("admin@codebazaar.dev")!;

  // 2. Seed 3 Categories
  const categoriesData = [
    {
      name: "Next.js Templates",
      slug: "nextjs-templates",
      description:
        "Production-ready Next.js 15 App Router templates engineered for Core Web Vitals, SEO, and clean TypeScript architecture.",
      metaTitle: "Next.js 15 Templates & Starters | CodeBazaar",
      metaDescription:
        "Browse SEO-optimized Next.js 15 App Router templates with TypeScript, Tailwind CSS, and server-first architecture.",
    },
    {
      name: "SaaS Boilerplates",
      slug: "saas-boilerplates",
      description:
        "Full-stack SaaS starter kits complete with authentication, Stripe subscriptions, team workspaces, and transactional emails.",
      metaTitle: "SaaS Boilerplates & Starter Kits | CodeBazaar",
      metaDescription:
        "Launch your SaaS faster with battle-tested TypeScript boilerplates featuring Stripe billing, auth, and MongoDB.",
    },
    {
      name: "Developer Tools",
      slug: "developer-tools",
      description:
        "CLI engines, documentation portals, and release automation scripts built for engineering teams.",
      metaTitle: "Developer Tools & CLI Kits | CodeBazaar",
      metaDescription:
        "Production source code for developer CLIs, documentation platforms, and release automation workflows.",
    },
  ];

  const categoryMap = new Map<string, mongoose.Types.ObjectId>();
  for (const c of categoriesData) {
    const doc = await Category.findOneAndUpdate(
      { slug: c.slug },
      { $set: c },
      { upsert: true, new: true }
    );
    categoryMap.set(c.slug, doc._id);
  }

  // 3. Seed Tags
  const tagsData = [
    {
      name: "SaaS Boilerplate",
      slug: "saas-boilerplate",
      description: "Multi-tenant SaaS foundations with billing and auth.",
    },
    {
      name: "TypeScript",
      slug: "typescript",
      description: "Strict end-to-end TypeScript codebases.",
    },
    {
      name: "Tailwind CSS",
      slug: "tailwind-css",
      description: "Modern responsive UI built with Tailwind CSS v4.",
    },
    {
      name: "Stripe Billing",
      slug: "stripe-billing",
      description: "Pre-integrated Stripe Checkout, webhooks, and customer portal.",
    },
    {
      name: "AI SDK",
      slug: "ai-sdk",
      description: "Streaming AI interfaces, RAG pipelines, and token metering.",
    },
  ];

  const tagMap = new Map<string, mongoose.Types.ObjectId>();
  for (const t of tagsData) {
    const doc = await Tag.findOneAndUpdate(
      { slug: t.slug },
      { $set: t },
      { upsert: true, new: true }
    );
    tagMap.set(t.slug, doc._id);
  }

  // 4. Seed 5 Sample Products across the 3 Categories
  const productsData = [
    {
      title: "LaunchPad Pro — Multi-Tenant SaaS Starter",
      slug: "launchpad-pro-saas-starter",
      tagline:
        "Complete Next.js 15 multi-tenant SaaS boilerplate with Stripe billing, RBAC, and MongoDB.",
      description:
        "LaunchPad Pro gives you a production-hardened foundation for B2B and B2C SaaS applications. Built exclusively on Next.js 15 App Router, TypeScript, Tailwind CSS v4, and Mongoose, it includes organization switching, role-based access control, Stripe Checkout + webhook handlers, and automated transactional email templates.",
      metaTitle: "LaunchPad Pro — Next.js 15 Multi-Tenant SaaS Boilerplate",
      metaDescription:
        "Ship your B2B SaaS in days with LaunchPad Pro: Next.js 15 App Router, Stripe subscriptions, NextAuth, and MongoDB.",
      price: 129,
      currency: "USD",
      images: ["/images/products/saas-launchpad.png"],
      downloadUrl: "private://archives/launchpad-pro-saas-starter-v2.1.0.zip",
      techStack: ["Next.js 15", "TypeScript", "Tailwind CSS", "MongoDB", "Stripe"],
      version: "2.1.0",
      demoUrl: "https://demo.codebazaar.dev/launchpad-pro",
      features: [
        "Multi-tenant organizations with invite flows & RBAC",
        "Stripe Checkout, customer portal & idempotent webhook handler",
        "Server-first architecture with zero client-bundle bloat",
        "Full SEO metadata, sitemap, and Open Graph setup",
      ],
      faqs: [
        {
          question: "Can I use LaunchPad Pro for unlimited client projects?",
          answer:
            "The Commercial License covers one production SaaS or unlimited internal tools for a single team. Upgrade to Extended for unlimited client deployments.",
        },
        {
          question: "Does it support MongoDB Atlas out of the box?",
          answer:
            "Yes. Simply set your MONGODB_URI connection string in .env.local and run the included index sync script.",
        },
      ],
      published: true,
      featured: true,
      creatorId,
      categoryId: categoryMap.get("saas-boilerplates")!,
      tagIds: [
        tagMap.get("saas-boilerplate")!,
        tagMap.get("typescript")!,
        tagMap.get("stripe-billing")!,
      ],
      ratingAverage: 4.9,
      ratingCount: 2,
      salesCount: 42,
    },
    {
      title: "CommerceCore — Headless Storefront Template",
      slug: "commerce-core-storefront",
      tagline:
        "High-converting Next.js 15 e-commerce storefront with ISR, JSON-LD rich snippets, and Stripe.",
      description:
        "CommerceCore is engineered for organic search traffic and sub-second page loads. Featuring ISR product pages, faceted navigation with crawl-safe canonicals, cart state persistence, and Stripe Checkout integration.",
      metaTitle: "CommerceCore — SEO-First Next.js 15 E-Commerce Template",
      metaDescription:
        "High-speed Next.js 15 storefront template with Schema.org Product JSON-LD, ISR caching, and Stripe Checkout.",
      price: 89,
      currency: "USD",
      images: ["/images/products/commerce-core.png"],
      downloadUrl: "private://archives/commerce-core-storefront-v1.4.0.zip",
      techStack: ["Next.js 15", "TypeScript", "Tailwind CSS", "Stripe"],
      version: "1.4.0",
      demoUrl: "https://demo.codebazaar.dev/commerce-core",
      features: [
        "100/100 Lighthouse SEO & Performance baseline",
        "Automated Product, BreadcrumbList, and ItemList JSON-LD",
        "Crawl-safe faceted filtering with canonical discipline",
        "Responsive product gallery with AVIF/WebP optimization",
      ],
      faqs: [
        {
          question: "Are Stripe webhooks included?",
          answer:
            "Yes, the template includes verified Stripe webhook handlers for checkout.session.completed and refunds.",
        },
      ],
      published: true,
      featured: true,
      creatorId,
      categoryId: categoryMap.get("nextjs-templates")!,
      tagIds: [
        tagMap.get("typescript")!,
        tagMap.get("tailwind-css")!,
        tagMap.get("stripe-billing")!,
      ],
      ratingAverage: 4.8,
      ratingCount: 1,
      salesCount: 31,
    },
    {
      title: "AI Workspace Kit — Streaming Chat & RAG Boilerplate",
      slug: "ai-workspace-kit-boilerplate",
      tagline:
        "Production AI SaaS kit with streaming responses, token metering, and vector search.",
      description:
        "Build and monetize AI-powered applications without reinventing auth, rate limiting, or credit-based Stripe billing. Includes streaming server routes, prompt templates, and usage dashboards.",
      metaTitle: "AI Workspace Kit — Next.js 15 AI SaaS Boilerplate",
      metaDescription:
        "Launch an AI SaaS with streaming chat, token usage metering, and Stripe credit packs in Next.js 15 & TypeScript.",
      price: 149,
      currency: "USD",
      images: ["/images/products/ai-workspace-kit.png"],
      downloadUrl: "private://archives/ai-workspace-kit-v1.2.0.zip",
      techStack: ["Next.js 15", "TypeScript", "MongoDB", "Stripe", "AI SDK"],
      version: "1.2.0",
      demoUrl: "https://demo.codebazaar.dev/ai-workspace",
      features: [
        "Server-sent streaming UI with zero blocking client scripts",
        "Per-user token metering and credit-pack Stripe top-ups",
        "Document ingestion pipeline with chunking helpers",
        "Clean keyboard-accessible chat workspace",
      ],
      faqs: [
        {
          question: "Which LLM providers are supported?",
          answer:
            "The adapter layer supports OpenAI, Anthropic, and Google Gemini APIs via standard environment variables.",
        },
      ],
      published: true,
      featured: true,
      creatorId,
      categoryId: categoryMap.get("saas-boilerplates")!,
      tagIds: [
        tagMap.get("saas-boilerplate")!,
        tagMap.get("ai-sdk")!,
        tagMap.get("typescript")!,
      ],
      ratingAverage: 5.0,
      ratingCount: 1,
      salesCount: 27,
    },
    {
      title: "ReleaseEngine — TypeScript CLI & Changelog Automator",
      slug: "release-engine-cli-kit",
      tagline:
        "Zero-dependency Node & TypeScript CLI toolkit for semantic versioning and release notes.",
      description:
        "ReleaseEngine gives developer-tool creators a modular CLI architecture with interactive prompts, conventional commit parsing, automated GitHub release notes, and npm publish guards.",
      metaTitle: "ReleaseEngine — TypeScript CLI & Release Automation Source Code",
      metaDescription:
        "Production TypeScript CLI starter for semantic versioning, changelog generation, and CI release workflows.",
      price: 59,
      currency: "USD",
      images: ["/images/products/cli-release-engine.png"],
      downloadUrl: "private://archives/release-engine-cli-v1.0.3.zip",
      techStack: ["TypeScript", "Node.js", "GitHub Actions"],
      version: "1.0.3",
      demoUrl: "https://demo.codebazaar.dev/release-engine",
      features: [
        "Strict TypeScript ESM & CJS dual-build pipeline",
        "Conventional commit parser and Markdown changelog generator",
        "Dry-run mode and pre-flight git working tree checks",
        "Comprehensive unit test suite included",
      ],
      faqs: [
        {
          question: "Does ReleaseEngine require external runtime dependencies?",
          answer:
            "No, it relies on built-in Node.js modules for fast startup and minimal supply-chain surface.",
        },
      ],
      published: true,
      featured: false,
      creatorId,
      categoryId: categoryMap.get("developer-tools")!,
      tagIds: [tagMap.get("typescript")!],
      ratingAverage: 4.7,
      ratingCount: 1,
      salesCount: 19,
    },
    {
      title: "DocsPortal Pro — MDX Knowledge Base Template",
      slug: "docs-portal-pro-template",
      tagline:
        "Blazing-fast Next.js 15 documentation & changelog portal with static search index.",
      description:
        "DocsPortal Pro is a clean, high-contrast documentation template built for developer products. Pre-renders every doc route statically with automatic table of contents, syntax highlighting, and JSON-LD FAQ support.",
      metaTitle: "DocsPortal Pro — Next.js 15 Documentation Template",
      metaDescription:
        "Static-first Next.js 15 documentation template with instant search, breadcrumbs, and SEO-ready metadata.",
      price: 69,
      currency: "USD",
      images: ["/images/products/docs-portal-pro.png"],
      downloadUrl: "private://archives/docs-portal-pro-v1.1.0.zip",
      techStack: ["Next.js 15", "TypeScript", "Tailwind CSS", "MDX"],
      version: "1.1.0",
      demoUrl: "https://demo.codebazaar.dev/docs-portal",
      features: [
        "100% static generation for sub-100ms TTFB",
        "Accessible sidebar navigation and copy-code buttons",
        "Automatic sitemap and Open Graph image support",
        "Built-in changelog and API reference layouts",
      ],
      faqs: [
        {
          question: "Can I deploy this to Vercel or Cloudflare?",
          answer:
            "Yes, DocsPortal Pro uses standard Next.js 15 App Router static generation and deploys anywhere Node or edge runtimes run.",
        },
      ],
      published: true,
      featured: false,
      creatorId,
      categoryId: categoryMap.get("nextjs-templates")!,
      tagIds: [tagMap.get("typescript")!, tagMap.get("tailwind-css")!],
      ratingAverage: 4.8,
      ratingCount: 1,
      salesCount: 24,
    },
  ];

  const productMap = new Map<string, { _id: mongoose.Types.ObjectId; title: string; slug: string; price: number }>();
  for (const p of productsData) {
    const doc = await Product.findOneAndUpdate(
      { slug: p.slug },
      { $set: p },
      { upsert: true, new: true }
    );
    productMap.set(p.slug, {
      _id: doc._id,
      title: doc.title,
      slug: doc.slug,
      price: doc.price,
    });
  }

  // 5. Seed Reviews so aggregateRating is backed by real Review documents
  const launchpad = productMap.get("launchpad-pro-saas-starter")!;
  const commerce = productMap.get("commerce-core-storefront")!;
  const aiKit = productMap.get("ai-workspace-kit-boilerplate")!;
  const releaseCli = productMap.get("release-engine-cli-kit")!;
  const docsPortal = productMap.get("docs-portal-pro-template")!;

  const reviewsData = [
    {
      productId: launchpad._id,
      userId: buyerId,
      rating: 5,
      title: "Saved us 3 weeks of Stripe and RBAC plumbing",
      comment:
        "Cleanest Next.js 15 codebase I have purchased. Webhook idempotency and MongoDB models worked out of the box.",
      verifiedPurchase: true,
    },
    {
      productId: launchpad._id,
      userId: adminId,
      rating: 5,
      title: "Rock-solid TypeScript structure",
      comment:
        "Zero client-side bloat on public pages and crystal-clear server actions.",
      verifiedPurchase: true,
    },
    {
      productId: commerce._id,
      userId: buyerId,
      rating: 5,
      title: "Instant rich snippets in Google Search Console",
      comment:
        "Passed Rich Results Test on the first deploy. Clean Tailwind styling.",
      verifiedPurchase: true,
    },
    {
      productId: aiKit._id,
      userId: buyerId,
      rating: 5,
      title: "Streaming and token metering work seamlessly",
      comment:
        "Exactly what we needed to launch our AI writing assistant with credit packs.",
      verifiedPurchase: true,
    },
    {
      productId: releaseCli._id,
      userId: buyerId,
      rating: 5,
      title: "Minimal, fast, and well-tested CLI starter",
      comment: "Great dual-build setup and clean commit parser.",
      verifiedPurchase: true,
    },
    {
      productId: docsPortal._id,
      userId: buyerId,
      rating: 5,
      title: "Sub-second docs site with zero configuration headaches",
      comment: "Deployed in 5 minutes and looks crisp on mobile and desktop.",
      verifiedPurchase: true,
    },
  ];

  for (const r of reviewsData) {
    await Review.findOneAndUpdate(
      { productId: r.productId, userId: r.userId },
      { $set: r },
      { upsert: true, new: true }
    );
  }

  // 6. Seed 1 Sample Order & License for buyer@codebazaar.dev
  const sampleSessionId = "cs_seed_launchpad_pro_001";
  const order = await Order.findOneAndUpdate(
    { stripeSessionId: sampleSessionId },
    {
      $setOnInsert: {
        buyerId,
        buyerEmail: "buyer@codebazaar.dev",
        stripeSessionId: sampleSessionId,
        stripePaymentIntentId: "pi_seed_001",
        status: "PAID",
        totalAmount: launchpad.price,
        currency: "USD",
        items: [
          {
            productId: launchpad._id,
            title: launchpad.title,
            slug: launchpad.slug,
            price: launchpad.price,
          },
        ],
      },
    },
    { upsert: true, new: true }
  );

  await License.findOneAndUpdate(
    { orderId: order._id, productId: launchpad._id },
    {
      $setOnInsert: {
        orderId: order._id,
        productId: launchpad._id,
        buyerId,
        buyerEmail: "buyer@codebazaar.dev",
        licenseKey: `CBZ-${crypto.createHash("sha256").update(sampleSessionId).digest("hex").slice(0, 16).toUpperCase()}`,
        licenseType: "COMMERCIAL",
        downloadCount: 0,
        maxDownloads: 10,
        active: true,
      },
    },
    { upsert: true, new: true }
  );

  console.log(
    `Seed complete: ${usersData.length} users, ${categoriesData.length} categories, ${tagsData.length} tags, ${productsData.length} products, ${reviewsData.length} reviews, 1 sample order & license.`
  );
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
