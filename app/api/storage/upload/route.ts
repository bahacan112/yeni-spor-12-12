import { NextRequest, NextResponse } from "next/server";
import { getSupabaseService } from "@/lib/supabase/service";

export async function POST(req: NextRequest) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { ok: false, error: "Missing SUPABASE_SERVICE_ROLE_KEY" },
        { status: 500 }
      );
    }
    const supabase = getSupabaseService();
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const bucket = (form.get("bucket") as string) || "media";
    const tenantId = (form.get("tenantId") as string) || "unknown";
    const folder = (form.get("folder") as string) || "images";
    if (!file) {
      return NextResponse.json({ ok: false, error: "file is required" }, { status: 400 });
    }

    const { data: exists } = await supabase.storage.getBucket(bucket);
    if (!exists) {
      const { error: createErr } = await supabase.storage.createBucket(bucket, {
        public: true,
        fileSizeLimit: 10485760,
        allowedMimeTypes: ["image/*"],
      });
      if (createErr) {
        return NextResponse.json({ ok: false, error: createErr.message }, { status: 400 });
      }
    }

    const ext = file.name.split(".").pop() || "jpg";
    const id = (global as any).crypto?.randomUUID?.() || String(Date.now());
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const path = `${tenantId}/${folder}/${yyyy}/${mm}/${dd}/${id}.${ext.toLowerCase()}`;

    const { error: upErr } = await supabase.storage
      .from(bucket)
      .upload(path, file, { cacheControl: "3600", upsert: true, contentType: file.type });
    if (upErr) {
      return NextResponse.json({ ok: false, error: upErr.message }, { status: 400 });
    }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return NextResponse.json({ ok: true, path, publicUrl: data.publicUrl });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Failed" }, { status: 500 });
  }
}

