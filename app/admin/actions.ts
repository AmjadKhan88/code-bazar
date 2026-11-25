"use server";

import crypto from "node:crypto";
import mongoose from "mongoose";
import { revalidatePath } from "next/cache";
import { getAuthSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Order } from "@/models/Order";
import { License } from "@/models/License";
import { Product } from "@/models/Product";
import { buildSignedDownloadUrl } from "@/lib/download";
import { sendBuyerApprovalEmail } from "@/lib/mailer";

function generateLicenseKey(seed: string): string {
  const hash = crypto
    .createHash("sha256")
    .update(`${seed}-${crypto.randomUUID()}`)
    .digest("hex")
    .slice(0, 16)
    .toUpperCase();
  return `CBZ-${hash.slice(0, 4)}-${hash.slice(4, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}`;
}

export async function approveManualPaymentAction(formData: FormData) {
  const session = await getAuthSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized — only admins can approve payments.");
  }

  const orderId = String(formData.get("orderId") || "");
  const adminNote = String(formData.get("adminNote") || "").trim();

  await connectDB();

  const order = await Order.findById(orderId);
  if (!order) throw new Error("Order not found.");
  if (order.status === "PAID") throw new Error("Order already approved.");

  order.status = "PAID";
  order.adminNote = adminNote || "Payment verified and approved.";
  order.reviewedAt = new Date();
  order.reviewedBy = session.user.id;
  await order.save();

  // Create License records for each item
  const licenses: {
    productTitle: string;
    licenseKey: string;
    signedDownloadPath: string;
  }[] = [];

  for (const item of order.items) {
    const existing = await License.findOne({
      orderId: order._id,
      productId: item.productId,
    });

    if (!existing) {
      const licenseKey = generateLicenseKey(
        `${order._id}-${item.productId}`
      );

      const lic = await License.create({
        orderId: order._id,
        productId: item.productId,
        buyerId: order.buyerId,
        buyerEmail: order.buyerEmail,
        licenseKey,
        licenseType: "COMMERCIAL",
        downloadCount: 0,
        maxDownloads: 10,
        active: true,
      });

      await Product.updateOne(
        { _id: item.productId },
        { $inc: { salesCount: 1 } }
      );

      const signedUrl = buildSignedDownloadUrl(
        String(lic._id),
        String(item.productId)
      );

      licenses.push({
        productTitle: item.title,
        licenseKey,
        signedDownloadPath: signedUrl,
      });
    }
  }

  // Email buyer with license keys and download links
  if (licenses.length > 0) {
    await sendBuyerApprovalEmail({
      buyerEmail: order.buyerEmail,
      orderId: String(order._id),
      licenses,
    });
  }

  revalidatePath("/admin");
}

export async function rejectManualPaymentAction(formData: FormData) {
  const session = await getAuthSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized — only admins can reject payments.");
  }

  const orderId = String(formData.get("orderId") || "");
  const adminNote = String(formData.get("adminNote") || "").trim();

  await connectDB();

  const order = await Order.findById(orderId);
  if (!order) throw new Error("Order not found.");
  if (order.status === "PAID") throw new Error("Cannot reject an approved order.");

  order.status = "REJECTED";
  order.adminNote = adminNote || "Payment could not be verified.";
  order.reviewedAt = new Date();
  order.reviewedBy = session.user.id;
  await order.save();

  revalidatePath("/admin");
}
