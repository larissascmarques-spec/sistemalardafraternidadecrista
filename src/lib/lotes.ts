import type { EstoqueRow } from "./estoque-store";
import { addDaysIso, parseIsoLocal } from "./date-utils";

function hojeIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

/** Quantos dias já se passaram desde uma data ISO (nunca negativo). */
function diasDesde(iso?: string): number {
  if (!iso) return 0;
  const inicio = parseIsoLocal(iso).getTime();
  const agora = parseIsoLocal(hojeIso()).getTime();
  const dias = Math.floor((agora - inicio) / 86400000);
  return dias > 0 ? dias : 0;
}

/**
 * Saldo real do lote HOJE: a quantidade lançada menos o que já foi consumido
 * desde a data de lançamento (ou desde a última correção manual de quantidade).
 * Nunca fica negativo — o que passa disso é falta de medicação, não estoque.
 */
export function saldoLote(lote: EstoqueRow): number {
  const qtd = Number(lote.quantidade) || 0;
  const consumo = consumoDoLote(lote);
  if (consumo <= 0) return qtd;
  const base = lote.ultimaBaixa || lote.lancadoEm;
  const consumido = consumo * diasDesde(base);
  return Math.max(0, qtd - consumido);
}

/** true quando o lote já zerou pela contagem diária. */
export function loteAcabou(lote: EstoqueRow): boolean {
  return consumoDoLote(lote) > 0 && saldoLote(lote) <= 0;
}

/** Soma dos saldos reais de um grupo de lotes. */
export function saldoGrupo(lotes: EstoqueRow[]): number {
  return lotes.reduce((s, l) => s + saldoLote(l), 0);
}

/**
 * Consumo/dia real de um grupo de lotes da MESMA medicação.
 * Cada lote guarda quem usa aquele lote; se a mesma residente aparece em
 * dois lotes, ela consome uma vez só — por isso deduplicamos por residente.
 */
export function consumoGrupoLotes(lotes: EstoqueRow[]): number {
  const porResidente = new Map<string, number>();
  let temPaciente = false;
  for (const l of lotes) {
    for (const p of l.pacientesUso ?? []) {
      if (!p.residenteId) continue;
      // Uso "se necessário" não entra na conta de consumo diário.
      if (p.seNecessario) continue;
      temPaciente = true;
      porResidente.set(
        p.residenteId,
        Math.max(porResidente.get(p.residenteId) ?? 0, Number(p.qtdDia) || 0),
      );
    }
  }
  if (temPaciente) {
    return Array.from(porResidente.values()).reduce((a, b) => a + b, 0);
  }
  // Sem residentes vinculados: usa o maior consumo informado nos lotes.
  return lotes.reduce((m, l) => Math.max(m, Number(l.consumoDiario) || 0), 0);
}

/**
 * Consumo/dia de UM lote: soma só de quem foi marcado naquele lote,
 * ignorando quem usa "se necessário". Se ninguém foi marcado no lote,
 * cai para o consumo informado no próprio lote.
 */
export function consumoDoLote(lote: EstoqueRow): number {
  const pacientes = (lote.pacientesUso ?? []).filter(
    (p) => p.residenteId && !p.seNecessario,
  );
  if (pacientes.length > 0) {
    return pacientes.reduce((a, p) => a + (Number(p.qtdDia) || 0), 0);
  }
  if ((lote.pacientesUso ?? []).some((p) => p.residenteId && p.seNecessario)) {
    return 0;
  }
  return Number(lote.consumoDiario) || 0;
}

export type LoteSequencia = {
  id: string;
  ordem: number;
  /** Consumo/dia usado para calcular a duração deste lote. */
  consumo: number;
  /** Saldo real do lote hoje (já descontado o consumo desde o lançamento). */
  saldo: number;
  /** Em quantos dias este lote começa a ser usado (0 = em uso agora). */
  inicioDias: number;
  /** Quantos dias este lote dura sozinho. */
  duracaoDias: number;
  /** Em quantos dias este lote acaba. */
  fimDias: number;
  emUso: boolean;
  /** true quando o saldo já zerou pela contagem diária. */
  acabou: boolean;
  /** Data prevista de término (ISO). */
  fimData: string;
};

/** Chave de agrupamento: quem usa o lote. Lotes com as mesmas residentes
 * entram na mesma fila; residentes diferentes têm filas independentes. */
function chaveResidentes(lote: EstoqueRow): string {
  const ids = Array.from(
    new Set(
      (lote.pacientesUso ?? [])
        .filter((p) => p.residenteId)
        .map((p) => p.residenteId),
    ),
  ).sort();
  return ids.length > 0 ? ids.join("|") : "__sem_residente__";
}

/**
 * Cada residente contabiliza o seu próprio lote: lotes de residentes
 * diferentes são filas separadas (todos "em uso" hoje). Quando duas ou mais
 * residentes compartilham os mesmos lotes, esses lotes formam uma fila única —
 * do menor para o maior — e o seguinte só começa quando o anterior acaba.
 */
export function sequenciaLotes(lotes: EstoqueRow[]): Map<string, LoteSequencia> {
  const hoje = hojeIso();
  const grupos = new Map<string, EstoqueRow[]>();
  for (const l of lotes) {
    const k = chaveResidentes(l);
    const arr = grupos.get(k);
    if (arr) arr.push(l);
    else grupos.set(k, [l]);
  }
  const mapa = new Map<string, LoteSequencia>();
  for (const grupo of grupos.values()) {
    // Lotes que já zeraram saem da fila: não estão "em uso", já acabaram.
    const terminados = grupo.filter((l) => loteAcabou(l));
    for (const l of terminados) {
      mapa.set(l.id, {
        id: l.id,
        ordem: 0,
        consumo: consumoDoLote(l),
        saldo: 0,
        inicioDias: 0,
        duracaoDias: 0,
        fimDias: 0,
        emUso: false,
        acabou: true,
        fimData: hoje,
      });
    }
    const ordenados = grupo
      .filter((l) => !loteAcabou(l))
      .sort((a, b) => saldoLote(a) - saldoLote(b));
    let acumulado = 0;
    ordenados.forEach((l, i) => {
      const consumo = consumoDoLote(l);
      const saldo = saldoLote(l);
      const duracao =
        consumo > 0 ? Math.floor(saldo / consumo) : 0;
      const inicio = acumulado;
      const fim = inicio + duracao;
      mapa.set(l.id, {
        id: l.id,
        ordem: i + 1,
        consumo,
        saldo,
        inicioDias: inicio,
        duracaoDias: duracao,
        fimDias: fim,
        emUso: i === 0,
        acabou: false,
        fimData: consumo > 0 ? addDaysIso(hoje, fim) : "",
      });
      acumulado = fim;
    });
  }
  return mapa;
}

export type SituacaoResidente = {
  residenteId: string;
  medicacao: string;
  /** Consumo/dia dessa residente para essa medicação. */
  consumo: number;
  /** Saldo disponível hoje, somando só os lotes dessa residente. */
  saldo: number;
  /** Dias que o saldo ainda cobre. */
  dias: number;
};

/**
 * Quanto ainda resta PARA CADA RESIDENTE de uma medicação.
 * Cada residente só conta com os lotes em que está marcada; quando o lote é
 * compartilhado, o saldo é dividido na proporção do consumo de cada uma.
 */
export function situacaoPorResidente(lotes: EstoqueRow[]): SituacaoResidente[] {
  const acc = new Map<string, { saldo: number; consumo: number }>();
  for (const l of lotes) {
    const usuarios = (l.pacientesUso ?? []).filter(
      (p) => p.residenteId && !p.seNecessario && (Number(p.qtdDia) || 0) > 0,
    );
    if (usuarios.length === 0) continue;
    const total = usuarios.reduce((a, p) => a + (Number(p.qtdDia) || 0), 0);
    const saldo = saldoLote(l);
    for (const p of usuarios) {
      const parte = total > 0 ? (Number(p.qtdDia) || 0) / total : 0;
      const cur = acc.get(p.residenteId) ?? { saldo: 0, consumo: 0 };
      cur.saldo += saldo * parte;
      cur.consumo = Math.max(cur.consumo, Number(p.qtdDia) || 0);
      acc.set(p.residenteId, cur);
    }
  }
  const medicacao = lotes[0]?.medicacao ?? "";
  return Array.from(acc.entries()).map(([residenteId, v]) => ({
    residenteId,
    medicacao,
    consumo: v.consumo,
    saldo: Math.round(v.saldo * 100) / 100,
    dias: v.consumo > 0 ? Math.floor(v.saldo / v.consumo) : 999,
  }));
}