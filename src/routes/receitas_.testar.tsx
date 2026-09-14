import { useReceitas } from "@/lib/receitas-cloud";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { formatNome } from "@/lib/format-nome";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Upload, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { lerPdfComGemini } from "@/lib/gemini-pdf.functions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type Receita } from "@/lib/mock-data";
import { useLocalStorage } from "@/hooks/use-local-storage";
import {
  RECEITAS_STORAGE_KEY,
  RECEITAS_ARQUIVO_KEY,
  type ReceitaSalva,
} from "@/lib/receitas-store";
import {
  RESIDENTES_STORAGE_KEY,
  useAllResidentes,
  buscarResidentePorNome,
  type ResidenteSalvo,
} from "@/lib/residentes-store";
import {
  salvarReceitaLida,
  normalizaTipo,
  normalizaOrigem,
} from "@/lib/salvar-receita";

async function fileToBase64(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

type Dados = {
  residenteNome?: string | null;
  medico?: string | null;
  medicacao?: string | null;
  dosagem?: string | null;
  dataEmissao?: string | null;
  tipo?: string | null;
  origem?: string | null;
  textoBruto?: string | null;
};

export const Route = createFileRoute("/receitas_/testar")({
  component: Page,
});

const tipos: Receita["tipo"][] = [
  "Branca simples",
  "Controle especial",
  "Azul",
  "Amarela",
  "LME",
  "Alto custo",
  "Receita contínua",
];

const origens: Receita["origem"][] = [
  "Farmácia Popular",
  "GRS/Policlínica",
  "Compra própria",
  "SUS/UBS",
  "Alto custo",
];

function Page() {
  const navigate = useNavigate();
  const lerNoServidor = useServerFn(lerPdfComGemini);
  const { salvos: residentesSalvos, setSalvos: setResidentesSalvos, todos: todosResidentes } =
    useAllResidentes();
  const [receitas, setReceitas] = useReceitas(RECEITAS_STORAGE_KEY, []);
  const [arquivoStore, setArquivoStore] = useReceitas(
    RECEITAS_ARQUIVO_KEY,
    [],
  );
  const [lendo, setLendo] = useState(false);
  const [stage, setStage] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [dados, setDados] = useState<Dados | null>(null);
  const [tempo, setTempo] = useState<number | null>(null);
  const [arquivo, setArquivo] = useState<string>("");

  // Campos editáveis para salvar
  const [residenteId, setResidenteId] = useState("");
  const [medicacao, setMedicacao] = useState("");
  const [dosagem, setDosagem] = useState("");
  const [medico, setMedico] = useState("");
  const [dataEmissao, setDataEmissao] = useState("");
  const [validadeDias, setValidadeDias] = useState(180);
  const [tipo, setTipo] = useState<Receita["tipo"]>("Branca simples");
  const [origem, setOrigem] = useState<Receita["origem"]>("SUS/UBS");

  useEffect(() => {
    if (!dados) return;
    const ach = buscarResidentePorNome(dados.residenteNome ?? "", residentesSalvos);
    setResidenteId(ach?.id ?? "__novo__");
    setMedicacao(dados.medicacao ?? "");
    setDosagem(dados.dosagem ?? "");
    setMedico(dados.medico ?? "");
    setDataEmissao(dados.dataEmissao ?? "");
    setTipo(normalizaTipo(dados.tipo));
    setOrigem(normalizaOrigem(dados.origem));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dados]);

  async function rodar(file: File) {
    setLendo(true);
    setErro(null);
    setDados(null);
    setTempo(null);
    setArquivo(file.name);
    setStage("Preparando o PDF…");
    const t0 = performance.now();
    try {
      const base64 = await fileToBase64(file);
      setStage("Gemini está lendo a receita…");
      const r = await lerNoServidor({ data: { pdfBase64: base64, fileName: file.name } });
      if (!r.ok) {
        setErro(r.error);
      } else {
        setDados(r.dados as Dados);
      }
      setTempo(Math.round((performance.now() - t0) / 1000));
    } catch (e) {
      console.error(e);
      setErro((e as Error).message);
    } finally {
      setLendo(false);
    }
  }

  function salvar() {
    if (!residenteId || !medicacao || !dataEmissao || !tipo) {
      toast.error("Preencha residente, medicação, data de emissão e tipo.");
      return;
    }
    const res = salvarReceitaLida(
      {
        dados: {
          residenteNome: dados?.residenteNome ?? null,
          medico,
          medicacao,
          dosagem,
          dataEmissao,
          tipo,
          origem,
        },
        arquivo,
        validadeDias,
        residenteIdManual: residenteId === "__novo__" ? undefined : residenteId,
      },
      {
        residentes: residentesSalvos,
        setResidentes: setResidentesSalvos,
        receitas,
        setReceitas,
        arquivo: arquivoStore,
        setArquivo: setArquivoStore,
      },
    );
    if (!res.ok) {
      toast.error(res.motivo ?? "Não consegui salvar.");
      return;
    }
    toast.success(
      res.arquivouAntiga
        ? "Receita salva. A versão anterior foi movida para o Arquivo."
        : "Receita salva no sistema.",
    );
    navigate({ to: "/receitas" });
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Testar leitura de 1 PDF"
        description="Envie 1 receita escaneada. O Gemini vai ler e extrair os campos."
        actions={
          <Button asChild variant="outline">
            <Link to="/receitas">Voltar</Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="p-6 space-y-4">
          <Label
            htmlFor="pdf-teste"
            className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-10 text-center hover:bg-muted/40"
          >
            {lendo ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> : <Upload className="h-8 w-8 text-primary" />}
            <p className="text-sm font-medium">
              {lendo ? "Lendo…" : "Clique para selecionar 1 PDF de teste"}
            </p>
            <Input
              id="pdf-teste"
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              disabled={lendo}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) rodar(f);
              }}
            />
          </Label>

          {lendo && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{stage}</p>
              <p className="text-xs text-muted-foreground">
                Costuma levar de 5 a 20 segundos.
              </p>
            </div>
          )}

          {erro && (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
              {erro}
            </div>
          )}
        </CardContent>
      </Card>

      {dados && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Revise e salve no sistema</h2>
              {tempo !== null && <Badge variant="outline">Tempo: {tempo}s</Badge>}
            </div>
            {dados.residenteNome && (
              <Badge variant="outline">Nome lido pelo Gemini: {dados.residenteNome}</Badge>
            )}
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label>Residente *</Label>
                <Select value={residenteId} onValueChange={setResidenteId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o residente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__novo__">
                      + Criar novo residente {dados.residenteNome ? `("${dados.residenteNome}")` : ""}
                    </SelectItem>
                    {todosResidentes.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {formatNome(r.nome)}
                        {(r as ResidenteSalvo).aRevisar ? " (a revisar)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Medicação *</Label>
                <Input value={medicacao} onChange={(e) => setMedicacao(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Posologia</Label>
                <Input value={dosagem} onChange={(e) => setDosagem(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Médico</Label>
                <Input value={medico} onChange={(e) => setMedico(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Data de emissão *</Label>
                <Input type="date" value={dataEmissao} onChange={(e) => setDataEmissao(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Validade (dias)</Label>
                <Input type="number" value={validadeDias} onChange={(e) => setValidadeDias(Number(e.target.value))} />
              </div>
              <div className="space-y-1">
                <Label>Tipo *</Label>
                <Select value={tipo} onValueChange={(v) => setTipo(v as Receita["tipo"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {tipos.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Origem</Label>
                <Select value={origem} onValueChange={(v) => setOrigem(v as Receita["origem"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {origens.map((o) => (<SelectItem key={o} value={o}>{o}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={salvar}>
                <Check className="mr-2 h-4 w-4" /> Salvar receita no sistema
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {dados?.textoBruto && (
        <Card>
          <CardContent className="p-6 space-y-2">
            <h2 className="text-lg font-semibold">Texto bruto lido pelo Gemini</h2>
            <p className="text-xs text-muted-foreground">
              Tudo que o Gemini conseguiu transcrever da receita.
            </p>
            <pre className="max-h-96 overflow-auto rounded-md bg-muted p-4 text-xs whitespace-pre-wrap">
              {dados.textoBruto}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}