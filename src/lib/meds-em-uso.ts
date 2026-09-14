import { diasAte } from "./mock-data";
import { formatMedNome } from "./format-med";
import { chaveFarmaco } from "./farmacologia-db";
import {
  chaveBaixaMedicacao,
  medicacoesDaReceita,
  type ReceitaSalva,
} from "./receitas-store";

export type MedEmUso = {
  nome: string;
  vencida: boolean;
  diasVenc: number; // negativo = vencida há X dias
  receitaId?: string;
  origem?: "receita" | "manual";
};

export function chaveGrupoMedicacao(medicacao: string): string {
  return chaveFarmaco(medicacao) || chaveBaixaMedicacao(medicacao);
}

function dataReceita(r: ReceitaSalva): string {
  return r.dataEmissao || r.criadaEm || "";
}

function compararReceitasMaisRecentes(a: ReceitaSalva, b: ReceitaSalva): number {
  const porData = dataReceita(b).localeCompare(dataReceita(a));
  if (porData !== 0) return porData;
  return (b.criadaEm || "").localeCompare(a.criadaEm || "");
}

function receitaCobreMedicacao(r: ReceitaSalva, chaveMedicacao: string): boolean {
  return medicacoesDaReceita(r.medicacao).some(
    (m) => chaveGrupoMedicacao(m) === chaveMedicacao,
  );
}

/**
 * Identifica a receita mais recente para cada paciente + medicação.
 * Uma receita com vários itens conta separadamente para cada item; assim a
 * baixa e os alertas não confundem uma medicação com outra da mesma receita.
 */
export function receitaVigenteParaMedicacao(
  receitas: ReceitaSalva[],
  residenteId: string,
  medicacao: string,
): ReceitaSalva | undefined {
  const chave = chaveGrupoMedicacao(medicacao);
  if (!chave) return undefined;
  return receitas
    .filter(
      (r) => r.residenteId === residenteId && receitaCobreMedicacao(r, chave),
    )
    .sort(compararReceitasMaisRecentes)[0];
}

/**
 * Lista de medicações em uso da residente.
 *  - Agrupa receitas por princípio ativo (chaveFarmaco).
 *  - Para cada grupo, escolhe a MAIS RECENTE por data de emissão.
 *  - Se a mais recente estiver vencida e não houver substituta válida,
 *    ela é mantida na lista com o flag `vencida = true`.
 *  - Depois adiciona medicações digitadas manualmente que não estejam
 *    representadas por nenhuma receita.
 */
export function medsEmUsoDaResidente(
  receitas: ReceitaSalva[],
  residenteId: string,
  manuais: string[] = [],
): MedEmUso[] {
  const doPaciente = receitas.filter((r) => r.residenteId === residenteId);
  const grupos = new Map<string, ReceitaSalva[]>();
  for (const r of doPaciente) {
    for (const m of medicacoesDaReceita(r.medicacao)) {
      const k = chaveGrupoMedicacao(m);
      if (!k) continue;
      const arr = grupos.get(k) ?? [];
      arr.push(r);
      grupos.set(k, arr);
    }
  }

  const resultado: MedEmUso[] = [];
  const chavesUsadas = new Set<string>();

  for (const [k, arr] of grupos) {
    arr.sort(compararReceitasMaisRecentes);
    const validas = arr.filter((r) => diasAte(r.vencimento) >= 0);
    const escolhida = validas[0] ?? arr[0];
    if (!escolhida) continue;
    const dv = diasAte(escolhida.vencimento);
    const medDaReceita = medicacoesDaReceita(escolhida.medicacao).find(
      (m) => chaveGrupoMedicacao(m) === k,
    ) ?? escolhida.medicacao;
    resultado.push({
      nome: formatMedNome(medDaReceita),
      vencida: dv < 0,
      diasVenc: dv,
      receitaId: escolhida.id,
      origem: "receita",
    });
    chavesUsadas.add(k);
  }

  for (const m of manuais) {
    const k = chaveGrupoMedicacao(m);
    if (!k || chavesUsadas.has(k)) continue;
    chavesUsadas.add(k);
    resultado.push({
      nome: formatMedNome(m),
      vencida: false,
      diasVenc: 9999,
      origem: "manual",
    });
  }

  return resultado.sort((a, b) => a.nome.localeCompare(b.nome));
}

/**
 * Retorna apenas as receitas "vigentes" — a mais recente por
 * residente + princípio ativo (mesma lógica da lista da residente).
 * Receitas antigas superadas por uma mais nova ficam de fora
 * para não poluir alertas do painel.
 */
export function receitasVigentes(receitas: ReceitaSalva[]): ReceitaSalva[] {
  const grupos = new Map<string, ReceitaSalva[]>();
  for (const r of receitas) {
    for (const m of medicacoesDaReceita(r.medicacao)) {
      const kf = chaveGrupoMedicacao(m);
      if (!kf) continue;
      const k = `${r.residenteId}::${kf}`;
      const arr = grupos.get(k) ?? [];
      arr.push(r);
      grupos.set(k, arr);
    }
  }
  const vigentesPorMed = new Map<ReceitaSalva, Set<string>>();
  for (const [chaveGrupo, arr] of grupos.entries()) {
    const chaveMedicacao = chaveGrupo.split("::").slice(1).join("::");
    arr.sort(compararReceitasMaisRecentes);
    const validas = arr.filter((r) => diasAte(r.vencimento) >= 0);
    const escolhida = validas[0] ?? arr[0];
    if (!escolhida) continue;
    const set = vigentesPorMed.get(escolhida) ?? new Set<string>();
    set.add(chaveMedicacao);
    vigentesPorMed.set(escolhida, set);
  }
  return receitas
    .filter((r) => vigentesPorMed.has(r))
    .map((r) => {
      const chaves = vigentesPorMed.get(r);
      if (!chaves) return r;
      const meds = medicacoesDaReceita(r.medicacao);
      const medsVigentes = meds.filter((m) => chaves.has(chaveGrupoMedicacao(m)));
      if (medsVigentes.length === meds.length) return r;
      return { ...r, medicacao: medsVigentes.join("; ") };
    });
}

export function receitasVigentesPorMedicacao(
  receitas: ReceitaSalva[],
): Array<{ receita: ReceitaSalva; medicacao: string }> {
  const grupos = new Map<string, Array<{ receita: ReceitaSalva; medicacao: string }>>();
  for (const r of receitas) {
    for (const medicacao of medicacoesDaReceita(r.medicacao)) {
      const kf = chaveGrupoMedicacao(medicacao);
      if (!kf) continue;
      const k = `${r.residenteId}::${kf}`;
      const arr = grupos.get(k) ?? [];
      arr.push({ receita: r, medicacao });
      grupos.set(k, arr);
    }
  }

  const escolhidas: Array<{ receita: ReceitaSalva; medicacao: string }> = [];
  for (const arr of grupos.values()) {
    arr.sort((a, b) => compararReceitasMaisRecentes(a.receita, b.receita));
    const validas = arr.filter(({ receita }) => diasAte(receita.vencimento) >= 0);
    const escolhida = validas[0] ?? arr[0];
    if (escolhida) escolhidas.push(escolhida);
  }
  return escolhidas;
}