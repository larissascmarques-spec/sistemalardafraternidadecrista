import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Desfecho = "resolvido_local" | "encaminhado" | "acompanhamento";

export type Procedimento = {
  id: string;
  data: string;
  hora?: string;
  residenteId?: string;
  categoria: string;
  descricao?: string;
  desfecho: Desfecho;
  destino?: string;
  profissional?: string;
  observacoes?: string;
  valores: Record<string, string>;
};

export const CATEGORIAS_PROC = [
  "Consulta de enfermagem",
  "Aferição de sinais vitais",
  "Registro de evacuação",
  "Curativo / tratamento de ferida",
  "Administração de injetável",
  "Coleta de material (urina/sangue)",
  "Administração de medicamento",
  "Consulta médica na UBS",
  "Consulta com especialista",
  "Exame realizado",
  "Vacinação",
  "Intercorrência / urgência",
  "Queda",
  "Lesão por pressão",
  "Erro / quase-erro de medicação",
  "Infecção (urinária / respiratória / ferida)",
  "Internação hospitalar",
  "Educação em saúde / orientação",
  "Plano de Atenção Individual (PAI) atualizado",
  "Avaliação de risco de lesão por pressão (Braden)",
  "Visita domiciliar / SAD",
  "Óbito",
  "Outro",
] as const;

export const DESTINOS_PROC = [
  "UBS",
  "Policlínica / especialista",
  "UPA / pronto-socorro",
  "Hospital",
  "CAPS",
  "SAD",
  "Laboratório",
  "Outro",
] as const;

export const DESFECHOS: Array<{ value: Desfecho; label: string }> = [
  { value: "resolvido_local", label: "Resolvido no Lar" },
  { value: "encaminhado", label: "Encaminhado para fora" },
  { value: "acompanhamento", label: "Em acompanhamento" },
];

export function rotuloDesfecho(d: string): string {
  return DESFECHOS.find((x) => x.value === d)?.label ?? d;
}

const CHANNEL = "procedimentos:changed";
function notify() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CHANNEL));
}

type DbRow = {
  id: string;
  data: string;
  hora: string | null;
  residente_id: string | null;
  categoria: string;
  descricao: string | null;
  desfecho: string;
  destino: string | null;
  profissional: string | null;
  observacoes: string | null;
  valores: Record<string, string> | null;
};

function fromDb(r: DbRow): Procedimento {
  return {
    id: r.id,
    data: r.data,
    hora: r.hora || undefined,
    residenteId: r.residente_id || undefined,
    categoria: r.categoria,
    descricao: r.descricao || undefined,
    desfecho: (r.desfecho as Desfecho) || "resolvido_local",
    destino: r.destino || undefined,
    profissional: r.profissional || undefined,
    observacoes: r.observacoes || undefined,
    valores: r.valores || {},
  };
}

export async function listarProcedimentos(): Promise<Procedimento[]> {
  const { data, error } = await supabase
    .from("procedimentos")
    .select("*")
    .order("data", { ascending: false });
  if (error) {
    console.error("[procedimentos] listar:", error);
    return [];
  }
  return (data as unknown as DbRow[]).map(fromDb);
}

export async function adicionarProcedimento(
  p: Omit<Procedimento, "id">,
): Promise<boolean> {
  const { data: u } = await supabase.auth.getUser();
  const uid = u.user?.id;
  if (!uid) return false;
  const { error } = await supabase.from("procedimentos").insert({
    user_id: uid,
    data: p.data,
    hora: p.hora || null,
    residente_id: p.residenteId || null,
    categoria: p.categoria,
    descricao: p.descricao || null,
    desfecho: p.desfecho,
    destino: p.destino || null,
    profissional: p.profissional || null,
    observacoes: p.observacoes || null,
    valores: p.valores || {},
  });
  if (error) {
    console.error("[procedimentos] insert:", error);
    return false;
  }
  notify();
  return true;
}

export async function removerProcedimento(id: string): Promise<void> {
  const { error } = await supabase.from("procedimentos").delete().eq("id", id);
  if (error) {
    console.error("[procedimentos] delete:", error);
    return;
  }
  notify();
}

export function useProcedimentos() {
  const [itens, setItens] = useState<Procedimento[]>([]);
  const [carregando, setCarregando] = useState(true);

  const recarregar = useCallback(async () => {
    const lista = await listarProcedimentos();
    setItens(lista);
    setCarregando(false);
  }, []);

  useEffect(() => {
    recarregar();
    const h = () => recarregar();
    window.addEventListener(CHANNEL, h);
    return () => window.removeEventListener(CHANNEL, h);
  }, [recarregar]);

  return { itens, carregando, recarregar };
}

/** "2026-08" a partir de uma data ISO. */
export function competencia(dataIso: string): string {
  return dataIso.slice(0, 7);
}

export function rotuloCompetencia(comp: string): string {
  const [ano, mes] = comp.split("-");
  const nomes = [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
  ];
  return `${nomes[Number(mes) - 1] ?? mes}/${ano}`;
}