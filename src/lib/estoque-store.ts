import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { EstoqueItem } from "./mock-data";

export type EstoqueRow = EstoqueItem & { id: string };

const CHANNEL = "estoque:changed";
function notify() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CHANNEL));
}

type DbRow = {
  id: string;
  codigo: string | null;
  medicacao: string;
  apresentacao: string | null;
  lote: string | null;
  validade: string | null;
  quantidade: number;
  estoque_minimo: number;
  consumo_diario: number;
  origem: string | null;
  local: string | null;
  pacientes_uso: unknown;
  proxima_compra: string | null;
  observacao: string | null;
  tipo_uso?: string | null;
  unidade?: string | null;
  gotas_por_ml?: number | null;
  lancado_em?: string | null;
  ultima_baixa?: string | null;
  ultima_retirada?: string | null;
  proxima_retirada?: string | null;
};

function fromDb(r: DbRow): EstoqueRow {
  return {
    id: r.id,
    codigo: r.codigo || r.id.slice(0, 6),
    medicacao: r.medicacao,
    apresentacao: r.apresentacao || "",
    lote: r.lote || "",
    validade: r.validade || "",
    quantidade: Number(r.quantidade) || 0,
    estoqueMinimo: Number(r.estoque_minimo) || 0,
    consumoDiario: Number(r.consumo_diario) || 0,
    origem: r.origem || "",
    local: r.local || "",
    pacientesUso: Array.isArray(r.pacientes_uso)
      ? (r.pacientes_uso as Array<{ residenteId: string; qtdDia: number }>)
      : [],
    proximaCompra: r.proxima_compra || undefined,
    observacao: r.observacao || undefined,
    tipoUso: (r.tipo_uso as EstoqueRow["tipoUso"]) || "continua",
    unidade: (r.unidade as EstoqueRow["unidade"]) || "unidade",
    gotasPorMl: r.gotas_por_ml != null ? Number(r.gotas_por_ml) : undefined,
    lancadoEm: r.lancado_em || undefined,
    ultimaBaixa: r.ultima_baixa || undefined,
    ultimaRetirada: r.ultima_retirada || undefined,
    proximaRetirada: r.proxima_retirada || undefined,
  };
}

function toDb(item: Omit<EstoqueItem, "codigo"> & { codigo?: string }) {
  return {
    codigo: item.codigo || null,
    medicacao: item.medicacao,
    apresentacao: item.apresentacao || null,
    lote: item.lote || null,
    validade: item.validade || null,
    quantidade: item.quantidade || 0,
    estoque_minimo: item.estoqueMinimo || 0,
    consumo_diario: item.consumoDiario || 0,
    origem: item.origem || null,
    local: item.local || null,
    pacientes_uso: item.pacientesUso ?? [],
    proxima_compra: item.proximaCompra || null,
    observacao: item.observacao || null,
    tipo_uso: item.tipoUso || "continua",
    unidade: item.unidade || "unidade",
    gotas_por_ml: item.gotasPorMl ?? null,
    lancado_em: item.lancadoEm || null,
    ultima_baixa: item.ultimaBaixa || item.lancadoEm || null,
    ultima_retirada: item.ultimaRetirada || null,
    proxima_retirada: item.proximaRetirada || null,
  };
}

export async function listarEstoque(): Promise<EstoqueRow[]> {
  const { data, error } = await supabase
    .from("estoque")
    .select("*")
    .order("medicacao");
  if (error) {
    console.error("[estoque] listar:", error);
    return [];
  }
  return (data as DbRow[]).map(fromDb);
}

async function userId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

async function gerarCodigo(): Promise<string> {
  const { count } = await supabase
    .from("estoque")
    .select("*", { count: "exact", head: true });
  const n = (count || 0) + 1;
  return `E${String(n).padStart(3, "0")}`;
}

async function buscarPorMedLote(medicacao: string, lote: string) {
  const { data } = await supabase
    .from("estoque")
    .select("*")
    .ilike("medicacao", medicacao)
    .ilike("lote", lote || "")
    .maybeSingle();
  return data as DbRow | null;
}

export async function adicionarItem(
  item: Omit<EstoqueItem, "codigo"> & { codigo?: string },
): Promise<EstoqueRow | null> {
  const uid = await userId();
  if (!uid) {
    console.error("[estoque] sem usuário");
    return null;
  }
  const existente = await buscarPorMedLote(item.medicacao, item.lote);
  if (existente) {
    const patch = {
      quantidade: existente.quantidade + (item.quantidade || 0),
      validade: item.validade || existente.validade,
      local: item.local || existente.local,
      estoque_minimo: item.estoqueMinimo ?? existente.estoque_minimo,
      consumo_diario: item.consumoDiario ?? existente.consumo_diario,
      origem: item.origem || existente.origem,
      tipo_uso: item.tipoUso || existente.tipo_uso || "continua",
      unidade: item.unidade || existente.unidade || "unidade",
      gotas_por_ml: item.gotasPorMl ?? existente.gotas_por_ml ?? null,
      lancado_em: item.lancadoEm || existente.lancado_em,
    } as Record<string, unknown>;
    if (item.pacientesUso && item.pacientesUso.length > 0) {
      patch.pacientes_uso = item.pacientesUso;
      patch.consumo_diario = item.pacientesUso.reduce(
        (a, p) => a + (p.seNecessario ? 0 : Number(p.qtdDia) || 0),
        0,
      );
    }
    const { data, error } = await supabase
      .from("estoque")
      .update(patch as never)
      .eq("id", existente.id)
      .select()
      .single();
    if (error) {
      console.error("[estoque] update:", error);
      return null;
    }
    await sincronizarPorMedicacao(uid, item.medicacao, {
      estoqueMinimo: item.estoqueMinimo ?? existente.estoque_minimo,
      tipoUso: item.tipoUso || (existente.tipo_uso as string) || "continua",
    });
    notify();
    return fromDb(data as DbRow);
  }
  const codigo = item.codigo || (await gerarCodigo());
  // Se já existe a mesma medicação em outro lote, herda o mínimo e o tipo de uso.
  const irmaos = await buscarPorMedicacao(uid, item.medicacao);
  if (irmaos.length > 0) {
    item.estoqueMinimo = irmaos[0].estoque_minimo;
    item.tipoUso = (irmaos[0].tipo_uso as EstoqueItem["tipoUso"]) || item.tipoUso || "continua";
    item.unidade = (irmaos[0].unidade as EstoqueItem["unidade"]) || item.unidade || "unidade";
    if (item.gotasPorMl == null && irmaos[0].gotas_por_ml != null) {
      item.gotasPorMl = Number(irmaos[0].gotas_por_ml);
    }
    // Residentes e consumo/dia são POR LOTE: cada lote registra quem consome
    // dele, então não herdamos dos lotes irmãos.
  }
  const { data, error } = await supabase
    .from("estoque")
    .insert({ ...toDb({ ...item, codigo }), user_id: uid })
    .select()
    .single();
  if (error) {
    console.error("[estoque] insert:", error);
    return null;
  }
  await sincronizarPorMedicacao(uid, item.medicacao, {
    estoqueMinimo: item.estoqueMinimo ?? 0,
    tipoUso: item.tipoUso || "continua",
  });
  notify();
  return fromDb(data as DbRow);
}

export async function adicionarVarios(
  novos: Array<Omit<EstoqueItem, "codigo"> & { codigo?: string }>,
): Promise<{ inseridos: number; atualizados: number }> {
  let inseridos = 0;
  let atualizados = 0;
  for (const n of novos) {
    const existente = await buscarPorMedLote(n.medicacao, n.lote);
    if (existente) {
      atualizados += 1;
    } else {
      inseridos += 1;
    }
    await adicionarItem(n);
  }
  return { inseridos, atualizados };
}

export async function removerItem(id: string) {
  const { error } = await supabase.from("estoque").delete().eq("id", id);
  if (error) {
    console.error("[estoque] delete:", error);
    return;
  }
  notify();
}

export async function atualizarItem(
  id: string,
  patch: Partial<EstoqueItem>,
): Promise<EstoqueRow | null> {
  const dbPatch: Record<string, unknown> = {};
  if (patch.medicacao !== undefined) dbPatch.medicacao = patch.medicacao;
  if (patch.apresentacao !== undefined) dbPatch.apresentacao = patch.apresentacao;
  if (patch.lote !== undefined) dbPatch.lote = patch.lote;
  if (patch.validade !== undefined) dbPatch.validade = patch.validade || null;
  if (patch.quantidade !== undefined) {
    dbPatch.quantidade = patch.quantidade;
    // Correção manual de quantidade zera o relógio: a contagem diária
    // recomeça a partir de hoje, senão o sistema descontaria duas vezes.
    if (patch.ultimaBaixa === undefined) {
      dbPatch.ultima_baixa = new Date().toISOString().slice(0, 10);
    }
  }
  if (patch.estoqueMinimo !== undefined) dbPatch.estoque_minimo = patch.estoqueMinimo;
  if (patch.origem !== undefined) dbPatch.origem = patch.origem;
  if (patch.local !== undefined) dbPatch.local = patch.local;
  if (patch.proximaCompra !== undefined) dbPatch.proxima_compra = patch.proximaCompra || null;
  if (patch.observacao !== undefined) dbPatch.observacao = patch.observacao || null;
  if (patch.tipoUso !== undefined) dbPatch.tipo_uso = patch.tipoUso;
  if (patch.unidade !== undefined) dbPatch.unidade = patch.unidade;
  if (patch.gotasPorMl !== undefined) dbPatch.gotas_por_ml = patch.gotasPorMl ?? null;
  if (patch.lancadoEm !== undefined) dbPatch.lancado_em = patch.lancadoEm || null;
  if (patch.ultimaBaixa !== undefined) dbPatch.ultima_baixa = patch.ultimaBaixa || null;
  if (patch.ultimaRetirada !== undefined) dbPatch.ultima_retirada = patch.ultimaRetirada || null;
  if (patch.proximaRetirada !== undefined) dbPatch.proxima_retirada = patch.proximaRetirada || null;
  if (patch.pacientesUso !== undefined) {
    dbPatch.pacientes_uso = patch.pacientesUso;
    // consumo derivado da soma dos pacientes
    if (patch.pacientesUso.length > 0) {
      dbPatch.consumo_diario = patch.pacientesUso.reduce(
        (acc, p) => acc + (p.seNecessario ? 0 : Number(p.qtdDia) || 0),
        0,
      );
    }
  } else if (patch.consumoDiario !== undefined) {
    dbPatch.consumo_diario = patch.consumoDiario;
  }
  const { data, error } = await supabase
    .from("estoque")
    .update(dbPatch as never)
    .eq("id", id)
    .select()
    .single();
  if (error) {
    console.error("[estoque] update:", error);
    return null;
  }
  // Estoque mínimo e tipo de uso são únicos por medicação: replica para todos os lotes.
  const uid = await userId();
  if (
    uid &&
    (patch.estoqueMinimo !== undefined ||
      patch.tipoUso !== undefined ||
      patch.ultimaRetirada !== undefined ||
      patch.proximaRetirada !== undefined)
  ) {
    const row = data as DbRow;
    await sincronizarPorMedicacao(uid, row.medicacao, {
      estoqueMinimo: patch.estoqueMinimo,
      tipoUso: patch.tipoUso,
      ultimaRetirada: patch.ultimaRetirada,
      proximaRetirada: patch.proximaRetirada,
    });
  }
  notify();
  return fromDb(data as DbRow);
}

export async function limparEstoque() {
  const uid = await userId();
  if (!uid) return;
  const { error } = await supabase.from("estoque").delete().eq("user_id", uid);
  if (error) {
    console.error("[estoque] limpar:", error);
    return;
  }
  notify();
}

async function buscarPorMedicacao(uid: string, medicacao: string) {
  const { data } = await supabase
    .from("estoque")
    .select("*")
    .eq("user_id", uid)
    .ilike("medicacao", medicacao);
  return (data as DbRow[] | null) ?? [];
}

/** Garante que todos os lotes da mesma medicação compartilham o mesmo estoque mínimo e tipo de uso. */
async function sincronizarPorMedicacao(
  uid: string,
  medicacao: string,
  {
    estoqueMinimo,
    tipoUso,
    ultimaRetirada,
    proximaRetirada,
  }: {
    estoqueMinimo?: number;
    tipoUso?: string;
    ultimaRetirada?: string;
    proximaRetirada?: string;
  },
) {
  const patch: Record<string, unknown> = {};
  if (estoqueMinimo !== undefined) patch.estoque_minimo = estoqueMinimo;
  if (tipoUso !== undefined) patch.tipo_uso = tipoUso;
  if (ultimaRetirada !== undefined) patch.ultima_retirada = ultimaRetirada || null;
  if (proximaRetirada !== undefined) patch.proxima_retirada = proximaRetirada || null;
  if (Object.keys(patch).length === 0) return;
  await supabase
    .from("estoque")
    .update(patch as never)
    .eq("user_id", uid)
    .ilike("medicacao", medicacao);
}

export function useEstoque() {
  const [itens, setItens] = useState<EstoqueRow[]>([]);
  const [carregando, setCarregando] = useState(true);
  useEffect(() => {
    let cancel = false;
    const recarregar = async () => {
      const lista = await listarEstoque();
      if (!cancel) {
        setItens(lista);
        setCarregando(false);
      }
    };
    recarregar();
    const h = () => recarregar();
    window.addEventListener(CHANNEL, h);
    return () => {
      cancel = true;
      window.removeEventListener(CHANNEL, h);
    };
  }, []);
  return { itens, carregando };
}