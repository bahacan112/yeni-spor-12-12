import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(
  _req: Request,
  context: { params: Promise<{ domain: string }> }
) {
  const { domain } = await context.params

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const supabase = createClient(url, key)

  const clean = domain.toLowerCase()

  const { data: tenant, error } = await supabase
    .from("tenants")
    .select("slug, website_domain, website_enabled")
    .eq("website_domain", clean)
    .single()

  if (error || !tenant) {
    return NextResponse.json({ error: "Domain not mapped" }, { status: 404 })
  }

  return NextResponse.json({ slug: tenant.slug, websiteEnabled: tenant.website_enabled })
}

