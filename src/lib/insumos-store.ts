import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type InsumoItem = {
  id: string;
  codigo: string;
  nome: string;
  categoria: string;
  apresentacao: string;
  lote: string;
  validade: string;
  quantidade: number;
  estoqueMinimo: number;
  consumoDiario: number;
  origem: string;
  local: string;
};

const CHANNEL = "insumos:changed";
function notify() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CHANNEL));
}

type DbRow = {
  id: string;
  codigo: string | null;
  nome: string;
  categoria: string | null;
  apresentacao: string | null;
  lote: string | null;
  validade: string | null;
  quantidade: number;
  estoque_minimo: number;
  consumo_diario: number;
  origem: string | null;
  local: string | null;
};

function fromDb(r: DbRow): InsumoItem {
  return {
    id: r.id,
    codigo: r.codigo || r.id.slice(0, 6),
    nome: r.nome,
    categoria: r.categoria || "Outros",
    apresentacao: r.apresentacao || "",
    lote: r.lote || "",
    validade: r.validade || "",
    quantidade: Number(r.quantidade) || 0,
    estoqueMinimo: Number(r.estoque_minimo) || 0,
    consumoDiario: Number(r.consumo_diario) || 0,
    origem: r.origem || "",
    local: r.local || "",
  };
}

async function userId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function listarInsumos(): Promise<InsumoItem[]> {
  const { data, error } = await supabase.from("insumos").select("*").order("nome");
  if (error) {
    console.error("[insumos] listar:", error);
    return [];
  }
  return (data as DbRow[]).map(fromDb);
}

async function gerarCodigoInsumo(): Promise<string> {
  const { count } = await supabase
    .from("insumos")
    .select("*", { count: "exact", head: true });
  const n = (count || 0) + 1;
  return `I${String(n).padStart(3, "0")}`;
}

async function buscarPorNomeLote(nome: string, lote: string) {
  const { data } = await supabase
    .from("insumos")
    .select("*")
    .ilike("nome", nome)
    .ilike("lote", lote || "")
    .maybeSingle();
  return data as DbRow | null;
}

export async function adicionarInsumo(
  item: Omit<InsumoItem, "id" | "codigo"> & { codigo?: string },
): Promise<InsumoItem | null> {
  const uid = await userId();
  if (!uid) return null;
  const existente = await buscarPorNomeLote(item.nome, item.lote);
  if (existente) {
    const patch = {
      quantidade: existente.quantidade + (item.quantidade || 0),
      validade: item.validade || existente.validade,
      local: item.local || existente.local,
      estoque_minimo: item.estoqueMinimo ?? existente.estoque_minimo,
      consumo_diario: item.consumoDiario ?? existente.consumo_diario,
      origem: item.origem || existente.origem,
      categoria: item.categoria || existente.categoria,
      apresentacao: item.apresentacao || existente.apresentacao,
    };
    const { data, error } = await supabase
      .from("insumos")
      .update(patch)
      .eq("id", existente.id)
      .select()
      .single();
    if (error) {
      console.error("[insumos] update:", error);
      return null;
    }
    notify();
    return fromDb(data as DbRow);
  }
  const codigo = item.codigo || (await gerarCodigoInsumo());
  const { data, error } = await supabase
    .from("insumos")
    .insert({
      user_id: uid,
      codigo,
      nome: item.nome,
      categoria: item.categoria || null,
      apresentacao: item.apresentacao || null,
      lote: item.lote || null,
      validade: item.validade || null,
      quantidade: item.quantidade || 0,
      estoque_minimo: item.estoqueMinimo || 0,
      consumo_diario: item.consumoDiario || 0,
      origem: item.origem || null,
      local: item.local || null,
    })
    .select()
    .single();
  if (error) {
    console.error("[insumos] insert:", error);
    return null;
  }
  notify();
  return fromDb(data as DbRow);
}

export async function adicionarVariosInsumos(
  novos: Array<Omit<InsumoItem, "id" | "codigo">>,
): Promise<{ inseridos: number; atualizados: number }> {
  let inseridos = 0;
  let atualizados = 0;
  for (const n of novos) {
    const existente = await buscarPorNomeLote(n.nome, n.lote);
    if (existente) atualizados += 1;
    else inseridos += 1;
    await adicionarInsumo(n);
  }
  return { inseridos, atualizados };
}

export async function removerInsumo(id: string) {
  const { error } = await supabase.from("insumos").delete().eq("id", id);
  if (error) {
    console.error("[insumos] delete:", error);
    return;
  }
  notify();
}

export function diasRestantesInsumo(item: InsumoItem): number {
  if (item.consumoDiario <= 0) return 999;
  return Math.floor(item.quantidade / item.consumoDiario);
}

export function useInsumos() {
  const [itens, setItens] = useState<InsumoItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  useEffect(() => {
    let cancel = false;
    const recarregar = async () => {
      const lista = await listarInsumos();
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

export const CATEGORIAS_INSUMOS = [
  "Fralda",
  "Luva",
  "Gaze",
  "Seringa",
  "Dieta",
  "Álcool/Antisséptico",
  "Curativo",
  "Higiene",
  "Outros",
];