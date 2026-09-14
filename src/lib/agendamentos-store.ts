import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type TipoAgendamento = "Consulta" | "Exame";

export type StatusAgendamento =
  | "Aguardando vaga"
  | "Agendada"
  | "Realizada"
  | "Cancelada/Faltou";

export const STATUS_AGENDAMENTO: StatusAgendamento[] = [
  "Aguardando vaga",
  "Agendada",
  "Realizada",
  "Cancelada/Faltou",
];

export type Agendamento = {
  id: string;
  residenteId: string;
  tipo: TipoAgendamento;
  especialidade?: string;
  descricao: string;
  data: string;
  hora?: string;
  local?: string;
  medico?: string;
  motivo?: string;
  observacoes?: string;
  status: StatusAgendamento;
  realizado?: boolean;
  /** Data prevista para retirar o resultado do exame (ISO yyyy-mm-dd). */
  resultadoData?: string;
  /** Marcado quando o resultado já foi retirado. */
  resultadoRetirado?: boolean;
  /** Data em que o resultado foi retirado. */
  resultadoRetiradoEm?: string;
  /** Data em que a consulta/exame foi de fato realizado (ISO yyyy-mm-dd). */
  realizadoEm?: string;
  criadoEm: string;
};

const CHANNEL = "agendamentos:changed";
function notify() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CHANNEL));
}

type DbRow = {
  id: string;
  residente_id: string;
  tipo: string;
  especialidade: string | null;
  descricao: string;
  data: string;
  hora: string | null;
  local: string | null;
  medico: string | null;
  motivo: string | null;
  observacoes: string | null;
  status: string;
  realizado: boolean;
  resultado_data: string | null;
  resultado_retirado: boolean | null;
  resultado_retirado_em: string | null;
  realizado_em: string | null;
  created_at: string;
};

function fromDb(r: DbRow): Agendamento {
  return {
    id: r.id,
    residenteId: r.residente_id,
    tipo: (r.tipo as TipoAgendamento) || "Consulta",
    especialidade: r.especialidade || undefined,
    descricao: r.descricao,
    data: r.data,
    hora: r.hora || undefined,
    local: r.local || undefined,
    medico: r.medico || undefined,
    motivo: r.motivo || undefined,
    observacoes: r.observacoes || undefined,
    status: (r.status as StatusAgendamento) || "Agendada",
    realizado: !!r.realizado,
    resultadoData: r.resultado_data || undefined,
    resultadoRetirado: !!r.resultado_retirado,
    resultadoRetiradoEm: r.resultado_retirado_em || undefined,
    realizadoEm: r.realizado_em || undefined,
    criadoEm: r.created_at,
  };
}

async function userId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function listarAgendamentos(): Promise<Agendamento[]> {
  const { data, error } = await supabase
    .from("agendamentos")
    .select("*")
    .order("data");
  if (error) {
    console.error("[agendamentos] listar:", error);
    return [];
  }
  return (data as DbRow[]).map(fromDb);
}

export async function adicionarAgendamento(
  item: Omit<Agendamento, "id" | "criadoEm">,
): Promise<Agendamento | null> {
  const uid = await userId();
  if (!uid) {
    throw new Error("Sessão expirada. Faça login novamente.");
  }
  const { data, error } = await supabase
    .from("agendamentos")
    .insert({
      user_id: uid,
      residente_id: item.residenteId,
      tipo: item.tipo,
      especialidade: item.especialidade || null,
      descricao: item.descricao,
      data: item.data,
      hora: item.hora || null,
      local: item.local || null,
      medico: item.medico || null,
      motivo: item.motivo || null,
      observacoes: item.observacoes || null,
      status: item.status || "Agendada",
      realizado: !!item.realizado,
    })
    .select()
    .single();
  if (error) {
    console.error("[agendamentos] insert:", error);
    throw new Error(error.message);
  }
  notify();
  return fromDb(data as DbRow);
}

export async function removerAgendamento(id: string) {
  const { error } = await supabase.from("agendamentos").delete().eq("id", id);
  if (error) {
    console.error("[agendamentos] delete:", error);
    return;
  }
  notify();
}

export async function marcarRealizado(id: string, realizado: boolean) {
  const { error } = await supabase
    .from("agendamentos")
    .update({ realizado, status: realizado ? "Realizada" : "Agendada" })
    .eq("id", id);
  if (error) {
    console.error("[agendamentos] update:", error);
    return;
  }
  notify();
}

export async function atualizarAgendamento(
  id: string,
  patch: Partial<Omit<Agendamento, "id" | "criadoEm" | "residenteId">>,
) {
  const row: Database["public"]["Tables"]["agendamentos"]["Update"] = {};
  if (patch.tipo !== undefined) row.tipo = patch.tipo;
  if (patch.especialidade !== undefined) row.especialidade = patch.especialidade || null;
  if (patch.descricao !== undefined) row.descricao = patch.descricao;
  if (patch.data !== undefined) row.data = patch.data;
  if (patch.hora !== undefined) row.hora = patch.hora || null;
  if (patch.local !== undefined) row.local = patch.local || null;
  if (patch.medico !== undefined) row.medico = patch.medico || null;
  if (patch.motivo !== undefined) row.motivo = patch.motivo || null;
  if (patch.observacoes !== undefined) row.observacoes = patch.observacoes || null;
  if (patch.status !== undefined) {
    row.status = patch.status;
    row.realizado = patch.status === "Realizada";
  }
  if (patch.realizado !== undefined) row.realizado = patch.realizado;
  if (patch.resultadoData !== undefined)
    (row as any).resultado_data = patch.resultadoData || null;
  if (patch.resultadoRetirado !== undefined)
    (row as any).resultado_retirado = !!patch.resultadoRetirado;
  if (patch.resultadoRetiradoEm !== undefined)
    (row as any).resultado_retirado_em = patch.resultadoRetiradoEm || null;
  if (patch.realizadoEm !== undefined)
    (row as any).realizado_em = patch.realizadoEm || null;
  const { error } = await supabase.from("agendamentos").update(row).eq("id", id);
  if (error) {
    console.error("[agendamentos] update:", error);
    return;
  }
  notify();
}

export function useAgendamentos() {
  const [itens, setItens] = useState<Agendamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  useEffect(() => {
    let cancel = false;
    const recarregar = async () => {
      const lista = await listarAgendamentos();
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