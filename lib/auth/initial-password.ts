function normalizeTr(input: string) {
  return String(input || "")
    .toLowerCase()
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ı", "i")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c");
}

export function initialPasswordFromName(fullName: string) {
  const normalized = normalizeTr(fullName);
  const first = normalized.split(/\s+/).filter(Boolean)[0] || "";
  const baseRaw = first.replace(/[^a-z0-9]+/g, "");
  const base = baseRaw || "ogrenci";
  if (base.length >= 8) return base;
  return `${base}12345678`.slice(0, 8);
}
