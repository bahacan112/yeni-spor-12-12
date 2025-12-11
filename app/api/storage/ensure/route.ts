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
    const body = await req.json().catch(() => ({}));
    const bucket = body.bucket || "media";
    const isPublic = body.public !== false; // default true

    const supabase = getSupabaseService();
    const { data: exists } = await supabase.storage.getBucket(bucket);
    if (!exists) {
      const { error: createErr } = await supabase.storage.createBucket(bucket, {
        public: isPublic,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ["image/*"],
      });
      if (createErr) {
        return NextResponse.json(
          { ok: false, error: createErr.message },
          { status: 400 }
        );
      }
    }
    return NextResponse.json({ ok: true, bucket });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Failed" },
      { status: 500 }
    );
  }
}
