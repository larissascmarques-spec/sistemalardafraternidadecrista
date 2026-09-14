import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  RECEITAS_ARQUIVO_KEY,
  RECEITAS_STORAGE_KEY,
  gravarReceitasSeguro,
  type ReceitaSalva,
} from "./receitas-store";

/** Guarda das receitas na nuvem (banco), com o navegador servindo apenas de
 *  cópia local rápida. Assim as receitas aparecem em qualquer endereço,
 *  navegador ou computador em que a usuária fizer login. */

const CHANNEL = "farmalar:receitas-changed";

function nomeLista(key: string): "ativa" | "arquivo" {
  return key === RECEITAS_ARQUIVO_KEY ? "arquivo" : "ativa";
}

export function lerReceitasLS(key: string): ReceitaSalva[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as ReceitaSalva[]) : [];
  } catch {
    return [];
  }
}

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

async function fetchRemote(key: string): Promise<ReceitaSalva[] | null> {
  const uid = await currentUserId();
  if (!uid) return null;
  const { data, error } = await supabase
    .from("receitas")
    .select("dados")
    .eq("user_id", uid)
    .eq("lista", nomeLista(key))
    .order("created_at", { ascending: true });
  if (error) {
    console.error("[receitas] fetch:", error);
    return null;
  }
  return (data as { dados: unknown }[])
    .map((row) => row.dados as ReceitaSalva)
    .filter((r) => r && typeof r === "object" && !!r.id);
}

async function pushCompleto(key: string, itens: ReceitaSalva[]): Promise<boolean> {
  const uid = await currentUserId();
  if (!uid) return false;
  const lista = nomeLista(key);
  const { data: existentes, error: fetchErr } = await supabase
    .from("receitas")
    .select("id,codigo")
    .eq("user_id", uid)
    .eq("lista", lista);
  if (fetchErr) {
    console.error("[receitas] sync fetch:", fetchErr);
    return false;
  }
  const idsPorCodigo = new Map(
    ((existentes ?? []) as Array<{ id: string; codigo: string | null }>).map((r) => [r.codigo ?? "", r.id]),
  );
  const rows = itens.map((r) => ({
    user_id: uid,
    lista,
    codigo: r.id,
    residente_id: r.residenteId ?? "",
    medicacao: r.medicacao ?? "",
    dosagem: r.dosagem ?? null,
    tipo: r.tipo ?? null,
    data_emissao: r.dataEmissao || null,
    validade_dias: r.validadeDias ?? 30,
    vencimento: r.vencimento || null,
    medico: r.medico ?? null,
    origem: r.origem ?? null,
    arquivada_em: r.arquivadaEm ?? null,
    dados: r as unknown,
  }));

  // Primeiro confirma cada gravação. Só depois remove registros que realmente
  // saíram da lista; assim uma falha de rede nunca apaga todas as receitas.
  for (const row of rows) {
    const id = idsPorCodigo.get(row.codigo);
    const enviar = async (r: typeof row) => {
      const query = id
        ? supabase.from("receitas").update(r as never).eq("id", id)
        : supabase.from("receitas").insert(r as never);
      return (await query).error;
    };
    let error = await enviar(row);
    if (error) {
      // O PDF em base64 pode deixar o envio grande demais e falhar. Nesse
      // caso reenvia sem o PDF: os dados da receita são o que importa —
      // o PDF continua guardado no navegador.
      const dados = row.dados as { arquivoUrl?: string; arquivo?: string };
      if (dados && (dados.arquivoUrl || dados.arquivo)) {
        const semPdf = {
          ...row,
          dados: { ...dados, arquivoUrl: undefined, arquivo: undefined },
        };
        error = await enviar(semPdf);
      }
    }
    if (error) {
      console.error("[receitas] safe sync:", error);
      return false;
    }
  }

  const codigosAtuais = new Set(rows.map((r) => r.codigo));
  const obsoletos = ((existentes ?? []) as Array<{ id: string; codigo: string | null }>)
    .filter((r) => !codigosAtuais.has(r.codigo ?? ""))
    .map((r) => r.id);
  if (obsoletos.length > 0) {
    const { error } = await supabase.from("receitas").delete().in("id", obsoletos);
    if (error) {
      console.error("[receitas] cleanup:", error);
      return false;
    }
  }
  return true;
}

const sincronizando = new Set<string>();
const pendente = new Map<string, ReceitaSalva[]>();

async function sincronizar(key: string, itens: ReceitaSalva[]) {
  pendente.set(key, itens);
  if (sincronizando.has(key)) return;
  sincronizando.add(key);
  try {
    let atual = pendente.get(key);
    while (atual) {
      pendente.delete(key);
      await pushCompleto(key, atual);
      atual = pendente.get(key);
    }
  } finally {
    sincronizando.delete(key);
  }
}

/** Carrega do banco; se o banco estiver vazio e o navegador tiver receitas,
 *  envia as do navegador (primeira vez). */
async function carregar(key: string): Promise<ReceitaSalva[] | null> {
  const remoto = await fetchRemote(key);
  if (remoto === null) return null;
  const local = lerReceitasLS(key);
  if (remoto.length === 0 && local.length > 0) {
    const ok = await pushCompleto(key, local);
    return ok ? local : local;
  }
  gravarReceitasSeguro(key, remoto);
  return remoto;
}

export function useReceitas(key: string, _inicial?: ReceitaSalva[]) {
  const [valor, setValorState] = useState<ReceitaSalva[]>([]);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<ReceitaSalva[]>(valor);
  ref.current = valor;

  useEffect(() => {
    let cancel = false;
    setLoaded(false);
    const local = lerReceitasLS(key);
    if (local.length > 0) setValorState(local);
    (async () => {
      const lista = await carregar(key);
      if (cancel) return;
      if (lista !== null) setValorState(lista);
      setLoaded(true);
    })();

    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ key: string }>).detail;
      if (detail?.key && detail.key !== key) return;
      setValorState(lerReceitasLS(key));
    };
    if (typeof window !== "undefined") window.addEventListener(CHANNEL, handler);
    return () => {
      cancel = true;
      if (typeof window !== "undefined") window.removeEventListener(CHANNEL, handler);
    };
  }, [key]);

  const setValor = useCallback(
    (novo: ReceitaSalva[] | ((prev: ReceitaSalva[]) => ReceitaSalva[])) => {
      const proximo =
        typeof novo === "function"
          ? (novo as (p: ReceitaSalva[]) => ReceitaSalva[])(ref.current)
          : novo;
      setValorState(proximo);
      gravarReceitasSeguro(key, proximo);
      void sincronizar(key, proximo);
    },
    [key],
  );

  return [valor, setValor, loaded] as const;
}

/** Usado por processos fora dos componentes (fila de importação de PDFs):
 *  grava no navegador, avisa as telas abertas e espelha no banco. */
export function salvarReceitasExterno(key: string, itens: ReceitaSalva[]) {
  const res = gravarReceitasSeguro(key, itens);
  const lista = res.lista;
  void sincronizar(key, lista);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(CHANNEL, { detail: { key } }));
  }
  return res;
}

export { RECEITAS_STORAGE_KEY, RECEITAS_ARQUIVO_KEY };
