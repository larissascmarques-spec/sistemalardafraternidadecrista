import type { EstoqueItem } from "./mock-data";

/** Quantas gotas equivalem a 1 ml quando o lote não informa um valor próprio. */
export const GOTAS_POR_ML_PADRAO = 20;

export function ehSolucaoGotas(item: { unidade?: string | null }): boolean {
  return (item.unidade || "unidade") === "ml";
}

export function gotasPorMlDe(item: { gotasPorMl?: number | null }): number {
  return Number(item?.gotasPorMl) > 0
    ? Number(item.gotasPorMl)
    : GOTAS_POR_ML_PADRAO;
}

/** Converte gotas -> ml usando a equivalência do lote. */
export function gotasParaMl(gotas: number, item: { gotasPorMl?: number | null }): number {
  const g = gotasPorMlDe(item);
  return g > 0 ? (Number(gotas) || 0) / g : 0;
}

/** Converte ml -> gotas usando a equivalência do lote. */
export function mlParaGotas(ml: number, item: { gotasPorMl?: number | null }): number {
  return (Number(ml) || 0) * gotasPorMlDe(item);
}

/** Rótulo curto da unidade do estoque ("ml" ou "un."). */
export function rotuloUnidade(item: { unidade?: string | null }): string {
  return ehSolucaoGotas(item) ? "ml" : "un.";
}

/** Texto amigável da quantidade ("30 ml (600 gotas)" ou "60 un."). */
export function textoQuantidade(
  qtd: number,
  item: Pick<EstoqueItem, "unidade" | "gotasPorMl">,
): string {
  const n = Math.round((Number(qtd) || 0) * 100) / 100;
  if (!ehSolucaoGotas(item)) return `${n} un.`;
  return `${n} ml (${Math.round(mlParaGotas(n, item))} gotas)`;
}

/** Texto amigável do consumo diário ("20 gotas/dia" ou "2/dia"). */
export function textoConsumoDia(
  consumo: number,
  item: Pick<EstoqueItem, "unidade" | "gotasPorMl">,
): string {
  const n = Number(consumo) || 0;
  if (!ehSolucaoGotas(item)) return `${Math.round(n * 100) / 100}/dia`;
  return `${Math.round(mlParaGotas(n, item))} gotas/dia`;
}