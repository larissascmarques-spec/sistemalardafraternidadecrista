import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, Loader2, CheckCircle2, XCircle, Archive, PauseCircle } from "lucide-react";
import { toast } from "sonner";
import {
  inscreverFila,
  iniciarFilaImportacao,
  estadoAtualFila,
  limparHistoricoFila,
  type EstadoFila,
} from "@/lib/import-queue";

export const Route = createFileRoute("/receitas_/importar")({
  component: Page,
});

function Page() {
  const [fila, setFila] = useState<EstadoFila>(() => estadoAtualFila());

  useEffect(() => {
    const estavaProcessando = { v: fila.processando };
    return inscreverFila((e) => {
      if (estavaProcessando.v && !e.processando && e.total > 0) {
        const pausaTexto = e.pausas ? `, ${e.pausas} pausa(s) automática(s)` : "";
        toast.success(
          `Importação concluída: ${e.salvos} salva(s), ${e.erros} com erro${pausaTexto}.`,
        );
      }
      estavaProcessando.v = e.processando;
      setFila(e);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function processar(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (fila.processando) {
      toast.error("Já existe uma importação em andamento. Aguarde terminar.");
      return;
    }
    const arr = Array.from(files);
    void iniciarFilaImportacao(arr);
    toast.message(
      "Importação iniciada. Você pode navegar pelo sistema — a fila continua rodando em segundo plano.",
    );
  }

  const { linhas, processando, feito, total } = fila;

  const okN = linhas.filter((l) => l.status === "ok").length;
  const erroN = linhas.filter((l) => l.status === "erro").length;
  const pausadoN = linhas.filter((l) => l.status === "pausado").length;
  const arquivadasN = linhas.filter((l) => l.arquivouAntiga).length;
  const novosResidentesN = linhas.filter((l) => l.residenteCriado).length;

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Importar receitas em PDF"
        description="Selecione vários PDFs de uma vez. A fila roda em segundo plano — você pode sair desta aba que o envio continua. Só não feche o navegador."
        actions={
          <div className="flex gap-2">
            {linhas.length > 0 && !processando && (
              <Button
                variant="outline"
                onClick={() => {
                  limparHistoricoFila();
                  toast.success("Histórico de importação limpo.");
                }}
              >
                Limpar histórico
              </Button>
            )}
            <Button asChild variant="outline">
              <Link to="/receitas">Voltar</Link>
            </Button>
          </div>
        }
      />

      <Card>
        <CardContent className="p-6 space-y-4">
          <Label
            htmlFor="pdf-input"
            className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-10 text-center hover:bg-muted/40"
          >
            {processando ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            ) : (
              <Upload className="h-8 w-8 text-primary" />
            )}
            <div>
              <p className="text-sm font-medium">
                {processando ? `Processando ${feito} de ${total}…` : "Clique para selecionar os PDFs"}
              </p>
              <p className="text-xs text-muted-foreground">
                A fila continua rodando mesmo se você sair desta aba. Só não feche a janela do navegador.
              </p>
            </div>
            <Input
              id="pdf-input"
              type="file"
              accept="application/pdf"
              multiple
              className="hidden"
              onChange={(e) => processar(e.target.files)}
              disabled={processando}
            />
          </Label>

          {total > 0 && (
            <div className="space-y-2">
              <Progress value={(feito / total) * 100} />
              <p className="text-xs text-muted-foreground">
                {feito} de {total} concluído(s) — {okN} salva(s), {erroN} com erro, {pausadoN} pausado(s),{" "}
                {arquivadasN} substituiu antiga, {novosResidentesN} residente(s) novo(s).
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {linhas.length > 0 && (
        <Card>
          <CardContent className="p-6 space-y-2">
            <h2 className="text-lg font-semibold">Resultado</h2>
            <div className="divide-y">
              {linhas.map((l) => (
                <div key={l.id} className="flex items-center gap-3 py-2 text-sm">
                  {l.status === "ok" && <CheckCircle2 className="h-4 w-4 text-[color:var(--success)]" />}
                  {l.status === "erro" && <XCircle className="h-4 w-4 text-destructive" />}
                  {l.status === "pausado" && <PauseCircle className="h-4 w-4 text-muted-foreground" />}
                  {l.status === "lendo" && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                  {l.status === "aguardando" && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                  {l.status === "fila" && <span className="h-4 w-4 rounded-full bg-muted" />}
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{l.arquivo}</p>
                    {l.status === "aguardando" && (
                      <p className="text-xs text-muted-foreground truncate">{l.mensagem}</p>
                    )}
                    {l.status === "lendo" && l.mensagem && (
                      <p className="text-xs text-muted-foreground truncate">{l.mensagem}</p>
                    )}
                    {l.status === "ok" && (
                      <p className="text-xs text-muted-foreground truncate">
                        {l.residenteNome} • {l.medicacao}
                      </p>
                    )}
                    {l.status === "erro" && (
                      <p className="text-xs text-destructive truncate">{l.mensagem}</p>
                    )}
                    {l.status === "pausado" && (
                      <p className="text-xs text-muted-foreground truncate">{l.mensagem}</p>
                    )}
                  </div>
                  {l.arquivouAntiga && (
                    <Badge variant="outline" className="gap-1">
                      <Archive className="h-3 w-3" /> arquivou antiga
                    </Badge>
                  )}
                  {l.residenteCriado && <Badge variant="outline">novo residente</Badge>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}