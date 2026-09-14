import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  pdfBase64: z.string().min(10).optional(),
  imageBase64: z.string().min(10).optional(),
  mimeType: z.enum(["application/pdf", "image/jpeg", "image/png"]).optional(),
  fileName: z.string().min(1).max(255),
}).refine((input) => input.pdfBase64 || input.imageBase64, {
  message: "Envie o PDF ou uma imagem da receita.",
});

function erroTemporario(status: number): boolean {
  return status === 429 || status === 500 || status === 503 || status === 504;
}

function extrairEsperaMs(corpo: string): number | undefined {
  const match = corpo.match(/"retryDelay"\s*:\s*"(\d+)s"/);
  if (!match) return undefined;
  return Number(match[1]) * 1000;
}

async function fetchComTimeout(url: string, init: RequestInit, timeoutMs = 45000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export const lerPdfComGemini = createServerFn({ method: "POST" })
  .inputValidator((input) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return { ok: false as const, error: "GEMINI_API_KEY não configurada." };
    }

    const prompt = `Você está lendo uma receita médica brasileira escaneada.
Extraia os campos abaixo e devolva APENAS um JSON válido, sem comentários, no formato:
{
  "residenteNome": string | null,
  "medico": string | null,
  "medicacao": string | null,
  "dosagem": string | null,
  "dataEmissao": "AAAA-MM-DD" | null,
  "tipo": "Branca simples" | "Controle especial" | "Amarela" | "Azul" | "LME" | "Alto custo" | "Receita contínua" | null,
  "origem": "SUS/UBS" | "Farmácia Popular" | "Alto custo" | "Particular" | null,
  "duracaoTratamentoDias": number | null,
  "textoBruto": string
}

Regras:
- "textoBruto" = transcrição completa de tudo que está escrito na receita.
- Se não tiver certeza de um campo, use null.
- Datas no formato AAAA-MM-DD.
- "duracaoTratamentoDias": leia o tempo do tratamento escrito na receita e converta em DIAS.
  Ex.: "usar por 60 dias" -> 60; "tratamento por 6 meses" -> 180; "uso contínuo" -> 365;
  "tomar por 3 meses" -> 90; "1 caixa" -> null. Se não estiver escrito, use null.
- Não escreva nada fora do JSON.`;

    try {
      const modelos = ["gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-2.0-flash"];
      let resp: Response | null = null;
      let ultimoErro = "";
      let teveErroTemporario = false;
      let limiteDeUso = false;
      let esperaMs = 90000;
      const conteudoBase64 = data.imageBase64 ?? data.pdfBase64 ?? "";
      const mimeType = data.mimeType ?? (data.imageBase64 ? "image/jpeg" : "application/pdf");

      for (const modelo of modelos) {
        try {
          resp = await fetchComTimeout(
            `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      { text: prompt },
                      { inline_data: { mime_type: mimeType, data: conteudoBase64 } },
                    ],
                  },
                ],
                generationConfig: { responseMimeType: "application/json", temperature: 0.1 },
              }),
            },
          );
          if (resp.ok) break;
          const corpoCompleto = await resp.text();
          const corpo = corpoCompleto.slice(0, 300);
          ultimoErro = `${modelo} ${resp.status}`;
          if (resp.status === 429) {
            limiteDeUso = true;
            esperaMs = Math.max(esperaMs, extrairEsperaMs(corpoCompleto) ?? 90000);
          }
          if (!erroTemporario(resp.status) && resp.status !== 404) break;
          teveErroTemporario = true;
        } catch (erro) {
          ultimoErro = `${modelo}: ${(erro as Error).message || "tempo esgotado"}`;
          teveErroTemporario = true;
        }
      }

      if (!resp || !resp.ok) {
        if (limiteDeUso) {
          return {
            ok: false as const,
            retryable: false,
            quotaExceeded: true,
            cooldownMs: esperaMs,
            error: "O leitor atingiu o limite de uso agora. Parei a fila para não desperdiçar novas tentativas. Aguarde alguns minutos e tente continuar depois.",
          };
        }
        const mensagem = teveErroTemporario
          ? "O leitor pediu uma pausa. O sistema vai esperar mais tempo antes de tentar novamente."
          : "Não consegui acessar o leitor de PDF agora. Vou manter este arquivo como erro para você tentar novamente.";
        return {
          ok: false as const,
          retryable: teveErroTemporario,
          cooldownMs: esperaMs,
          error: `${mensagem} (${ultimoErro})`,
        };
      }

      const json = (await resp.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const txt = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      if (!txt) return { ok: false as const, retryable: true, error: "Gemini retornou resposta vazia. Vou tentar novamente." };

      try {
        const parsed = JSON.parse(txt);
        return { ok: true as const, dados: parsed, arquivo: data.fileName };
      } catch {
        return { ok: false as const, retryable: true, error: "Resposta não é JSON válido. Vou tentar novamente.", bruto: txt };
      }
    } catch (e) {
      return { ok: false as const, retryable: true, error: (e as Error).message };
    }
  });