/** Utilidades específicas para Haloperidol Decanoato (Haldol Decanoato) —
 *  medicação injetável IM de depósito, aplicada a cada N dias (21 ou 30).
 *  Não é medicação de uso diário: o "consumo/dia" é derivado de
 *  (ampolas por dose) ÷ (intervalo em dias). */
export function isHaldolDecanoato(nome?: string): boolean {
  if (!nome) return false;
  const t = nome.toLowerCase();
  return (
    (t.includes("haloperidol") || t.includes("haldol")) &&
    (t.includes("decanoato") || t.includes("decanoate"))
  );
}

/** Calcula consumo/dia médio a partir de ampolas por dose e intervalo em dias. */
export function consumoDiaHaldol(ampolas: number, intervaloDias: number): number {
  if (!ampolas || !intervaloDias || intervaloDias <= 0) return 0;
  return ampolas / intervaloDias;
}