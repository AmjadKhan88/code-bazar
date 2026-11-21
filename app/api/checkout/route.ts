import crypto from "node:crypto";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import { Order } from "@/models/Order";
import { License } from "@/models/License";
import { User } from "@/models/User";
import { getSiteUrl } from "@/lib/seo";

function generateLicenseKey(seed: string): string {
  const hash = crypto
    .createHash("sha256")
    .update(`${seed}-${crypto.randomUUID()}`)
    .digest("hex")
    .slice(0, 16)
    .toUpperCase();
  return `CBZ-${hash.slice(0, 4)}-${hash.slice(4, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { productIds, buyerEmail } = body as {
      productIds?: string[];
      buyerEmail?: string;
    };

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { error: "Cart is empty." },
        { status: 400 }
      );
    }

    const email = (buyerEmail || "").trim().toLowerCase();
    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "A valid email address is required for license delivery." },
        { status: 400 }
      );
    }

    await connectDB();

    const products = await Product.find({
      _id: { $in: productIds },
      published: true,
    })
      .select("title slug price currency images")
      .lean();

    if (products.length === 0) {
      return NextResponse.json(
        { error: "No valid products found." },
        { status: 404 }
      );
    }

    const existingUser = await User.findOne({ email }).select("_id").lean();
    const totalAmount = products.reduce((sum, p) => sum + Number(p.price), 0);
    const currency = products[0].currency || "USD";
    const siteUrl = getSiteUrl();

    const stripeSecret = process.env.STRIPE_SECRET_KEY;

    // Real Stripe Checkout when STRIPE_SECRET_KEY is configured
    if (stripeSecret && stripeSecret.startsWith("sk_")) {
      const stripe = new Stripe(stripeSecret);
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: email,
        line_items: products.map((p) => ({
          price_data: {
            currency: (p.currency || "USD").toLowerCase(),
            product_data: {
              name: p.title,
            },
            unit_amount: Math.round(Number(p.price) * 100),
          },
          quantity: 1,
        })),
        success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteUrl}/checkout`,
        metadata: {
          buyerEmail: email,
          productIds: products.map((p) => String(p._id)).join(","),
        },
      });

      await Order.create({
        buyerId: existingUser?._id,
        buyerEmail: email,
        stripeSessionId: session.id,
        status: "PENDING",
        totalAmount,
        currency,
        items: products.map((p) => ({
          productId: p._id,
          title: p.title,
          slug: p.slug,
          price: Number(p.price),
        })),
      });

      return NextResponse.json({ url: session.url });
    }

    // Local/Test Checkout fallback when STRIPE_SECRET_KEY is not configured
    const demoSessionId = `cs_demo_${crypto.randomBytes(12).toString("hex")}`;
    const order = await Order.create({
      buyerId: existingUser?._id,
      buyerEmail: email,
      stripeSessionId: demoSessionId,
      stripePaymentIntentId: `pi_demo_${crypto.randomBytes(8).toString("hex")}`,
      status: "PAID",
      totalAmount,
      currency,
      items: products.map((p) => ({
        productId: p._id,
        title: p.title,
        slug: p.slug,
        price: Number(p.price),
      })),
    });

    await Promise.all(
      products.map((p) =>
        License.create({
          orderId: order._id,
          productId: p._id,
          buyerId: existingUser?._id,
          buyerEmail: email,
          licenseKey: generateLicenseKey(`${demoSessionId}-${p._id}`),
          licenseType: "COMMERCIAL",
          downloadCount: 0,
          maxDownloads: 10,
          active: true,
        })
      )
    );

    await Product.updateMany(
      { _id: { $in: products.map((p) => p._id) } },
      { $inc: { salesCount: 1 } }
    );

    return NextResponse.json({
      url: `${siteUrl}/checkout/success?session_id=${demoSessionId}`,
    });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json(
      { error: "Unable to initiate checkout." },
      { status: 500 }
    );
  }
}
