import type { Receita } from "./mock-data";
import { addDaysIso } from "./date-utils";
import { formatMedNome } from "./format-med";

export type BaixaMedicacaoReceita = {
  retirada?: boolean;
  retiradaData?: string;
  retiradaLocal?: string;
  proximaRetirada?: string;
  intervaloRetiradaDias?: number;
  proximaRetiradaExigeNovaReceita?: boolean;
  /** Baixa final — medicação de uso pontual (antibiótico, dipirona, etc.):
   *  não haverá próxima retirada. */
  usoUnico?: boolean;
};

export type ReceitaSalva = Receita & {
  criadaEm: string;
  /** Nome da residente no momento em que a receita foi salva, para não depender só do id. */
  residenteNome?: string;
  arquivo?: string;
  arquivoUrl?: string;
  arquivadaEm?: string;
  substituidaPor?: string;
  /** Data em que a receita foi restaurada do arquivo para as ativas. */
  restauradaEm?: string;
  /** Quando arquivada, motivo: vencida, suspensa, substituida, manual. */
  motivoArquivamento?: "vencida" | "suspensa" | "substituida" | "manual" | "alteracao_dosagem";
  observacao?: string;
  /** Baixa da retirada da medicação na farmácia/UBS. Independente do uso. */
  retirada?: boolean;
  retiradaData?: string;   // ISO yyyy-mm-dd
  retiradaLocal?: string;  // farmácia popular, UBS, etc
  /** Baixas separadas por medicação quando uma mesma receita contém vários itens. */
  retiradasMedicacoes?: Record<string, BaixaMedicacaoReceita>;
  /** Prazo (dias) a partir da emissão para conseguir retirar. Padrão 30. */
  prazoRetiradaDias?: number;
  /** Data prevista para a próxima retirada da medicação por essa paciente. */
  proximaRetirada?: string; // ISO yyyy-mm-dd
  /** Intervalo (dias) entre retiradas quando é medicação do SUS/UBS/Policlínica.
   *  Padrão 30 dias: o SUS dispensa 30d por vez mesmo em receita de 180d. */
  intervaloRetiradaDias?: number;
  /** Quando a próxima retirada cai depois do vencimento da receita:
   *  a data continua registrada, mas será necessária nova receita para retirar. */
  proximaRetiradaExigeNovaReceita?: boolean;
};

export const RECEITAS_STORAGE_KEY = "farmalar.receitas.v1";
export const RECEITAS_ARQUIVO_KEY = "farmalar.receitas.arquivo.v1";

/** Grava a lista de receitas no navegador com segurança.
 *  Os PDFs ficam guardados em base64 e ocupam muito espaço: quando o limite
 *  do navegador estoura, o gravar falha silenciosamente e a receita "some".
 *  Aqui tentamos gravar; se não couber, removemos os PDFs das receitas mais
 *  antigas até caber, mantendo sempre os dados da receita. */
export function gravarReceitasSeguro(
  key: string,
  lista: ReceitaSalva[],
): { ok: boolean; pdfsRemovidos: number; lista: ReceitaSalva[] } {
  if (typeof window === "undefined") return { ok: false, pdfsRemovidos: 0, lista };
  const tentar = (l: ReceitaSalva[]) => {
    try {
      window.localStorage.setItem(key, JSON.stringify(l));
      return true;
    } catch {
      return false;
    }
  };
  if (tentar(lista)) return { ok: true, pdfsRemovidos: 0, lista };

  // Remove PDFs das receitas mais antigas (por data de emissão) até caber.
  const ordem = lista
    .map((r, i) => ({ i, ts: new Date(r.dataEmissao).getTime() || 0 }))
    .filter(({ i }) => !!lista[i].arquivoUrl)
    .sort((a, b) => a.ts - b.ts);
  const copia = lista.slice();
  let removidos = 0;
  for (const { i } of ordem) {
    copia[i] = { ...copia[i], arquivoUrl: undefined };
    removidos += 1;
    if (tentar(copia)) return { ok: true, pdfsRemovidos: removidos, lista: copia };
  }
  return { ok: false, pdfsRemovidos: removidos, lista: copia };
}

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    // remove pontuação
    .replace(/[.,;:/()\-+]/g, " ")
    // remove formas farmacêuticas e palavras irrelevantes
    .replace(
      /\b(comprimido|comprimidos|revestido|revestidos|cp|cpr|cps|capsula|capsulas|drágea|dragea|drageas|solucao|solução|gotas|xarope|ampola|ampolas|frasco|frascos|sache|sachê|suspensao|suspensão|injetavel|injetável|oral|sublingual|liberacao|liberação|prolongada|generico|genérico)\b/g,
      " ",
    )
    // normaliza unidades "3 mg" -> "3mg"
    .replace(/(\d+)\s*(mg|mcg|g|ml|ui)\b/g, "$1$2")
    .replace(/\s+/g, " ")
    .trim();
}

export function medicacoesDaReceita(medicacao: string): string[] {
  const partes = (medicacao || "")
    .split(/\s*(?:;|\n|\r|\s\+\s|,(?=\s*[A-Za-zÀ-ÿ]))\s*/)
    .map((m) => m.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  return partes.length > 0 ? partes : [(medicacao || "").trim()].filter(Boolean);
}

export function chaveBaixaMedicacao(medicacao: string): string {
  return norm(medicacao) || medicacao.trim().toLowerCase();
}

/** Compara duas descrições de medicação de forma tolerante — usa o nome
 *  formatado (nome + dosagem) para ignorar diferenças de forma farmacêutica,
 *  posologia e maiúsculas. */
function mesmoMed(a: string, b: string): boolean {
  const na = norm(formatMedNome(a));
  const nb = norm(formatMedNome(b));
  if (!na || !nb) return false;
  if (na === nb) return true;
  // fallback: primeiro nome + primeira dosagem
  const chave = (s: string) => {
    const partes = s.split(" ");
    const nome = partes[0] || "";
    const dose = partes.find((p) => /\d/.test(p)) || "";
    return `${nome}|${dose}`;
  };
  return chave(na) === chave(nb);
}

export function baixaDaMedicacao(
  r: ReceitaSalva,
  medicacao: string,
): BaixaMedicacaoReceita | undefined {
  const baixa = r.retiradasMedicacoes?.[chaveBaixaMedicacao(medicacao)];
  if (baixa) return baixa;
  // Fallback: procura por qualquer chave equivalente (tolerante a variações
  // como "40mg comprimido" vs "40 mg" ou "1x ao dia" adicionado).
  if (r.retiradasMedicacoes) {
    for (const [k, v] of Object.entries(r.retiradasMedicacoes)) {
      if (mesmoMed(k, medicacao)) return v;
    }
  }
  const meds = medicacoesDaReceita(r.medicacao);
  if (meds.length <= 1 && r.retirada) {
    return {
      retirada: r.retirada,
      retiradaData: r.retiradaData,
      retiradaLocal: r.retiradaLocal,
      proximaRetirada: r.proximaRetirada,
      intervaloRetiradaDias: r.intervaloRetiradaDias,
      proximaRetiradaExigeNovaReceita: r.proximaRetiradaExigeNovaReceita,
    };
  }
  return undefined;
}

export function proximaRetiradaAtiva(
  r: ReceitaSalva,
  medicacao: string,
): (BaixaMedicacaoReceita & { proximaRetirada: string }) | undefined {
  const baixa = baixaDaMedicacao(r, medicacao);
  if (!baixa?.proximaRetirada) return undefined;
  if (baixa.usoUnico) return undefined;
  if (baixa.retiradaData && baixa.proximaRetirada <= baixa.retiradaData) return undefined;
  return { ...baixa, proximaRetirada: baixa.proximaRetirada };
}

export function medicacaoEstaRetirada(r: ReceitaSalva, medicacao: string): boolean {
  return !!baixaDaMedicacao(r, medicacao)?.retirada;
}

export function aplicarBaixaMedicacao(
  r: ReceitaSalva,
  medicacao: string,
  dados: { local?: string; data?: string; intervalo?: number; usoUnico?: boolean },
): ReceitaSalva {
  const hojeIso = new Date().toISOString().slice(0, 10);
  const baixaAnterior = baixaDaMedicacao(r, medicacao);
  const dataInformada = dados.data || hojeIso;
  const dataRet =
    baixaAnterior?.retirada &&
    baixaAnterior.proximaRetirada &&
    baixaAnterior.proximaRetirada <= hojeIso &&
    baixaAnterior.retiradaData &&
    dataInformada <= baixaAnterior.retiradaData
      ? hojeIso
      : dataInformada;
  const baixa: BaixaMedicacaoReceita = {
    retirada: true,
    retiradaLocal: dados.local?.trim() || undefined,
    retiradaData: dataRet,
    usoUnico: dados.usoUnico || undefined,
  };

  if (origemEhSus(r.origem) && !dados.usoUnico) {
    const intervaloDias = dados.intervalo && dados.intervalo > 0 ? dados.intervalo : intervaloRetiradaDe(r);
    const prox = addDaysIso(dataRet, intervaloDias);
    baixa.proximaRetirada = prox;
    baixa.intervaloRetiradaDias = intervaloDias;
    baixa.proximaRetiradaExigeNovaReceita = prox > r.vencimento;
  }

  const chave = chaveBaixaMedicacao(medicacao);
  // Remove entradas equivalentes salvas anteriormente com chave ligeiramente
  // diferente (variações de dosagem/forma). Sem isso, uma baixa antiga
  // "fantasma" continua com proximaRetirada vencida e o painel segue
  // acusando retirada atrasada mesmo depois da baixa nova.
  const base: Record<string, BaixaMedicacaoReceita> = {};
  for (const [k, v] of Object.entries(r.retiradasMedicacoes ?? {})) {
    if (k === chave) continue;
    if (mesmoMed(k, medicacao)) continue;
    base[k] = v;
  }
  const retiradasMedicacoes = { ...base, [chave]: baixa };
  const meds = medicacoesDaReceita(r.medicacao);
  const todasRetiradas = meds.every((m) => !!retiradasMedicacoes[chaveBaixaMedicacao(m)]?.retirada);
  const receitaSimples = meds.length <= 1;

  return {
    ...r,
    retiradasMedicacoes,
    retirada: todasRetiradas,
    retiradaLocal: receitaSimples ? baixa.retiradaLocal : r.retiradaLocal,
    retiradaData: receitaSimples ? baixa.retiradaData : r.retiradaData,
    proximaRetirada: receitaSimples ? baixa.proximaRetirada : undefined,
    intervaloRetiradaDias: receitaSimples ? baixa.intervaloRetiradaDias : r.intervaloRetiradaDias,
    proximaRetiradaExigeNovaReceita: receitaSimples
      ? baixa.proximaRetiradaExigeNovaReceita
      : undefined,
  };
}

export function removerBaixaMedicacao(r: ReceitaSalva, medicacao: string): ReceitaSalva {
  const chave = chaveBaixaMedicacao(medicacao);
  const retiradasMedicacoes = { ...(r.retiradasMedicacoes ?? {}) };
  delete retiradasMedicacoes[chave];
  const temBaixas = Object.keys(retiradasMedicacoes).length > 0;
  const meds = medicacoesDaReceita(r.medicacao);
  const todasRetiradas = meds.length > 0 && meds.every((m) => !!retiradasMedicacoes[chaveBaixaMedicacao(m)]?.retirada);

  return {
    ...r,
    retiradasMedicacoes: temBaixas ? retiradasMedicacoes : undefined,
    retirada: todasRetiradas,
    retiradaLocal: meds.length <= 1 ? undefined : r.retiradaLocal,
    retiradaData: meds.length <= 1 ? undefined : r.retiradaData,
    proximaRetirada: meds.length <= 1 ? undefined : r.proximaRetirada,
    proximaRetiradaExigeNovaReceita: meds.length <= 1 ? undefined : r.proximaRetiradaExigeNovaReceita,
  };
}

/** Chave que define "mesma receita": residente + medicação.
 *  O médico é ignorado de propósito — se o paciente trocar de médico/UBS,
 *  a receita nova ainda substitui a antiga da mesma medicação. */
export function chaveReceita(r: Pick<Receita, "residenteId" | "medicacao">): string {
  return [r.residenteId, norm(r.medicacao)].join("|");
}

export function calcVencimento(dataEmissao: string, validadeDias: number): string {
  return addDaysIso(dataEmissao, validadeDias);
}

/** Prazo padrão (dias) para retirar/comprar a medicação a partir da emissão.
 *  Receitas comuns (≤ 90 dias) → 30 dias. Receitas especiais de uso contínuo
 *  (≥ 180 dias) → mesma validade da receita. */
export function prazoRetiradaPadrao(validadeDias: number): number {
  return validadeDias >= 180 ? validadeDias : 30;
}

/** Dias efetivos de prazo de retirada para uma receita (usa o campo salvo
 *  quando existir, senão calcula pelo padrão). */
export function prazoRetiradaDe(r: Pick<ReceitaSalva, "prazoRetiradaDias" | "validadeDias">): number {
  return r.prazoRetiradaDias ?? prazoRetiradaPadrao(r.validadeDias);
}

/** Data-limite para conseguir retirar/comprar a medicação (ISO yyyy-mm-dd). */
export function dataLimiteRetirada(r: ReceitaSalva): string {
  return addDaysIso(r.dataEmissao, prazoRetiradaDe(r));
}

/** Retorna true quando a medicação é retirada em posto público (SUS/UBS/GRS/Policlínica).
 *  Nesses casos, o intervalo entre retiradas é fixo (30 dias por padrão). */
export function origemEhSus(origem?: string | null): boolean {
  const s = (origem ?? "").toLowerCase();
  return s.includes("sus") || s.includes("ubs") || s.includes("polic") || s.includes("grs");
}

/** Intervalo padrão entre retiradas no SUS: 30 dias. */
export function intervaloRetiradaDe(
  r: Pick<ReceitaSalva, "intervaloRetiradaDias" | "origem">,
): number {
  return r.intervaloRetiradaDias ?? 30;
}

export function novoIdReceita(existentes: ReceitaSalva[]): string {
  // Usa o maior número já usado + 1, evitando colisão quando alguma receita
  // foi apagada ou movida entre ativas e arquivo. Se por qualquer motivo o
  // id gerado ainda colidir (caso raro com ids importados fora do padrão),
  // continua incrementando até achar um livre.
  const usados = new Set(existentes.map((r) => r.id));
  let maior = 0;
  for (const r of existentes) {
    const m = /^RXU(\d+)$/.exec(r.id ?? "");
    if (m) {
      const n = Number(m[1]);
      if (Number.isFinite(n) && n > maior) maior = n;
    }
  }
  let n = maior + 1;
  let id = `RXU${String(n).padStart(3, "0")}`;
  while (usados.has(id)) {
    n += 1;
    id = `RXU${String(n).padStart(3, "0")}`;
  }
  return id;
}