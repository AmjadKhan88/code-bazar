import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard/",
          "/seller/",
          "/admin/",
          "/api/",
          "/checkout/",
          "/*?*sort=*",
          "/*?*filter=*",
          "/*?*q=*",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
