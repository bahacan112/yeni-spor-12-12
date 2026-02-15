export function sanitizeUserId(id: string) {
  return String(id || "").replace(/[^A-Za-z0-9_-]/g, "_");
}

export function randomMessageId() {
  if (globalThis.crypto && "randomUUID" in globalThis.crypto) {
    return (globalThis.crypto as any).randomUUID();
  }
  return undefined;
}

export function buildUserIdFromParts(
  tableName: string,
  tenantId?: string | null,
  userId?: string | null
) {
  const t = sanitizeUserId(String(tableName || "users"));
  const ten = sanitizeUserId(String(tenantId || "platform"));
  const u = sanitizeUserId(String(userId || ""));
  return `${t}:${ten}:user:${u}`;
}
