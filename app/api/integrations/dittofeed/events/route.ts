import { NextRequest, NextResponse } from "next/server";
import { sendIdentify } from "@/lib/dittofeed/identify";
import { sendEvent } from "@/lib/dittofeed/events";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const type = String(body.type || "");
  if (!type)
    return NextResponse.json({ error: "type gerekli" }, { status: 400 });
  try {
    if (type === "identify") {
      const userId = String(body.userId || "");
      if (!userId)
        return NextResponse.json({ error: "userId gerekli" }, { status: 400 });
      const result = await sendIdentify({
        userId,
        traits:
          body.traits && typeof body.traits === "object"
            ? body.traits
            : undefined,
      });
      return NextResponse.json({ ok: true, result });
    }
    if (type === "track") {
      const userId = String(body.userId || "");
      const event = String(body.event || "");
      if (!userId || !event)
        return NextResponse.json(
          { error: "userId ve event gerekli" },
          { status: 400 }
        );
      const result = await sendEvent(event, {
        userId,
        properties:
          body.properties && typeof body.properties === "object"
            ? body.properties
            : undefined,
      });
      return NextResponse.json({ ok: true, result });
    }
    return NextResponse.json({ error: "Geçersiz type" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Server error" },
      { status: 500 }
    );
  }
}
