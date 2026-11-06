import nodemailer from "nodemailer";
import { getSiteUrl, SITE_NAME } from "@/lib/seo";

function getTransporter() {
  const user = process.env.GMAIL_SMTP_USER?.trim();
  const pass = process.env.GMAIL_SMTP_APP_PASSWORD?.trim();
  if (!user || !pass) return null;

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
  });
}

export interface AdminPaymentAlertInput {
  orderId: string;
  buyerEmail: string;
  buyerWhatsapp: string;
  paymentAccount: string;
  transactionReference?: string;
  buyerNotes?: string;
  totalAmount: number;
  currency: string;
  items: { title: string; price: number }[];
  screenshotUrl: string;
}

export async function sendAdminManualPaymentAlert(
  input: AdminPaymentAlertInput
): Promise<{ sent: boolean; reason?: string }> {
  const transporter = getTransporter();
  const toEmail =
    process.env.ADMIN_NOTIFICATION_EMAIL?.trim() ||
    process.env.GMAIL_SMTP_USER?.trim();

  if (!transporter || !toEmail) {
    console.info(
      "[Mailer] Gmail SMTP not configured; skipping admin alert for order:",
      input.orderId
    );
    return { sent: false, reason: "Gmail SMTP not configured" };
  }

  const siteUrl = getSiteUrl();
  const absoluteScreenshot = input.screenshotUrl.startsWith("http")
    ? input.screenshotUrl
    : `${siteUrl}${input.screenshotUrl}`;

  const itemLines = input.items
    .map((i) => `- ${i.title}: $${i.price} ${input.currency}`)
    .join("\n");

  const htmlItems = input.items
    .map((i) => `<li><strong>${i.title}</strong> — $${i.price} ${input.currency}</li>`)
    .join("");

  await transporter.sendMail({
    from: `"${SITE_NAME} Payments" <${process.env.GMAIL_SMTP_USER}>`,
    to: toEmail,
    replyTo: input.buyerEmail,
    subject: `[${SITE_NAME}] New Manual Payment ($${input.totalAmount} ${input.currency}) — ${input.paymentAccount}`,
    text: [
      `New manual payment submitted on ${SITE_NAME}.`,
      `Order ID: ${input.orderId}`,
      `Account: ${input.paymentAccount}`,
      `Total: $${input.totalAmount} ${input.currency}`,
      `Buyer Email: ${input.buyerEmail}`,
      `Buyer WhatsApp: ${input.buyerWhatsapp}`,
      `Transaction Ref: ${input.transactionReference || "N/A"}`,
      `Buyer Query / Note: ${input.buyerNotes || "None"}`,
      `Screenshot: ${absoluteScreenshot}`,
      "",
      "Items:",
      itemLines,
      "",
      `Review & Approve in Admin: ${siteUrl}/admin`,
    ].join("\n"),
    html: `
      <h2>New Manual Payment Submission</h2>
      <p><strong>Order ID:</strong> ${input.orderId}</p>
      <p><strong>Account Selected:</strong> ${input.paymentAccount}</p>
      <p><strong>Total Amount:</strong> $${input.totalAmount} ${input.currency}</p>
      <p><strong>Buyer Email:</strong> ${input.buyerEmail}</p>
      <p><strong>Buyer WhatsApp:</strong> ${input.buyerWhatsapp}</p>
      <p><strong>Transaction Reference:</strong> ${input.transactionReference || "N/A"}</p>
      <p><strong>Buyer Query / Note:</strong> ${input.buyerNotes || "None"}</p>
      <h3>Items</h3>
      <ul>${htmlItems}</ul>
      <p><strong>Payment Screenshot:</strong> <a href="${absoluteScreenshot}">${absoluteScreenshot}</a></p>
      <p><a href="${siteUrl}/admin" style="display:inline-block;padding:10px 16px;background:#047857;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;">Review &amp; Approve in Admin</a></p>
    `,
  });

  return { sent: true };
}

export interface BuyerApprovalEmailInput {
  buyerEmail: string;
  orderId: string;
  licenses: {
    productTitle: string;
    licenseKey: string;
    signedDownloadPath: string;
  }[];
}

export async function sendBuyerApprovalEmail(
  input: BuyerApprovalEmailInput
): Promise<{ sent: boolean; reason?: string }> {
  const transporter = getTransporter();
  if (!transporter) {
    console.info(
      "[Mailer] Gmail SMTP not configured; skipping approval email to:",
      input.buyerEmail
    );
    return { sent: false, reason: "Gmail SMTP not configured" };
  }

  const siteUrl = getSiteUrl();
  const textList = input.licenses
    .map(
      (l) =>
        `- ${l.productTitle}\n  License Key: ${l.licenseKey}\n  Download Link (15 min): ${siteUrl}${l.signedDownloadPath}`
    )
    .join("\n\n");

  const htmlList = input.licenses
    .map(
      (l) => `
      <li style="margin-bottom:14px;">
        <strong>${l.productTitle}</strong><br/>
        <code>License Key: ${l.licenseKey}</code><br/>
        <a href="${siteUrl}${l.signedDownloadPath}">Download Source Code (15-min signed link)</a>
      </li>`
    )
    .join("");

  await transporter.sendMail({
    from: `"${SITE_NAME}" <${process.env.GMAIL_SMTP_USER}>`,
    to: input.buyerEmail,
    subject: `[${SITE_NAME}] Payment Approved — Your Source Code is Ready`,
    text: [
      `Your manual payment for Order ${input.orderId} has been verified and approved!`,
      "",
      "Your Licenses & Download Links:",
      textList,
      "",
      `You can also regenerate download links anytime at ${siteUrl}/dashboard`,
    ].join("\n"),
    html: `
      <h2>Payment Approved — Download Your Source Code</h2>
      <p>Your manual payment for Order <strong>${input.orderId}</strong> has been verified.</p>
      <ul>${htmlList}</ul>
      <p>You can also access your orders and generate fresh download links anytime in your <a href="${siteUrl}/dashboard">Buyer Dashboard</a>.</p>
    `,
  });

  return { sent: true };
}
