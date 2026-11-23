import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import { Order } from "@/models/Order";
import { User } from "@/models/User";
import { parseMultipartWithMulter } from "@/lib/multer-upload";
import { uploadImageBuffer } from "@/lib/cloudinary";
import { sendAdminManualPaymentAlert } from "@/lib/mailer";

export async function POST(req: Request) {
  try {
    const { file, fields } = await parseMultipartWithMulter(req, "screenshot");

    const buyerEmail = (fields.buyerEmail || "").trim().toLowerCase();
    const buyerWhatsapp = (fields.buyerWhatsapp || "").trim();
    const paymentAccount = (fields.paymentAccount || "").trim().toUpperCase();
    const transactionReference = (fields.transactionReference || "").trim();
    const buyerNotes = (fields.buyerNotes || "").trim();
    const rawProductIds = fields.productIds || "[]";

    let productIds: string[] = [];
    try {
      const parsed = JSON.parse(rawProductIds);
      if (Array.isArray(parsed)) productIds = parsed.map(String);
    } catch {
      productIds = rawProductIds
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    if (productIds.length === 0) {
      return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
    }

    if (!buyerEmail || !buyerEmail.includes("@")) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    if (!buyerWhatsapp || buyerWhatsapp.length < 7) {
      return NextResponse.json(
        { error: "Please provide a valid WhatsApp phone number." },
        { status: 400 }
      );
    }

    if (paymentAccount !== "UBL" && paymentAccount !== "JAZZCASH") {
      return NextResponse.json(
        { error: "Please select UBL or JazzCash as the payment account." },
        { status: 400 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { error: "Please upload your payment screenshot (PNG, JPG, or WebP)." },
        { status: 400 }
      );
    }

    await connectDB();

    const products = await Product.find({
      _id: { $in: productIds },
      published: true,
    })
      .select("title slug price currency")
      .lean();

    if (products.length === 0) {
      return NextResponse.json(
        { error: "No valid products found for your order." },
        { status: 404 }
      );
    }

    const uploadResult = await uploadImageBuffer(
      file.buffer,
      file.originalname,
      "codebazaar/payment-screenshots"
    );

    const existingUser = await User.findOne({ email: buyerEmail })
      .select("_id")
      .lean();
    const totalAmount = products.reduce((sum, p) => sum + Number(p.price), 0);
    const currency = products[0].currency || "USD";
    const manualSessionId = `manual_${crypto.randomBytes(12).toString("hex")}`;

    const order = await Order.create({
      buyerId: existingUser?._id,
      buyerEmail,
      buyerWhatsapp,
      paymentMethod: "MANUAL",
      paymentAccount,
      transactionReference,
      buyerNotes,
      screenshotUrl: uploadResult.url,
      screenshotPublicId: uploadResult.publicId,
      stripeSessionId: manualSessionId,
      status: "PENDING_VERIFICATION",
      totalAmount,
      currency,
      items: products.map((p) => ({
        productId: p._id,
        title: p.title,
        slug: p.slug,
        price: Number(p.price),
      })),
    });

    await sendAdminManualPaymentAlert({
      orderId: String(order._id),
      buyerEmail,
      buyerWhatsapp,
      paymentAccount,
      transactionReference,
      buyerNotes,
      totalAmount,
      currency,
      items: products.map((p) => ({
        title: p.title,
        price: Number(p.price),
      })),
      screenshotUrl: uploadResult.url,
    });

    return NextResponse.json(
      {
        ok: true,
        orderId: String(order._id),
        status: order.status,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Manual payment submission error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to submit manual payment.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
