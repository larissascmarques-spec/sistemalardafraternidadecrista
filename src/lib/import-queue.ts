import { salvarReceitasExterno } from "./receitas-cloud";
import { lerPdfComGemini } from "@/lib/gemini-pdf.functions";
import {
  RECEITAS_STORAGE_KEY,
  RECEITAS_ARQUIVO_KEY,
  type ReceitaSalva,
} from "@/lib/receitas-store";
import {
  RESIDENTES_STORAGE_KEY,
  type ResidenteSalvo,
} from "@/lib/residentes-store";
import {
  extractPdfText,
  extractPdfTextOCR,
  guessReceitaFromText,
} from "@/lib/pdf-extract";
import { salvarReceitaLida } from "@/lib/salvar-receita";

export type LinhaImport = {
  id: string;
  arquivo: string;
  status: "fila" | "lendo" | "aguardando" | "ok" | "erro" | "pausado";
  mensagem?: string;
  residenteNome?: string;
  medicacao?: string;
  arquivouAntiga?: boolean;
  residenteCriado?: boolean;
};

export type EstadoFila = {
  linhas: LinhaImport[];
  total: number;
  feito: number;
  processando: boolean;
  salvos: number;
  erros: number;
  pausas: number;
};

type Ouvinte = (e: EstadoFila) => void;

const estado: EstadoFila = {
  linhas: [],
  total: 0,
  feito: 0,
  processando: false,
  salvos: 0,
  erros: 0,
  pausas: 0,
};

const ouvintes = new Set<Ouvinte>();

const HIST_KEY = "farmalar.import.historico.v1";

function carregarHistorico() {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(HIST_KEY);
    if (!raw) return;
    const dados = JSON.parse(raw) as { linhas: LinhaImport[]; salvos: number; erros: number; pausas: number };
    // qualquer linha que ficou "lendo/aguardando/pausado/fila" no recarregamento
    // é marcada como interrompida, pra não enganar o usuário
    const linhas = (dados.linhas ?? []).map((l) =>
      l.status === "ok" || l.status === "erro"
        ? l
        : { ...l, status: "erro" as const, mensagem: "Importação interrompida (página recarregada)." },
    );
    estado.linhas = linhas;
    estado.total = linhas.length;
    estado.feito = linhas.length;
    estado.salvos = dados.salvos ?? linhas.filter((l) => l.status === "ok").length;
    estado.erros = dados.erros ?? linhas.filter((l) => l.status === "erro").length;
    estado.pausas = dados.pausas ?? 0;
  } catch {
    // ignora
  }
}

function salvarHistorico() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      HIST_KEY,
      JSON.stringify({
        linhas: estado.linhas,
        salvos: estado.salvos,
        erros: estado.erros,
        pausas: estado.pausas,
      }),
    );
  } catch {
    // ignora quota
  }
}

carregarHistorico();

function avisar() {
  for (const o of ouvintes) o({ ...estado, linhas: [...estado.linhas] });
  salvarHistorico();
}

export function inscreverFila(o: Ouvinte): () => void {
  ouvintes.add(o);
  o({ ...estado, linhas: [...estado.linhas] });
  return () => ouvintes.delete(o);
}

export function estadoAtualFila(): EstadoFila {
  return { ...estado, linhas: [...estado.linhas] };
}

export function limparHistoricoFila() {
  if (estado.processando) return;
  estado.linhas = [];
  estado.total = 0;
  estado.feito = 0;
  estado.salvos = 0;
  estado.erros = 0;
  estado.pausas = 0;
  avisar();
}

function lerLS<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function gravarLS<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignora quota
  }
}

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fileParaBase64(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  let bin = "";
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

/** Tenta gravar o PDF como data URL para "Visualizar PDF" depois.
 *  Se passar de ~1.5MB, devolve undefined (para não estourar o localStorage). */
function montarDataUrlSeCouber(base64: string): string | undefined {
  if (!base64) return undefined;
  if (base64.length > 1_500_000) return undefined; // ~1.5MB
  return `data:application/pdf;base64,${base64}`;
}

function atualizarLinha(id: string, patch: Partial<LinhaImport>) {
  const i = estado.linhas.findIndex((l) => l.id === id);
  if (i === -1) return;
  estado.linhas[i] = { ...estado.linhas[i], ...patch };
  avisar();
}

type Resultado =
  | { ok: true; dados: Record<string, string | number | null | undefined>; arquivo: string }
  | { ok: false; error: string; retryable?: boolean; quotaExceeded?: boolean; cooldownMs?: number };

async function lerComTentativas(
  conteudoBase64: string,
  mimeType: "application/pdf" | "image/jpeg" | "image/png",
  fileName: string,
  onAguardando: (m: string) => void,
): Promise<Resultado> {
  const pausas = [0, 45000, 120000];
  let ultimoErro = "";
  for (let t = 0; t < pausas.length; t++) {
    if (pausas[t] > 0) {
      onAguardando(`Leitor ocupado. Vou pausar e tentar de novo (${t + 1}/${pausas.length})…`);
      await esperar(pausas[t]);
    }
    try {
      const r = (await lerPdfComGemini({
        data:
          mimeType === "application/pdf"
            ? { pdfBase64: conteudoBase64, mimeType, fileName }
            : { imageBase64: conteudoBase64, mimeType, fileName },
      })) as Resultado;
      if (!r.ok && r.quotaExceeded) return r;
      if (r.ok || !r.retryable) return r;
      ultimoErro = r.error;
    } catch (e) {
      ultimoErro = (e as Error).message || "O leitor demorou demais para responder.";
      onAguardando("O leitor demorou demais. Vou aguardar antes de tentar novamente…");
    }
  }
  return { ok: false, retryable: true, error: ultimoErro || "Não foi possível ler este PDF agora." };
}

async function lerLocalSemLimite(file: File, onAguardando: (m: string) => void): Promise<Resultado> {
  try {
    onAguardando("Leitor online no limite. Vou tentar um leitor local sem limite…");
    let texto = await extractPdfText(file);
    if (texto.trim().length < 40) {
      texto = await extractPdfTextOCR(file, (p) => {
        const pagina = p.pageAtual && p.pageTotal ? ` página ${p.pageAtual}/${p.pageTotal}` : "";
        const pct = typeof p.pct === "number" ? ` ${p.pct}%` : "";
        onAguardando(`Leitor local: ${p.stage}${pagina}${pct}`);
      });
    }
    if (texto.trim().length < 20) {
      return { ok: false, error: "O leitor local também não encontrou texto suficiente neste PDF." };
    }
    const { validadeDias: _validadeDias, ...dados } = guessReceitaFromText(texto, file.name);
    return { ok: true, dados, arquivo: file.name };
  } catch (e) {
    return { ok: false, error: `Leitor local falhou: ${(e as Error).message}` };
  }
}

/**
 * Inicia a fila de importação. A partir daqui o processamento roda no
 * módulo (fora do React), então sair da aba /receitas/importar não para nada.
 */
export async function iniciarFilaImportacao(files: File[]) {
  if (estado.processando) return;
  if (files.length === 0) return;

  estado.linhas = files.map((f) => ({
    id: crypto.randomUUID(),
    arquivo: f.name,
    status: "fila",
  }));
  estado.total = files.length;
  estado.feito = 0;
  estado.salvos = 0;
  estado.erros = 0;
  estado.pausas = 0;
  estado.processando = true;
  avisar();

  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const linhaId = estado.linhas[i].id;
      atualizarLinha(linhaId, { status: "lendo", mensagem: "Preparando o PDF…" });

      try {
        atualizarLinha(linhaId, { status: "lendo", mensagem: "Preparando a receita…" });
        const pdfBase64 = await fileParaBase64(file);
        const pdfDataUrl = montarDataUrlSeCouber(pdfBase64);

        atualizarLinha(linhaId, { status: "lendo", mensagem: "Enviando receita para o leitor…" });
        let r = await lerComTentativas(pdfBase64, "application/pdf", file.name, (m: string) =>
          atualizarLinha(linhaId, { status: "aguardando", mensagem: m }),
        );

        if (!r.ok && r.quotaExceeded) {
          const local = await lerLocalSemLimite(file, (m: string) =>
            atualizarLinha(linhaId, { status: "aguardando", mensagem: m }),
          );
          if (local.ok) r = local;
        }

        while (!r.ok && r.quotaExceeded) {
          estado.pausas += 1;
          const espera = Math.min(Math.max(r.cooldownMs ?? 90000, 30000), 180000);
          const fim = Date.now() + espera;
          while (Date.now() < fim) {
            const restante = Math.max(0, Math.ceil((fim - Date.now()) / 1000));
            atualizarLinha(linhaId, {
              status: "pausado",
              mensagem: `Leitor no limite. Retomando automaticamente em ${restante}s…`,
            });
            await esperar(1000);
          }
          atualizarLinha(linhaId, { status: "lendo", mensagem: "Retomando leitura…" });
          r = await lerComTentativas(pdfBase64, "application/pdf", file.name, (m: string) =>
            atualizarLinha(linhaId, { status: "aguardando", mensagem: m }),
          );
        }

        if (!r.ok) {
          estado.erros += 1;
          atualizarLinha(linhaId, { status: "erro", mensagem: r.error });
        } else {
          // lê e grava direto no localStorage para não depender do React
          const residentes = lerLS<ResidenteSalvo[]>(RESIDENTES_STORAGE_KEY, []);
          const receitas = lerLS<ReceitaSalva[]>(RECEITAS_STORAGE_KEY, []);
          const arquivo = lerLS<ReceitaSalva[]>(RECEITAS_ARQUIVO_KEY, []);
          let estRes = residentes;
          let estRec = receitas;
          let estArq = arquivo;
          const res = salvarReceitaLida(
            { dados: r.dados, arquivo: file.name, arquivoUrl: pdfDataUrl },
            {
              residentes: estRes,
              setResidentes: (x) => {
                estRes = x;
                gravarLS(RESIDENTES_STORAGE_KEY, x);
              },
              receitas: estRec,
              setReceitas: (x) => {
                estRec = x;
                salvarReceitasExterno(RECEITAS_STORAGE_KEY, x);
              },
              arquivo: estArq,
              setArquivo: (x) => {
                estArq = x;
                salvarReceitasExterno(RECEITAS_ARQUIVO_KEY, x);
              },
            },
          );
          if (res.ok) {
            estado.salvos += 1;
            atualizarLinha(linhaId, {
              status: "ok",
              residenteNome: String(r.dados.residenteNome ?? "—"),
              medicacao: String(r.dados.medicacao ?? "—"),
              arquivouAntiga: res.arquivouAntiga,
              residenteCriado: res.residenteCriado,
            });
          } else {
            estado.erros += 1;
            atualizarLinha(linhaId, { status: "erro", mensagem: res.motivo });
          }
        }
      } catch (e) {
        estado.erros += 1;
        atualizarLinha(linhaId, { status: "erro", mensagem: (e as Error).message });
      }

      estado.feito += 1;
      avisar();
      if (i < files.length - 1) await esperar(2000);
    }
  } finally {
    estado.processando = false;
    avisar();
  }
}

/** Avisa ao navegador para alertar antes de sair com fila em andamento. */
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", (e) => {
    if (estado.processando) {
      e.preventDefault();
      e.returnValue = "";
    }
  });
}