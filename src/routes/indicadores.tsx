import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Download, Trash2, FileText } from "lucide-react";
import { fmtIsoBR } from "@/lib/date-utils";
import { useAllResidentes } from "@/lib/residentes-store";
import {
  CATEGORIAS_PROC,
  DESTINOS_PROC,
  DESFECHOS,
  adicionarProcedimento,
  removerProcedimento,
  rotuloCompetencia,
  rotuloDesfecho,
  useProcedimentos,
  type Desfecho,
} from "@/lib/procedimentos-store";
import { BLOCOS, calcularIndicadores } from "@/lib/indicadores";

export const Route = createFileRoute("/indicadores")({
  component: Page,
  head: () => ({
    meta: [
      { title: "Indicadores e Produção — Lar da Fraternidade Cristã" },
      {
        name: "description",
        content:
          "Planilha de produção assistencial e indicadores de saúde para prestação de contas do convênio.",
      },
      { property: "og:title", content: "Indicadores e Produção assistencial" },
      {
        property: "og:description",
        content: "Registro de procedimentos e indicadores mensais do Lar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const hojeIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const NAVY = [16, 42, 79] as [number, number, number];
const AZUL = [30, 96, 168] as [number, number, number];

function Page() {
  const { itens, carregando } = useProcedimentos();
  const { salvos, nomePor } = useAllResidentes();

  const [mes, setMes] = useState(() => hojeIso().slice(0, 7));
  const [aberto, setAberto] = useState(false);

  const [form, setForm] = useState({
    data: hojeIso(),
    hora: "",
    residenteId: "",
    categoria: CATEGORIAS_PROC[0] as string,
    descricao: "",
    desfecho: "resolvido_local" as Desfecho,
    destino: "",
    profissional: "",
    observacoes: "",
  });

  const doMes = useMemo(() => itens.filter((i) => i.data.slice(0, 7) === mes), [itens, mes]);

  const meses = useMemo(() => {
    const set = new Set(itens.map((i) => i.data.slice(0, 7)));
    set.add(hojeIso().slice(0, 7));
    set.add(mes);
    return [...set].sort().reverse();
  }, [itens, mes]);

  const diasNoMes = useMemo(() => {
    const [a, m] = mes.split("-").map(Number);
    return new Date(a, m, 0).getDate();
  }, [mes]);

  const indicadores = useMemo(
    () =>
      calcularIndicadores(
        doMes,
        salvos.length,
        diasNoMes,
        salvos.map((r) => r.dependencia),
      ),
    [doMes, salvos, diasNoMes],
  );

  async function salvar() {
    if (!form.categoria) {
      toast.error("Escolha o tipo de atendimento.");
      return;
    }
    const ok = await adicionarProcedimento({
      data: form.data,
      hora: form.hora,
      residenteId: form.residenteId || undefined,
      categoria: form.categoria,
      descricao: form.descricao,
      desfecho: form.desfecho,
      destino: form.destino,
      profissional: form.profissional,
      observacoes: form.observacoes,
      valores: {},
    });
    if (!ok) {
      toast.error("Não consegui salvar. Tente novamente.");
      return;
    }
    toast.success("Registro lançado.");
    setAberto(false);
    setForm((f) => ({
      ...f,
      hora: "",
      residenteId: "",
      descricao: "",
      destino: "",
      observacoes: "",
    }));
  }

  function baixarRelatorio() {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const larg = doc.internal.pageSize.getWidth();

    doc.setFillColor(...NAVY);
    doc.rect(0, 0, larg, 74, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text("Relatório de Produção e Indicadores de Saúde", 40, 32);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Lar da Fraternidade Cristã — Residência Inclusiva", 40, 50);
    doc.text(
      `Competência: ${rotuloCompetencia(mes)}  |  Residentes: ${salvos.length}`,
      40,
      64,
    );

    let y = 96;
    for (const bloco of BLOCOS) {
      const linhas = indicadores
        .filter((i) => i.bloco === bloco.id)
        .map((i) => [i.nome, i.valor, i.formula, i.fonte]);
      if (!linhas.length) continue;
      doc.setTextColor(...NAVY);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(bloco.titulo, 40, y);
      autoTable(doc, {
        startY: y + 8,
        head: [["Indicador", "Resultado", "Como é calculado", "Referência"]],
        body: linhas,
        theme: "grid",
        styles: { font: "helvetica", fontSize: 8, cellPadding: 5, textColor: [40, 40, 40] },
        headStyles: { fillColor: AZUL, textColor: 255, fontStyle: "bold", fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 130, fontStyle: "bold" },
          1: { cellWidth: 80 },
          2: { cellWidth: 145 },
        },
        margin: { left: 40, right: 40 },
      });
      // @ts-expect-error lastAutoTable é injetado pelo plugin
      y = (doc.lastAutoTable?.finalY ?? y) + 24;
      if (y > 700) {
        doc.addPage();
        y = 60;
      }
    }

    doc.addPage();
    doc.setTextColor(...NAVY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(`Registros detalhados — ${rotuloCompetencia(mes)}`, 40, 50);
    autoTable(doc, {
      startY: 62,
      head: [["Data", "Residente", "Atendimento", "Desfecho", "Destino", "Descrição"]],
      body: doMes
        .slice()
        .sort((a, b) => a.data.localeCompare(b.data))
        .map((p) => [
          fmtIsoBR(p.data),
          p.residenteId ? nomePor(p.residenteId) : "—",
          p.categoria,
          rotuloDesfecho(p.desfecho),
          p.destino || "—",
          p.descricao || "—",
        ]),
      theme: "grid",
      styles: { font: "helvetica", fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: AZUL, textColor: 255, fontStyle: "bold" },
      margin: { left: 40, right: 40 },
    });

    doc.save(`indicadores-${mes}.pdf`);
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Indicadores e Produção"
        description="Planilhe os atendimentos do dia a dia e gere o relatório mensal para a Prefeitura."
      />

      <div className="flex flex-wrap items-end gap-3">
        <div className="w-48">
          <Label className="text-xs">Competência (mês)</Label>
          <Select value={mes} onValueChange={setMes}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {meses.map((m) => (
                <SelectItem key={m} value={m}>
                  {rotuloCompetencia(m)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setAberto(true)}>
          <Plus className="mr-2 h-4 w-4" /> Lançar atendimento
        </Button>
        <Button variant="outline" onClick={baixarRelatorio}>
          <Download className="mr-2 h-4 w-4" /> Baixar relatório em PDF
        </Button>
      </div>

      <Tabs defaultValue="indicadores">
        <TabsList>
          <TabsTrigger value="indicadores">Indicadores do mês</TabsTrigger>
          <TabsTrigger value="registros">Planilha de registros ({doMes.length})</TabsTrigger>
          <TabsTrigger value="guia">O que a Prefeitura pede</TabsTrigger>
        </TabsList>

        <TabsContent value="indicadores" className="space-y-6 pt-4">
          {BLOCOS.map((b) => (
            <div key={b.id} className="space-y-3">
              <div>
                <h3 className="text-base font-semibold">{b.titulo}</h3>
                <p className="text-sm text-muted-foreground">{b.descricao}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {indicadores
                  .filter((i) => i.bloco === b.id)
                  .map((i) => (
                    <Card key={i.chave}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium leading-snug">
                          {i.nome}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-1">
                        <div className="text-2xl font-semibold text-primary">{i.valor}</div>
                        <p className="text-xs text-muted-foreground">{i.detalhe}</p>
                        <p className="pt-1 text-[11px] text-muted-foreground">
                          <span className="font-medium">Cálculo:</span> {i.formula}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          <span className="font-medium">Base:</span> {i.fonte}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="registros" className="pt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Residente</TableHead>
                    <TableHead>Atendimento</TableHead>
                    <TableHead>Desfecho</TableHead>
                    <TableHead>Destino</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {carregando && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  )}
                  {!carregando && doMes.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                        Nenhum registro neste mês. Clique em "Lançar atendimento".
                      </TableCell>
                    </TableRow>
                  )}
                  {doMes.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="whitespace-nowrap">
                        {fmtIsoBR(p.data)}
                        {p.hora ? ` ${p.hora}` : ""}
                      </TableCell>
                      <TableCell>{p.residenteId ? nomePor(p.residenteId) : "—"}</TableCell>
                      <TableCell className="font-medium">{p.categoria}</TableCell>
                      <TableCell>
                        <Badge
                          variant={p.desfecho === "encaminhado" ? "outline" : "secondary"}
                        >
                          {rotuloDesfecho(p.desfecho)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{p.destino || "—"}</TableCell>
                      <TableCell className="max-w-[260px] text-sm text-muted-foreground">
                        {p.descricao || "—"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={async () => {
                            await removerProcedimento(p.id);
                            toast.success("Registro removido.");
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guia" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4" /> Por que estes indicadores
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Convênios com a Prefeitura costumam exigir três coisas: <b>produção</b> (o que
                foi feito), <b>resolutividade</b> (o que o serviço resolveu sem sobrecarregar a
                rede) e <b>segurança do paciente</b> (eventos adversos monitorados). Os
                indicadores desta página cobrem os três.
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  <b>RDC ANVISA 502/2021</b> — exige registro de intercorrências, cuidados e
                  atenção à saúde das residentes na ILPI.
                </li>
                <li>
                  <b>Programa Nacional de Segurança do Paciente</b> (Portaria GM/MS 529/2013 e
                  RDC 36/2013) — monitoramento de quedas, lesão por pressão e incidentes com
                  medicamentos.
                </li>
                <li>
                  <b>PNAB — Portaria GM/MS 2.436/2017</b> — produção assistencial,
                  resolutividade e coordenação do cuidado com a UBS de referência.
                </li>
                <li>
                  <b>Resolução COFEN 358/2009</b> — a consulta de enfermagem é ato privativo do
                  enfermeiro e deve ser registrada; é o que comprova o trabalho técnico.
                </li>
                <li>
                  <b>SIGTAP / e-SUS APS</b> — curativos, injetáveis, coletas e aferições têm
                  código de procedimento; contá-los dá valor mensurável ao serviço.
                </li>
              </ul>
              <p>
                Dica prática: lance os atendimentos no dia a dia e, no fim do mês, gere o PDF —
                ele já sai com o cálculo e a referência normativa de cada indicador.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Lançar atendimento</DialogTitle>
            <DialogDescription>
              Registre o que foi feito. Isso alimenta os indicadores do mês.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Data</Label>
                <Input
                  type="date"
                  value={form.data}
                  onChange={(e) => setForm({ ...form, data: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">Hora (opcional)</Label>
                <Input
                  type="time"
                  value={form.hora}
                  onChange={(e) => setForm({ ...form, hora: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Residente (opcional)</Label>
              <Select
                value={form.residenteId || "nenhuma"}
                onValueChange={(v) =>
                  setForm({ ...form, residenteId: v === "nenhuma" ? "" : v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nenhuma">Não se aplica / coletivo</SelectItem>
                  {salvos.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {nomePor(r.id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Tipo de atendimento</Label>
              <Select
                value={form.categoria}
                onValueChange={(v) => setForm({ ...form, categoria: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS_PROC.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Descrição (o que foi feito)</Label>
              <Input
                value={form.descricao}
                placeholder="Ex.: curativo em MID, lesão em cicatrização"
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Desfecho</Label>
                <Select
                  value={form.desfecho}
                  onValueChange={(v) => setForm({ ...form, desfecho: v as Desfecho })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DESFECHOS.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Encaminhado para</Label>
                <Select
                  value={form.destino || "nenhum"}
                  onValueChange={(v) => setForm({ ...form, destino: v === "nenhum" ? "" : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nenhum">Não encaminhou</SelectItem>
                    {DESTINOS_PROC.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Profissional responsável</Label>
              <Input
                value={form.profissional}
                onChange={(e) => setForm({ ...form, profissional: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs">Observações</Label>
              <Textarea
                rows={2}
                value={form.observacoes}
                onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={salvar}>Salvar registro</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}