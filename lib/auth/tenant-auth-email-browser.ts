export async function tenantScopedAuthEmailBrowser(
  tenantId: string,
  realEmail: string,
) {
  const t = String(tenantId || "").trim();
  const e = String(realEmail || "").trim().toLowerCase();
  const enc = new TextEncoder();
  const bytes = enc.encode(`${t}|${e}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const arr = Array.from(new Uint8Array(digest));
  const hex = arr.map((b) => b.toString(16).padStart(2, "0")).join("");
  const h = hex.slice(0, 24);
  return `t.${t}.${h}@tenant.local`;
}

