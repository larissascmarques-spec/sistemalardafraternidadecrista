import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import { importarBackupFarmalar, type ResultadoImportacao } from "@/lib/importar-backup";

export const Route = createFileRoute("/importar-backup")({
  component: Page,
});

function Page() {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoImportacao | null>(null);

  async function importar() {
    if (!arquivo) {
      toast.error("Selecione o arquivo backup-farmalar.json");
      return;
    }
    setEnviando(true);
    setResultado(null);
    try {
      const texto = await arquivo.text();
      const json = JSON.parse(texto) as unknown;
      const res = await importarBackupFarmalar(json);
      setResultado(res);
      if (res.erros.length) {
        toast.error(`Importado com ${res.erros.length} erro(s).`);
      } else {
        toast.success("Dados importados para a sua conta.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Não foi possível importar.";
      toast.error(msg);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Importar backup"
        description="Envie o backup-farmalar.json do Lovable. Os dados ficam ligados à conta em que você está logada."
      />
      <div className="p-6">
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label htmlFor="backup">Arquivo JSON</Label>
              <Input
                id="backup"
                type="file"
                accept=".json,application/json"
                onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
              />
            </div>
            <Button onClick={() => void importar()} disabled={enviando}>
              {enviando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Importar agora
            </Button>
            {resultado && (
              <div className="text-sm text-muted-foreground">
                <p>Residentes: {resultado.residentes}</p>
                <p>Estoque: {resultado.estoque}</p>
                <p>Consultas/exames: {resultado.agendamentos}</p>
                <p>Receitas: {resultado.receitas}</p>
                <p>Insumos: {resultado.insumos}</p>
                <p>Procedimentos: {resultado.procedimentos}</p>
                {resultado.erros.length > 0 && (
                  <ul className="mt-2 list-disc pl-5 text-destructive">
                    {resultado.erros.slice(0, 8).map((e) => (
                      <li key={e}>{e}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
