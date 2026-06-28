export function typeId(value: unknown): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "") || "normal";
}
