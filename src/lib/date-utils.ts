/**
 * Helpers para datas em formato ISO "YYYY-MM-DD" sem cair em
 * armadilhas de fuso horário. `new Date("2026-06-02")` é interpretado
 * como UTC e, em fusos negativos (Brasil = UTC-3), exibe o dia anterior.
 */

export function parseIsoLocal(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function fmtIsoBR(iso?: string | null): string {
  if (!iso) return "—";
  const s = iso.slice(0, 10);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return s;
  return `${m[3]}/${m[2]}/${m[1]}`;
}

/** Soma `dias` a uma data ISO e devolve outra string ISO, sem TZ shift. */
export function addDaysIso(iso: string, dias: number): string {
  const dt = parseIsoLocal(iso);
  dt.setDate(dt.getDate() + dias);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}