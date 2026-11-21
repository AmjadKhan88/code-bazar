import crypto from "node:crypto";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { connectDB } from "@/lib/db";
import { Order } from "@/models/Order";
import { License } from "@/models/License";
import { Product } from "@/models/Product";

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
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecret || !webhookSecret) {
    return NextResponse.json(
      { error: "Stripe webhook secrets are not configured." },
      { status: 400 }
    );
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const rawBody = await req.text();
  const stripe = new Stripe(stripeSecret);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    await connectDB();

    const order = await Order.findOne({ stripeSessionId: session.id });
    if (order && order.status !== "PAID") {
      order.status = "PAID";
      order.stripePaymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : "";
      await order.save();

      for (const item of order.items) {
        const existing = await License.findOne({
          orderId: order._id,
          productId: item.productId,
        });
        if (!existing) {
          await License.create({
            orderId: order._id,
            productId: item.productId,
            buyerId: order.buyerId,
            buyerEmail: order.buyerEmail,
            licenseKey: generateLicenseKey(`${order._id}-${item.productId}`),
            licenseType: "COMMERCIAL",
            downloadCount: 0,
            maxDownloads: 10,
            active: true,
          });
        }
        await Product.updateOne(
          { _id: item.productId },
          { $inc: { salesCount: 1 } }
        );
      }
    }
  }

  return NextResponse.json({ received: true });
}
