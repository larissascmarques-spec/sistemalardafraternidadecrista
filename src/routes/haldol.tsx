import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Syringe, Pencil } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { fmtIsoBR, addDaysIso } from "@/lib/date-utils";
import { diasAte } from "@/lib/mock-data";
import { formatNome } from "@/lib/format-nome";
import { useAllResidentes, type ResidenteSalvo } from "@/lib/residentes-store";

export const Route = createFileRoute("/haldol")({
  component: Page,
  head: () => ({
    meta: [
      { title: "Haldol injetável — próximas doses | FarmaLar" },
      {
        name: "description",
        content:
          "Consulte a qualquer momento a data da próxima dose de Haldol injetável de cada residente e registre as aplicações.",
      },
      { property: "og:title", content: "Haldol injetável — próximas doses" },
      {
        property: "og:description",
        content:
          "Datas das próximas aplicações de Haloperidol Decanoato por residente.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function Page() {
  const { salvos, setSalvos } = useAllResidentes();
  const [editando, setEditando] = useState<ResidenteSalvo | null>(null);
  const [dataEdit, setDataEdit] = useState("");
  const [periodoEdit, setPeriodoEdit] = useState("30");
  const [ultimaEdit, setUltimaEdit] = useState("");

  const lista = salvos
    .filter((r) => r.haldolInjetavel?.proximaDose)
    .map((r) => ({
      residente: r,
      proximaDose: r.haldolInjetavel!.proximaDose,
      periodicidade: r.haldolInjetavel!.periodicidadeDias,
      historico: r.haldolInjetavel!.historico ?? [],
      dias: diasAte(r.haldolInjetavel!.proximaDose),
    }))
    .sort((a, b) => a.proximaDose.localeCompare(b.proximaDose));

  function marcarFeito(r: ResidenteSalvo) {
    if (!r.haldolInjetavel) return;
    const hojeIso = new Date().toISOString().slice(0, 10);
    const proxima = addDaysIso(hojeIso, r.haldolInjetavel.periodicidadeDias);
    const atualizado: ResidenteSalvo = {
      ...r,
      haldolInjetavel: {
        ...r.haldolInjetavel,
        proximaDose: proxima,
        historico: [...(r.haldolInjetavel.historico ?? []), hojeIso],
      },
    };
    setSalvos(salvos.map((x) => (x.id === r.id ? atualizado : x)));
    toast.success(`Aplicação registrada. Próxima dose: ${fmtIsoBR(proxima)}`);
  }

  function abrirEdicao(r: ResidenteSalvo) {
    setEditando(r);
    setDataEdit(r.haldolInjetavel?.proximaDose ?? "");
    setPeriodoEdit(String(r.haldolInjetavel?.periodicidadeDias ?? 30));
    const h = r.haldolInjetavel?.historico ?? [];
    setUltimaEdit(h.length ? h[h.length - 1] : "");
  }

  function salvarEdicao() {
    if (!editando?.haldolInjetavel) return;
    if (!dataEdit) {
      toast.error("Informe a data da próxima dose.");
      return;
    }
    const dias = Number(periodoEdit) || editando.haldolInjetavel.periodicidadeDias;
    const histAtual = [...(editando.haldolInjetavel.historico ?? [])];
    if (ultimaEdit) {
      if (histAtual.length) histAtual[histAtual.length - 1] = ultimaEdit;
      else histAtual.push(ultimaEdit);
    } else if (histAtual.length) {
      histAtual.pop();
    }
    const atualizado: ResidenteSalvo = {
      ...editando,
      haldolInjetavel: {
        ...editando.haldolInjetavel,
        proximaDose: dataEdit,
        periodicidadeDias: dias,
        historico: histAtual,
      },
    };
    setSalvos(salvos.map((x) => (x.id === editando.id ? atualizado : x)));
    setEditando(null);
    toast.success(`Próxima dose atualizada para ${fmtIsoBR(dataEdit)}`);
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Haldol injetável"
        description="Todas as residentes que usam Haloperidol Decanoato IM, com a data da próxima dose."
      />

      {lista.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Nenhuma residente com Haldol injetável cadastrado. Ative a opção na
            ficha da residente (aba Residentes) para acompanhar aqui.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {lista.map((h) => {
            const atrasada = h.dias < 0;
            const hoje = h.dias === 0;
            const proxima = h.dias > 0 && h.dias <= 7;
            return (
              <Card
                key={h.residente.id}
                className={
                  atrasada
                    ? "border-destructive"
                    : hoje || proxima
                      ? "border-[color:var(--warning)]"
                      : undefined
                }
              >
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Syringe className="h-4 w-4 text-primary" />
                      <span className="font-medium">
                        {formatNome(h.residente.nome)}
                      </span>
                    </div>
                    <Badge
                      variant={
                        atrasada
                          ? "destructive"
                          : hoje || proxima
                            ? "default"
                            : "secondary"
                      }
                    >
                      {atrasada
                        ? `atrasada ${Math.abs(h.dias)} dia(s)`
                        : hoje
                          ? "é hoje"
                          : `em ${h.dias} dia(s)`}
                    </Badge>
                  </div>

                  <p className="text-sm">
                    Próxima dose:{" "}
                    <span className="font-semibold">{fmtIsoBR(h.proximaDose)}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Periodicidade: a cada {h.periodicidade} dias
                    {h.historico.length > 0 && (
                      <>
                        {" · "}Última aplicação:{" "}
                        {fmtIsoBR(h.historico[h.historico.length - 1])}
                      </>
                    )}
                  </p>

                  {h.historico.length > 0 && (
                    <details className="text-xs text-muted-foreground">
                      <summary className="cursor-pointer">
                        Histórico ({h.historico.length})
                      </summary>
                      <ul className="mt-1 list-disc space-y-0.5 pl-4">
                        {[...h.historico]
                          .sort((a, b) => b.localeCompare(a))
                          .map((d) => (
                            <li key={d}>{fmtIsoBR(d)}</li>
                          ))}
                      </ul>
                    </details>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      className="h-8"
                      onClick={() => marcarFeito(h.residente)}
                    >
                      Marcar dose como feita hoje
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8"
                      onClick={() => abrirEdicao(h.residente)}
                    >
                      <Pencil className="mr-1 h-3.5 w-3.5" />
                      Editar data
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!editando} onOpenChange={(o) => !o && setEditando(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Editar Haldol — {editando ? formatNome(editando.nome) : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="haldol-ultima">Data da última aplicação</Label>
              <Input
                id="haldol-ultima"
                type="date"
                value={ultimaEdit}
                onChange={(e) => {
                  const v = e.target.value;
                  setUltimaEdit(v);
                  if (v) {
                    const dias =
                      Number(periodoEdit) ||
                      editando?.haldolInjetavel?.periodicidadeDias ||
                      30;
                    setDataEdit(addDaysIso(v, dias));
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                Ao mudar aqui, a próxima dose é recalculada automaticamente.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="haldol-data">Data da próxima dose</Label>
              <Input
                id="haldol-data"
                type="date"
                value={dataEdit}
                onChange={(e) => setDataEdit(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="haldol-periodo">Periodicidade (dias)</Label>
              <Input
                id="haldol-periodo"
                type="number"
                min={1}
                value={periodoEdit}
                onChange={(e) => setPeriodoEdit(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditando(null)}>
              Cancelar
            </Button>
            <Button onClick={salvarEdicao}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
