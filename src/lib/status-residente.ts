import { diasAte } from "./mock-data";
import {
  medicacoesDaReceita,
  proximaRetiradaAtiva,
  type ReceitaSalva,
} from "./receitas-store";
import type { EstoqueRow } from "./estoque-store";
import { consumoDoLote, saldoLote, situacaoPorResidente } from "./lotes";

export type StatusResidente = {
  nivel: "vencida" | "retirar" | "renovar" | "ok";
  label: string;
  /** Cor do badge: destructive | warning | success. */
  tone: "destructive" | "warning" | "warning-soft" | "success";
};

export function statusResidente(
  receitasAtivas: ReceitaSalva[],
  todoEstoque: EstoqueRow[],
  residenteId: string,
): StatusResidente {
  // 1) Alguma receita vencida (passou do vencimento)
  const vencidas = receitasAtivas.filter((r) => diasAte(r.vencimento) < 0);
  if (vencidas.length > 0) {
    return { nivel: "vencida", label: "Receita vencida", tone: "destructive" };
  }

  // 2) Estoque crítico (<=7 dias em algum medicamento contínuo)
  //    IMPORTANTE: agregar por medicação — somar TODOS os lotes com o mesmo
  //    nome (mesmo os que não têm a residente marcada em pacientesUso),
  //    porque o consumo diário é do grupo inteiro.
  const estoqueCritico = diasPorMedicacaoDaResidente(todoEstoque, residenteId)
    .filter((m) => m.tipoUso === "continua")
    .map((m) => m.dias)
    .filter((d) => d <= 7);
  if (estoqueCritico.length > 0) {
    const menor = Math.min(...estoqueCritico);
    return {
      nivel: "retirar",
      label: `Estoque em ${menor}d`,
      tone: "destructive",
    };
  }

  // 3) Alguma retirada próxima nos próximos 7 dias
  const retirar = receitasAtivas
    .flatMap((r) =>
      medicacoesDaReceita(r.medicacao).flatMap((m) => {
        const baixa = proximaRetiradaAtiva(r, m);
        return baixa ? [diasAte(baixa.proximaRetirada)] : [];
      }),
    )
    .filter((d) => d >= 0 && d <= 7);
  if (retirar.length > 0) {
    const menor = Math.min(...retirar);
    return {
      nivel: "retirar",
      label: `Retirar em ${menor}d`,
      tone: "warning",
    };
  }

  // 4) Alguma receita a renovar em até 30 dias
  const renovar = receitasAtivas
    .map((r) => diasAte(r.vencimento))
    .filter((d) => d >= 0 && d <= 30);
  if (renovar.length > 0) {
    const menor = Math.min(...renovar);
    return {
      nivel: "renovar",
      label: `Renovar em ${menor}d`,
      tone: "warning-soft",
    };
  }

  return { nivel: "ok", label: "Tudo em dia", tone: "success" };
}

/** Dias restantes de um lote isolado, sobre o saldo REAL de hoje. */
export function diasRestantesLote(e: EstoqueRow): number {
  const consumo = consumoDoLote(e);
  if (consumo <= 0) return 999;
  return Math.floor(saldoLote(e) / consumo);
}

/**
 * Para cada medicação que a residente usa, calcula o saldo real de hoje
 * (já descontado o consumo diário) só dos lotes dela e devolve os dias
 * restantes.
 */
export function diasPorMedicacaoDaResidente(
  itens: EstoqueRow[],
  residenteId: string,
): Array<{ medicacao: string; dias: number; tipoUso: string }> {
  const grupos = new Map<string, EstoqueRow[]>();
  for (const e of itens) {
    const k = (e.medicacao || "").trim().toLowerCase();
    if (!grupos.has(k)) grupos.set(k, []);
    grupos.get(k)!.push(e);
  }
  const out: Array<{ medicacao: string; dias: number; tipoUso: string }> = [];
  for (const [, lotes] of grupos) {
    const usa = lotes.some((e) =>
      (e.pacientesUso ?? []).some((p) => p.residenteId === residenteId),
    );
    if (!usa) continue;
    const sit = situacaoPorResidente(lotes).find((s) => s.residenteId === residenteId);
    out.push({
      medicacao: lotes[0].medicacao,
      dias: sit ? sit.dias : 999,
      tipoUso: (lotes[0].tipoUso as string) || "continua",
    });
  }
  return out;
}

export function iniciaisDe(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0][0]?.toUpperCase() ?? "?";
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

/** Filtra estoque para uma residente: lotes em que ela aparece em pacientesUso. */
export function estoqueDaResidente(
  itens: EstoqueRow[],
  residenteId: string,
): EstoqueRow[] {
  return itens.filter((e) =>
    (e.pacientesUso ?? []).some((p) => p.residenteId === residenteId),
  );
}

export function toneClasses(tone: StatusResidente["tone"]): string {
  switch (tone) {
    case "destructive":
      return "bg-destructive/15 text-destructive border-destructive/40";
    case "warning":
      return "bg-[color:var(--warning)]/20 text-[color:var(--warning-foreground)] border-[color:var(--warning)]/40";
    case "warning-soft":
      return "bg-[color:var(--warning)]/10 text-[color:var(--warning-foreground)] border-[color:var(--warning)]/30";
    case "success":
      return "bg-[color:var(--success)]/15 text-[color:var(--success)] border-[color:var(--success)]/40";
  }
}