import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { residentes as residentesMock, type Residente } from "./mock-data";
import { formatNome } from "./format-nome";

export type ResidenteSalvo = Residente & {
  aRevisar?: boolean;
  criadoEm: string;
};

export const RESIDENTES_STORAGE_KEY = "farmalar.residentes.v1";
const MIGRACAO_FEITA_KEY = "farmalar.residentes.migracao-supabase.v1";
const CHANNEL = "residentes:changed";
function notify() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CHANNEL));
}

function normalizaNome(n: string): string {
  return n
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function novoIdResidente(existentes: ResidenteSalvo[]): string {
  const n = existentes.length + 1;
  return `RU${String(n).padStart(3, "0")}`;
}

export function buscarResidentePorNome(
  nome: string,
  lista: ResidenteSalvo[],
): ResidenteSalvo | undefined {
  const alvo = normalizaNome(nome);
  if (!alvo) return undefined;
  // match exato primeiro, depois "começa com" (primeiro nome igual)
  return (
    lista.find((r) => normalizaNome(r.nome) === alvo) ||
    lista.find((r) => {
      const a = normalizaNome(r.nome).split(" ")[0];
      const b = alvo.split(" ")[0];
      return a && b && a === b;
    })
  );
}

export function criarResidenteRascunho(
  nome: string,
  medico: string | null | undefined,
  existentes: ResidenteSalvo[],
): ResidenteSalvo {
  return {
    id: novoIdResidente(existentes),
    nome: nome.trim(),
    dataNascimento: "",
    diagnosticos: [],
    alergias: [],
    responsavel: "",
    medico: medico?.trim() || "",
    ubs: "",
    aRevisar: true,
    criadoEm: new Date().toISOString(),
  };
}

// ---------- LocalStorage helpers ----------
function lerLS(): ResidenteSalvo[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RESIDENTES_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ResidenteSalvo[]) : [];
  } catch {
    return [];
  }
}
function gravarLS(lista: ResidenteSalvo[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RESIDENTES_STORAGE_KEY, JSON.stringify(lista));
  } catch {
    /* quota */
  }
}

// ---------- DB <-> App conversions ----------
type DbRow = {
  id: string;
  codigo: string | null;
  nome: string;
  data_nascimento: string | null;
  diagnosticos: string[] | null;
  alergias: string[] | null;
  responsavel: string | null;
  medico: string | null;
  ubs: string | null;
  observacoes: string | null;
  a_revisar: boolean;
  dependencia: string | null;
  mobilidade: string | null;
  dieta: string | null;
  alertas: string[] | null;
  haldol_injetavel: unknown;
  extras: unknown;
  created_at: string;
};

function fromDb(r: DbRow): ResidenteSalvo {
  const extras = (r.extras && typeof r.extras === "object" ? (r.extras as Record<string, unknown>) : {}) as {
    cpf?: string;
    sanitas?: string;
    dataInstitucionalizacao?: string;
    medicacoesUso?: string[];
    esquemaMedicacoes?: ResidenteSalvo["esquemaMedicacoes"];
    acompanhamentoPsiquiatrico?: ResidenteSalvo["acompanhamentoPsiquiatrico"];
  };
  return {
    id: r.codigo || r.id.slice(0, 6),
    nome: r.nome,
    dataNascimento: r.data_nascimento || "",
    dataInstitucionalizacao: extras.dataInstitucionalizacao,
    cpf: extras.cpf,
    sanitas: extras.sanitas,
    diagnosticos: Array.isArray(r.diagnosticos) ? r.diagnosticos : [],
    alergias: Array.isArray(r.alergias) ? r.alergias : [],
    responsavel: r.responsavel || "",
    medico: r.medico || "",
    ubs: r.ubs || "",
    observacoes: r.observacoes || undefined,
    medicacoesUso: Array.isArray(extras.medicacoesUso) ? extras.medicacoesUso : undefined,
    esquemaMedicacoes: Array.isArray(extras.esquemaMedicacoes)
      ? extras.esquemaMedicacoes
      : undefined,
    dependencia: (r.dependencia as ResidenteSalvo["dependencia"]) || undefined,
    mobilidade: (r.mobilidade as ResidenteSalvo["mobilidade"]) || undefined,
    dieta: r.dieta || undefined,
    alertas: Array.isArray(r.alertas) ? r.alertas : undefined,
    haldolInjetavel:
      r.haldol_injetavel && typeof r.haldol_injetavel === "object"
        ? (r.haldol_injetavel as ResidenteSalvo["haldolInjetavel"])
        : undefined,
    acompanhamentoPsiquiatrico: extras.acompanhamentoPsiquiatrico,
    aRevisar: !!r.a_revisar,
    criadoEm: r.created_at,
  };
}

function toDbRow(r: ResidenteSalvo, uid: string) {
  const extras: Record<string, unknown> = {};
  if (r.cpf) extras.cpf = r.cpf;
  if (r.sanitas) extras.sanitas = r.sanitas;
  if (r.dataInstitucionalizacao) extras.dataInstitucionalizacao = r.dataInstitucionalizacao;
  if (r.medicacoesUso && r.medicacoesUso.length > 0) extras.medicacoesUso = r.medicacoesUso;
  if (r.esquemaMedicacoes && r.esquemaMedicacoes.length > 0) {
    extras.esquemaMedicacoes = r.esquemaMedicacoes;
  }
  if (r.acompanhamentoPsiquiatrico) extras.acompanhamentoPsiquiatrico = r.acompanhamentoPsiquiatrico;
  return {
    user_id: uid,
    codigo: r.id,
    nome: r.nome,
    data_nascimento: r.dataNascimento || null,
    diagnosticos: r.diagnosticos ?? [],
    alergias: r.alergias ?? [],
    responsavel: r.responsavel || null,
    medico: r.medico || null,
    ubs: r.ubs || null,
    observacoes: r.observacoes || null,
    a_revisar: !!r.aRevisar,
    dependencia: r.dependencia || null,
    mobilidade: r.mobilidade || null,
    dieta: r.dieta || null,
    alertas: r.alertas ?? [],
    haldol_injetavel: r.haldolInjetavel ?? null,
    extras,
  };
}

// ---------- Supabase I/O ----------
async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

async function fetchRemote(): Promise<ResidenteSalvo[] | null> {
  const uid = await currentUserId();
  if (!uid) return null;
  const { data, error } = await supabase
    .from("residentes")
    .select("*")
    .eq("user_id", uid)
    .order("created_at", { ascending: true });
  if (error) {
    console.error("[residentes] fetch:", error);
    return null;
  }
  return (data as DbRow[]).map(fromDb);
}

async function pushCompleto(lista: ResidenteSalvo[]): Promise<void> {
  const uid = await currentUserId();
  if (!uid) return;
  // Estratégia simples e segura para volumes pequenos (~50 residentes):
  // apaga tudo do usuário e reinsere a lista atual em bloco.
  await supabase.from("residentes").delete().eq("user_id", uid);
  if (lista.length === 0) return;
  const rows = lista.map((r) => toDbRow(r, uid));
  const { error } = await supabase.from("residentes").insert(rows as never);
  if (error) console.error("[residentes] push:", error);
}

let sincronizando = false;
async function sincronizarComSupabase(lista: ResidenteSalvo[]) {
  if (sincronizando) return;
  sincronizando = true;
  try {
    await pushCompleto(lista);
  } finally {
    sincronizando = false;
  }
}

/** Migração de segurança: se o navegador tem dados e o Supabase está vazio, envia. */
async function migrarSeNecessario(): Promise<ResidenteSalvo[] | null> {
  if (typeof window === "undefined") return null;
  const uid = await currentUserId();
  if (!uid) return null;
  const jaFeita = window.localStorage.getItem(MIGRACAO_FEITA_KEY);
  const local = lerLS();
  const remoto = await fetchRemote();
  if (remoto === null) return null;
  // Caso 1: banco vazio + local com dados → subir tudo
  if (remoto.length === 0 && local.length > 0) {
    await pushCompleto(local);
    window.localStorage.setItem(MIGRACAO_FEITA_KEY, new Date().toISOString());
    return local;
  }
  // Caso 2: banco tem dados → usa banco e atualiza LS
  if (remoto.length > 0) {
    gravarLS(remoto);
    if (!jaFeita) window.localStorage.setItem(MIGRACAO_FEITA_KEY, new Date().toISOString());
    return remoto;
  }
  return local;
}

export function useAllResidentes() {
  const [salvos, setSalvosState] = useState<ResidenteSalvo[]>(() => lerLS());
  const [loaded, setLoaded] = useState(false);
  const salvosRef = useRef(salvos);
  salvosRef.current = salvos;

  // Carrega do Supabase (ou migra do LS) na montagem
  useEffect(() => {
    let cancel = false;
    (async () => {
      const lista = await migrarSeNecessario();
      if (cancel) return;
      if (lista !== null) setSalvosState(lista);
      setLoaded(true);
    })();
    const handler = () => {
      const l = lerLS();
      setSalvosState(l);
    };
    if (typeof window !== "undefined") window.addEventListener(CHANNEL, handler);
    return () => {
      cancel = true;
      if (typeof window !== "undefined") window.removeEventListener(CHANNEL, handler);
    };
  }, []);

  const setSalvos = useCallback(
    (novo: ResidenteSalvo[] | ((prev: ResidenteSalvo[]) => ResidenteSalvo[])) => {
      const proximo =
        typeof novo === "function"
          ? (novo as (p: ResidenteSalvo[]) => ResidenteSalvo[])(salvosRef.current)
          : novo;
      setSalvosState(proximo);
      gravarLS(proximo);
      notify();
      // Espelha no banco em segundo plano
      void sincronizarComSupabase(proximo);
    },
    [],
  );

  const todos: (Residente | ResidenteSalvo)[] = [...salvos, ...residentesMock];
  const nomePor = (id: string) =>
    formatNome(todos.find((r) => r.id === id)?.nome ?? "") || id;
  return { salvos, setSalvos, todos, nomePor, loaded };
}