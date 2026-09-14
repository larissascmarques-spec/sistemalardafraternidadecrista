import { diasAte } from "./mock-data";
import { chaveFarmaco } from "./farmacologia-db";
import { formatMedNome } from "./format-med";
import {
  medicacoesDaReceita,
  type ReceitaSalva,
} from "./receitas-store";
import type { ResidenteSalvo } from "./residentes-store";

export type NivelInconsistencia = "erro" | "alerta";

export type Inconsistencia = {
  nivel: NivelInconsistencia;
  tipo:
    | "med_sem_receita"
    | "receita_vencida_sem_substituta"
    | "dosagem_divergente"
    | "duplicidade_receita"
    | "receita_sem_uso";
  medicacao: string;
  mensagem: string;
  receitaId?: string;
};

/** Extrai a dosagem (ex.: "3mg", "500 mg", "10ml") de um texto livre. */
function extrairDosagem(texto: string): string | null {
  if (!texto) return null;
  const m = texto
    .toLowerCase()
    .replace(/\s+/g, " ")
    .match(/(\d+(?:[.,]\d+)?)\s*(mg|mcg|g|ml|ui)\b/);
  return m ? `${m[1].replace(",", ".")}${m[2]}` : null;
}

/**
 * Compara medicações em uso × receitas ativas de uma residente e sinaliza
 * incoerências que a enfermagem precisa resolver.
 */
export function detectarInconsistencias(
  residente: ResidenteSalvo,
  todasReceitas: ReceitaSalva[],
): Inconsistencia[] {
  const out: Inconsistencia[] = [];
  const doPaciente = todasReceitas.filter((r) => r.residenteId === residente.id);

  // Agrupa receitas por princípio ativo
  const gruposReceita = new Map<string, ReceitaSalva[]>();
  for (const r of doPaciente) {
    for (const med of medicacoesDaReceita(r.medicacao)) {
      const k = chaveFarmaco(med) || med.toLowerCase().trim();
      if (!k) continue;
      const arr = gruposReceita.get(k) ?? [];
      arr.push(r);
      gruposReceita.set(k, arr);
    }
  }

  // 1. Medicação manual sem nenhuma receita
  for (const nomeManual of residente.medicacoesUso ?? []) {
    if (!nomeManual?.trim()) continue;
    const k = chaveFarmaco(nomeManual) || nomeManual.toLowerCase().trim();
    if (!gruposReceita.has(k)) {
      out.push({
        nivel: "erro",
        tipo: "med_sem_receita",
        medicacao: formatMedNome(nomeManual),
        mensagem:
          "Medicação em uso cadastrada manualmente, mas não há nenhuma receita anexada no sistema.",
      });
    }
  }

  // 2. Para cada princípio ativo com receitas, analisar vigência e duplicidade
  for (const [k, arr] of gruposReceita) {
    arr.sort((a, b) => (b.dataEmissao || "").localeCompare(a.dataEmissao || ""));
    const validas = arr.filter((r) => diasAte(r.vencimento) >= 0);
    const nomeExibicao = formatMedNome(arr[0].medicacao);

    if (validas.length === 0) {
      out.push({
        nivel: "erro",
        tipo: "receita_vencida_sem_substituta",
        medicacao: nomeExibicao,
        receitaId: arr[0].id,
        mensagem: `Última receita venceu há ${Math.abs(diasAte(arr[0].vencimento))} dia(s). Renovar com o médico.`,
      });
    } else if (validas.length > 1) {
      out.push({
        nivel: "alerta",
        tipo: "duplicidade_receita",
        medicacao: nomeExibicao,
        receitaId: validas[0].id,
        mensagem: `${validas.length} receitas ativas para o mesmo princípio ativo — verificar se alguma deve ser arquivada.`,
      });
    }

    // 3. Dosagem divergente entre a receita mais recente e o cadastro manual
    const nomeManualIgual = (residente.medicacoesUso ?? []).find((m) => {
      const km = chaveFarmaco(m) || m.toLowerCase().trim();
      return km === k;
    });
    if (nomeManualIgual) {
      const doseManual = extrairDosagem(nomeManualIgual);
      const escolhida = validas[0] ?? arr[0];
      const doseReceita =
        extrairDosagem(escolhida.dosagem || "") ||
        extrairDosagem(escolhida.medicacao || "");
      if (doseManual && doseReceita && doseManual !== doseReceita) {
        out.push({
          nivel: "alerta",
          tipo: "dosagem_divergente",
          medicacao: nomeExibicao,
          receitaId: escolhida.id,
          mensagem: `Dosagem no cadastro (${doseManual}) difere da receita (${doseReceita}).`,
        });
      }
    }
  }

  return out;
}

export function resumoInconsistencias(list: Inconsistencia[]): {
  erros: number;
  alertas: number;
} {
  return {
    erros: list.filter((i) => i.nivel === "erro").length,
    alertas: list.filter((i) => i.nivel === "alerta").length,
  };
}