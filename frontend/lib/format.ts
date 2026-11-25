export const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString() : "—");

// <input type="date"> wants YYYY-MM-DD in local time.
export function toDateInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
export const fromDateInput = (v?: string) => (v ? new Date(`${v}T00:00:00`).toISOString() : null);

export function fmtUptime(sec: number): string {
  const d = Math.floor(sec / 86400), h = Math.floor((sec % 86400) / 3600), m = Math.floor((sec % 3600) / 60);
  return [d && `${d}d`, h && `${h}h`, `${m}m`].filter(Boolean).join(" ");
}
