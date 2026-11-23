import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { slug, secret } = body as { slug?: string; secret?: string };

    const expectedSecret = process.env.REVALIDATE_SECRET || process.env.NEXTAUTH_SECRET;
    if (expectedSecret && secret !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    revalidateTag("products");
    if (slug) {
      revalidateTag(`product-${slug}`);
    }

    return NextResponse.json({
      revalidated: true,
      tags: slug ? ["products", `product-${slug}`] : ["products"],
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
