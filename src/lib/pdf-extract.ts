// Extrai texto de PDFs no próprio navegador usando pdfjs-dist.
// Tudo roda local — nada é enviado pra servidor.

import type { Receita } from "./mock-data";

let pdfjsPromise: Promise<typeof import("pdfjs-dist")> | null = null;

async function getPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then(async (mod) => {
      // Worker via URL — Vite resolve em build
      const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
      mod.GlobalWorkerOptions.workerSrc = workerUrl;
      return mod;
    });
  }
  return pdfjsPromise;
}

export async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await getPdfjs();
  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  let full = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((it: any) => ("str" in it ? it.str : "")).join(" ");
    full += text + "\n";
  }
  return full;
}

export type OcrProgress = (info: { stage: string; pageAtual?: number; pageTotal?: number; pct?: number }) => void;

async function renderPageToCanvas(page: any, scale = 2): Promise<HTMLCanvasElement> {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const ctx = canvas.getContext("2d", { alpha: false })!;
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvas, canvasContext: ctx, viewport, background: "rgb(255,255,255)" }).promise;
  return canvas;
}

export async function renderPdfFirstPageImage(file: File): Promise<{ base64: string; mimeType: "image/jpeg" }> {
  const pdfjs = await getPdfjs();
  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  const page = await doc.getPage(1);
  const viewport = page.getViewport({ scale: 1 });
  const targetWidth = 1100;
  const scale = Math.min(1.8, Math.max(1, targetWidth / viewport.width));
  const canvas = await renderPageToCanvas(page, scale);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.72);
  return { base64: dataUrl.slice(dataUrl.indexOf(",") + 1), mimeType: "image/jpeg" };
}

export async function extractPdfTextOCR(file: File, onProgress?: OcrProgress): Promise<string> {
  onProgress?.({ stage: "Abrindo PDF" });
  const pdfjs = await getPdfjs();
  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;

  onProgress?.({ stage: "Carregando leitor (1ª vez baixa ~10MB)" });
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("por", 1, {
    logger: (m: any) => {
      if (m.status === "recognizing text") {
        onProgress?.({ stage: "Lendo texto", pct: Math.round(m.progress * 100) });
      }
    },
  });

  let full = "";
  try {
    for (let i = 1; i <= doc.numPages; i++) {
      onProgress?.({ stage: "Renderizando página", pageAtual: i, pageTotal: doc.numPages });
      const page = await doc.getPage(i);
      const canvas = await renderPageToCanvas(page, 3);
      onProgress?.({ stage: "Lendo texto", pageAtual: i, pageTotal: doc.numPages, pct: 0 });
      const { data } = await worker.recognize(canvas.toDataURL("image/png"));
      full += data.text + "\n";
    }
  } finally {
    await worker.terminate();
  }
  return full;
}

export type GuessedReceita = Partial<
  Pick<Receita, "medicacao" | "dosagem" | "tipo" | "dataEmissao" | "validadeDias" | "medico" | "origem">
> & {
  residenteNome?: string;
  duracaoTratamentoDias?: number;
  textoBruto: string;
  arquivo: string;
};

function parseDateBR(s: string): string | undefined {
  // dd/mm/aaaa -> aaaa-mm-dd
  const m = s.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (!m) return undefined;
  const d = m[1].padStart(2, "0");
  const mo = m[2].padStart(2, "0");
  let y = m[3];
  if (y.length === 2) y = "20" + y;
  return `${y}-${mo}-${d}`;
}

export function guessReceitaFromText(texto: string, arquivo: string): GuessedReceita {
  const t = texto.replace(/\s+/g, " ").trim();
  const lower = t.toLowerCase();

  // Paciente / residente
  let residenteNome: string | undefined;
  const mPac = t.match(/(?:paciente|nome do paciente|residente)\s*[:\-]?\s*([A-ZÁÉÍÓÚÂÊÔÃÕÇ][A-Za-zÀ-ÿ' ]{3,60})/);
  if (mPac) residenteNome = mPac[1].trim();

  // Médico (CRM)
  let medico: string | undefined;
  const mMed = t.match(/(Dr\.?a?\.?\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ][A-Za-zÀ-ÿ' ]{3,60})/);
  if (mMed) medico = mMed[1].trim();

  // Data de emissão
  let dataEmissao: string | undefined;
  const mData = t.match(/(?:data|emiss[aã]o|emitid[ao] em)\s*[:\-]?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i);
  if (mData) dataEmissao = parseDateBR(mData[1]);
  if (!dataEmissao) {
    const any = t.match(/(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/);
    if (any) dataEmissao = parseDateBR(any[1]);
  }

  // Tipo de receita
  let tipo: GuessedReceita["tipo"];
  if (/controle especial|notifica[cç][aã]o de receita b/i.test(t)) tipo = "Controle especial";
  else if (/receita amarela|notifica[cç][aã]o a/i.test(t)) tipo = "Amarela";
  else if (/receita azul|notifica[cç][aã]o b/i.test(t)) tipo = "Azul";
  else if (/lme|laudo m[eé]dico/i.test(t)) tipo = "LME";
  else if (/alto custo/i.test(t)) tipo = "Alto custo";
  else if (/cont[ií]nu[ao]/i.test(t)) tipo = "Receita contínua";
  else tipo = "Branca simples";

  // Duração do tratamento — define a validade da receita
  // Ex.: "usar durante 60 dias", "tomar por 3 meses", "uso contínuo"
  let duracaoTratamentoDias: number | undefined;
  const mDias = lower.match(/(?:usar|tomar|utilizar|fazer\s*uso)[^\d]{0,30}(\d{1,4})\s*dia/);
  const mMeses = lower.match(/(?:usar|tomar|utilizar|por|durante|tratamento)[^\d]{0,20}(\d{1,3})\s*m[eê]s/);
  const mSemanas = lower.match(/(?:usar|tomar|utilizar|por|durante)[^\d]{0,20}(\d{1,3})\s*semana/);
  const mAnos = lower.match(/(?:usar|tomar|utilizar|por|durante)[^\d]{0,20}(\d{1,2})\s*ano/);
  if (mDias) duracaoTratamentoDias = Number(mDias[1]);
  else if (mMeses) duracaoTratamentoDias = Number(mMeses[1]) * 30;
  else if (mSemanas) duracaoTratamentoDias = Number(mSemanas[1]) * 7;
  else if (mAnos) duracaoTratamentoDias = Number(mAnos[1]) * 365;
  else if (/uso\s*cont[ií]nuo|cont[ií]nu[ao]/.test(lower)) duracaoTratamentoDias = 365;

  // Validade (em dias) — usa a duração lida; só cai no padrão por tipo se nada for encontrado
  const validadeDias =
    duracaoTratamentoDias ??
    (tipo === "Controle especial" || tipo === "Amarela" ? 30 : 180);

  // Medicação — pega a primeira linha com "mg" ou "mcg"
  let medicacao: string | undefined;
  const mMedic = t.match(/([A-ZÁÉÍÓÚÂÊÔÃÕÇ][A-Za-zÀ-ÿ]+(?:\s+[A-Za-zÀ-ÿ]+)?\s*\d+\s?(?:mg|mcg|g|ml))/i);
  if (mMedic) medicacao = mMedic[1].trim();

  // Posologia
  let dosagem: string | undefined;
  const mDose = t.match(/(\d+\s*comp[a-z]*\s*(?:de\s*\d+\s*em\s*\d+\s*horas?|[0-9]+\/[0-9]+h|\d+\s*x\s*ao dia|ao deitar|pela manh[aã]|à noite|de manh[aã])?)/i);
  if (mDose) dosagem = mDose[1].trim();

  // Origem
  let origem: GuessedReceita["origem"];
  if (/sus|ubs|esf|posto/i.test(lower)) origem = "SUS/UBS";
  else if (/farm[aá]cia popular/i.test(lower)) origem = "Farmácia Popular";
  else if (/alto custo|grs|policl[ií]nica/i.test(lower)) origem = "Alto custo";
  else origem = "SUS/UBS";

  return {
    residenteNome,
    medico,
    dataEmissao,
    tipo,
    validadeDias,
    duracaoTratamentoDias,
    medicacao,
    dosagem,
    origem,
    textoBruto: t.slice(0, 4000),
    arquivo,
  };
}