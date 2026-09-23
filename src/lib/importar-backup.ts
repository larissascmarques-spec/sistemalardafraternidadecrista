import { supabase } from "@/integrations/supabase/client";

export type ResultadoImportacao = {
  residentes: number;
  estoque: number;
  agendamentos: number;
  receitas: number;
  insumos: number;
  procedimentos: number;
  erros: string[];
};

type Backup = {
  tables?: Record<string, unknown[]>;
};

function asRows(v: unknown): Record<string, unknown>[] {
  return Array.isArray(v) ? (v as Record<string, unknown>[]) : [];
}

function emptyToNull(v: unknown) {
  if (v === "" || v === undefined) return null;
  return v;
}

async function currentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Faça login antes de importar.");
  return data.user.id;
}

async function upsertChunk(
  table: string,
  rows: Record<string, unknown>[],
  erros: string[],
) {
  const size = 25;
  let ok = 0;
  for (let i = 0; i < rows.length; i += size) {
    const chunk = rows.slice(i, i + size);
    const { error } = await supabase.from(table as never).upsert(chunk as never, {
      onConflict: "id",
    });
    if (!error) {
      ok += chunk.length;
      continue;
    }
    for (const row of chunk) {
      const retry = { ...row, id: crypto.randomUUID() };
      const { error: e2 } = await supabase.from(table as never).insert(retry as never);
      if (e2) erros.push(`${table}: ${e2.message}`);
      else ok += 1;
    }
  }
  return ok;
}

export async function importarBackupFarmalar(raw: unknown): Promise<ResultadoImportacao> {
  const uid = await currentUserId();
  const backup = raw as Backup;
  const tables = backup.tables ?? (raw as Record<string, unknown[]>);
  const erros: string[] = [];

  const residentes = asRows(tables.residentes).map((r) => ({
    ...r,
    user_id: uid,
    diagnosticos: Array.isArray(r.diagnosticos) ? r.diagnosticos : [],
    alergias: Array.isArray(r.alergias) ? r.alergias : [],
    alertas: Array.isArray(r.alertas) ? r.alertas : [],
    extras: r.extras && typeof r.extras === "object" ? r.extras : {},
    haldol_injetavel: emptyToNull(r.haldol_injetavel),
    data_nascimento: emptyToNull(r.data_nascimento),
    observacoes: emptyToNull(r.observacoes),
    responsavel: emptyToNull(r.responsavel),
    medico: emptyToNull(r.medico),
    ubs: emptyToNull(r.ubs),
  }));

  const estoque = asRows(tables.estoque).map((r) => ({
    ...r,
    user_id: uid,
    pacientes_uso: Array.isArray(r.pacientes_uso) ? r.pacientes_uso : [],
    quantidade: r.quantidade ?? 0,
    estoque_minimo: r.estoque_minimo ?? 0,
    consumo_diario: r.consumo_diario ?? 0,
    tipo_uso: r.tipo_uso || "continua",
    unidade: r.unidade || "unidade",
    validade: emptyToNull(r.validade),
    proxima_compra: emptyToNull(r.proxima_compra),
    lancado_em: emptyToNull(r.lancado_em),
    ultima_baixa: emptyToNull(r.ultima_baixa),
    ultima_retirada: emptyToNull(r.ultima_retirada),
    proxima_retirada: emptyToNull(r.proxima_retirada),
    gotas_por_ml: emptyToNull(r.gotas_por_ml),
    observacao: emptyToNull(r.observacao),
  }));

  const agendamentos = asRows(tables.agendamentos).map((r) => ({
    ...r,
    user_id: uid,
    hora: emptyToNull(r.hora),
    local: emptyToNull(r.local),
    medico: emptyToNull(r.medico),
    observacoes: emptyToNull(r.observacoes),
    motivo: emptyToNull(r.motivo),
    especialidade: emptyToNull(r.especialidade),
    resultado_data: emptyToNull(r.resultado_data),
    resultado_retirado_em: emptyToNull(r.resultado_retirado_em),
    realizado_em: emptyToNull(r.realizado_em),
    realizado: !!r.realizado,
    resultado_retirado: !!r.resultado_retirado,
    status: r.status || "Agendada",
  }));

  const receitas = asRows(tables.receitas).map((r) => ({ ...r, user_id: uid }));
  const insumos = asRows(tables.insumos).map((r) => ({ ...r, user_id: uid }));
  const procedimentos = asRows(tables.procedimentos).map((r) => ({ ...r, user_id: uid }));

  return {
    residentes: await upsertChunk("residentes", residentes, erros),
    estoque: await upsertChunk("estoque", estoque, erros),
    agendamentos: await upsertChunk("agendamentos", agendamentos, erros),
    receitas: receitas.length ? await upsertChunk("receitas", receitas, erros) : 0,
    insumos: insumos.length ? await upsertChunk("insumos", insumos, erros) : 0,
    procedimentos: procedimentos.length ? await upsertChunk("procedimentos", procedimentos, erros) : 0,
    erros,
  };
}
