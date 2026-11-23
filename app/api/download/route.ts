import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { License } from "@/models/License";
import { Product } from "@/models/Product";
import { verifyDownloadParams } from "@/lib/download";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const licenseId = searchParams.get("licenseId") || "";
  const productId = searchParams.get("productId") || "";
  const exp = Number(searchParams.get("exp") || "0");
  const sig = searchParams.get("sig") || "";

  if (!verifyDownloadParams(licenseId, productId, exp, sig)) {
    return NextResponse.json(
      { error: "Invalid or expired download link." },
      { status: 403 }
    );
  }

  await connectDB();

  const license = await License.findById(licenseId);
  if (!license || !license.active || String(license.productId) !== productId) {
    return NextResponse.json(
      { error: "License not found or inactive." },
      { status: 404 }
    );
  }

  if (license.downloadCount >= license.maxDownloads) {
    return NextResponse.json(
      { error: "Maximum download limit reached for this license." },
      { status: 429 }
    );
  }

  const product = await Product.findById(productId)
    .select("+downloadUrl title slug version techStack")
    .lean();

  if (!product) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  license.downloadCount += 1;
  await license.save();

  if (product.downloadUrl.startsWith("https://")) {
    return NextResponse.redirect(product.downloadUrl);
  }

  // Deliver a verified source-package manifest for local private:// archives
  const packageManifest = {
    marketplace: "CodeBazaar",
    product: product.title,
    slug: product.slug,
    version: product.version,
    techStack: product.techStack,
    licenseKey: license.licenseKey,
    licenseType: license.licenseType,
    buyerEmail: license.buyerEmail,
    archiveSource: product.downloadUrl,
    downloadedAt: new Date().toISOString(),
  };

  return new NextResponse(JSON.stringify(packageManifest, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${product.slug}-v${product.version}-license.json"`,
      "Cache-Control": "no-store",
    },
  });
}
