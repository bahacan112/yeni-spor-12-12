import crypto from "crypto";

export function tenantScopedAuthEmail(tenantId: string, realEmail: string) {
  const t = String(tenantId || "").trim();
  const e = String(realEmail || "").trim().toLowerCase();
  const h = crypto.createHash("sha256").update(`${t}|${e}`).digest("hex").slice(0, 24);
  return `t.${t}.${h}@tenant.local`;
}

