import { headers } from "next/headers";
import { Tenant, WebsitePage } from "@/lib/types";

export async function getPublicWebsiteData(slug: string) {
  if (!slug) throw new Error("Missing slug");

  const hdrs = await headers();
  const host = hdrs.get("host") || "localhost:3000";
  const protocol = process.env.VERCEL ? "https" : "http";
  const base = process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${host}`;

  const res = await fetch(
    `${base}/api/public/site/${encodeURIComponent(slug)}`,
    { cache: "no-store", next: { revalidate: 0 } }
  );

  if (!res.ok) {
    throw new Error("Tenant not found");
  }

  const json = (await res.json()) as {
    tenant: Tenant;
    homePage: WebsitePage | null;
    aboutPage: WebsitePage | null;
    contactPage: WebsitePage | null;
    branchesPage: WebsitePage | null;
  };
  return json;
}
