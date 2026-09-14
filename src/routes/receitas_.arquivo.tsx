import { useReceitas } from "@/lib/receitas-cloud";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLocalStorage } from "@/hooks/use-local-storage";
import {
  RECEITAS_ARQUIVO_KEY,
  RECEITAS_STORAGE_KEY,
  gravarReceitasSeguro,
  type ReceitaSalva,
} from "@/lib/receitas-store";
import { useAllResidentes } from "@/lib/residentes-store";
import { fmtIsoBR } from "@/lib/date-utils";
import { FileText, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatNome } from "@/lib/format-nome";

function normKey(s: string) {
  return formatNome(s).trim().toLowerCase();
}

export const Route = createFileRoute("/receitas_/arquivo")({
  component: Page,
});

function Page() {
  const [arquivo, setArquivo] = useReceitas(RECEITAS_ARQUIVO_KEY, []);
  const [ativas, setAtivas] = useReceitas(RECEITAS_STORAGE_KEY, []);
  const { nomePor } = useAllResidentes();
  const [filtroNome, setFiltroNome] = useState<string>("__all__");

  const nomeReceita = (r: ReceitaSalva) => r.residenteNome?.trim() || nomePor(r.residenteId);

  // Lista de residentes que aparecem no arquivo (para o filtro)
  const nomesDisponiveis = useMemo(() => {
    const set = new Map<string, string>();
    for (const r of arquivo) {
      const nome = nomeReceita(r);
      if (!nome) continue;
      set.set(normKey(nome), nome);
    }
    return [...set.values()].sort((a, b) => a.localeCompare(b, "pt-BR"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arquivo]);

  const filtradas = useMemo(() => {
    if (filtroNome === "__all__") return arquivo;
    return arquivo.filter((r) => normKey(nomeReceita(r)) === filtroNome);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arquivo, filtroNome]);

  // Ordena por paciente → medicação → vencimento (mais recente primeiro)
  const lista = [...filtradas].sort((a, b) => {
    const na = nomeReceita(a).localeCompare(nomeReceita(b), "pt-BR");
    if (na !== 0) return na;
    const ma = a.medicacao.localeCompare(b.medicacao, "pt-BR");
    if (ma !== 0) return ma;
    return new Date(b.vencimento).getTime() - new Date(a.vencimento).getTime();
  });

  function apagarTudo() {
    if (arquivo.length === 0) return;
    if (!confirm(`Apagar TODAS as ${arquivo.length} receitas arquivadas? Esta ação não pode ser desfeita.`)) return;
    setArquivo([]);
    toast.success("Arquivo de receitas esvaziado.");
  }

  function apagarUma(id: string) {
    if (!confirm("Apagar esta receita do arquivo?")) return;
    setArquivo(arquivo.filter((r) => r.id !== id));
    toast.success("Receita apagada.");
  }

  function restaurar(id: string) {
    const r = arquivo.find((x) => x.id === id);
    if (!r) return;
    // Verifica se já existe uma ativa "mais nova" com mesma chave (residente+medicação)
    const mesmaChave = ativas.filter(
      (a) =>
        a.residenteId === r.residenteId &&
        a.medicacao.trim().toLowerCase() === r.medicacao.trim().toLowerCase(),
    );
    const tsR = new Date(r.dataEmissao).getTime() || 0;
    const existeMaisNova = mesmaChave.some(
      (a) => (new Date(a.dataEmissao).getTime() || 0) > tsR,
    );
    if (existeMaisNova) {
      if (
        !confirm(
          "Já existe uma receita ativa mais recente para essa medicação. Restaurar mesmo assim vai manter as duas ativas. Continuar?",
        )
      )
        return;
    } else if (mesmaChave.length > 0) {
      if (
        !confirm(
          "Existe uma receita ativa para essa medicação. Ao restaurar, a atual será arquivada e esta voltará como ativa. Continuar?",
        )
      )
        return;
    }

    // Move as ativas antigas (mais antigas ou empatadas) para o arquivo, restaura r
    const paraArquivar = existeMaisNova
      ? []
      : mesmaChave.map((a) => ({
          ...a,
          arquivadaEm: new Date().toISOString(),
          substituidaPor: r.id,
          motivoArquivamento: "substituida" as const,
        }));
    const ativasSemAntigas = existeMaisNova
      ? ativas
      : ativas.filter((a) => !paraArquivar.some((x) => x.id === a.id));
    const restaurada: ReceitaSalva = {
      ...r,
      arquivadaEm: undefined,
      substituidaPor: undefined,
      motivoArquivamento: undefined,
      restauradaEm: new Date().toISOString(),
    };
    const novasAtivas = [...ativasSemAntigas, restaurada];
    // Grava direto no navegador antes de mexer na tela: se não couber
    // (PDFs em base64 ocupam muito espaço), a receita não pode ser removida
    // do arquivo — senão ela desaparece do sistema.
    const res = gravarReceitasSeguro(RECEITAS_STORAGE_KEY, novasAtivas);
    if (!res.ok) {
      toast.error(
        "Não foi possível restaurar: o armazenamento do navegador está cheio. Apague algumas receitas antigas do arquivo e tente de novo.",
      );
      return;
    }
    setAtivas(res.lista);
    setArquivo([
      ...arquivo.filter((x) => x.id !== r.id),
      ...paraArquivar,
    ]);
    if (res.pdfsRemovidos > 0) {
      toast.warning(
        `Espaço cheio: o PDF de ${res.pdfsRemovidos} receita(s) antiga(s) foi removido para caber. Os dados das receitas foram mantidos.`,
      );
    }
    const vencida = new Date(r.vencimento).getTime() < Date.now();
    toast.success(
      vencida
        ? "Receita restaurada. Ela aparece nas ativas com o selo “Vencida”."
        : "Receita restaurada para as ativas.",
    );
  }

  function verPdf(r: ReceitaSalva) {
    if (!r.arquivoUrl) {
      toast.error("Esta receita não tem PDF guardado no sistema.");
      return;
    }
    const w = window.open();
    if (!w) {
      toast.error("Permita pop-ups para visualizar o PDF.");
      return;
    }
    w.document.write(
      `<title>${r.medicacao}</title><iframe src="${r.arquivoUrl}" style="border:0;width:100vw;height:100vh"></iframe>`,
    );
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Arquivo de receitas"
        description="Receitas antigas que foram substituídas por uma versão mais recente. Mantidas para histórico."
        actions={
          <div className="flex gap-2">
            {arquivo.length > 0 && (
              <Button variant="destructive" onClick={apagarTudo}>
                <Trash2 className="mr-2 h-4 w-4" /> Apagar tudo
              </Button>
            )}
            <Button asChild variant="outline">
              <Link to="/receitas">Voltar para receitas ativas</Link>
            </Button>
          </div>
        }
      />
      {arquivo.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtrar por residente:</span>
          <Select value={filtroNome} onValueChange={setFiltroNome}>
            <SelectTrigger className="w-[260px]">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todas</SelectItem>
              {nomesDisponiveis.map((nome) => (
                <SelectItem key={nome} value={normKey(nome)}>
                  {nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filtroNome !== "__all__" && (
            <Button variant="ghost" size="sm" onClick={() => setFiltroNome("__all__")}>
              Limpar filtro
            </Button>
          )}
          <span className="ml-auto text-xs text-muted-foreground">
            {lista.length} de {arquivo.length}
          </span>
        </div>
      )}
      <Card>
        <CardContent className="p-0">
          {lista.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              Nenhuma receita para esse filtro.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Residente</TableHead>
                  <TableHead>Medicação</TableHead>
                  <TableHead>Médico</TableHead>
                  <TableHead>Emissão</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Arquivada em</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Observação</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lista.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{nomeReceita(r)}</TableCell>
                    <TableCell>{r.medicacao}</TableCell>
                    <TableCell>{r.medico}</TableCell>
                    <TableCell>{fmtIsoBR(r.dataEmissao)}</TableCell>
                    <TableCell>{fmtIsoBR(r.vencimento)}</TableCell>
                    <TableCell>
                      {r.arquivadaEm ? new Date(r.arquivadaEm).toLocaleDateString("pt-BR") : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{r.motivoArquivamento ?? (r.substituidaPor ? "substituida" : "—")}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.observacao ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title={r.arquivoUrl ? "Ver PDF da receita" : "Sem PDF guardado"}
                          disabled={!r.arquivoUrl}
                          onClick={() => verPdf(r)}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Restaurar para receitas ativas"
                          onClick={() => restaurar(r.id)}
                        >
                          <Undo2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Apagar do arquivo"
                          onClick={() => apagarUma(r.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}