import { createFileRoute } from "@tanstack/react-router";
import { formatNome } from "@/lib/format-nome";
import { useMemo, useState } from "react";
import { CalendarPlus, Trash2, Check, Brain, Pencil, FileCheck2, PackageCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  adicionarAgendamento,
  useAgendamentos,
  marcarRealizado,
  removerAgendamento,
  atualizarAgendamento,
  STATUS_AGENDAMENTO,
  type Agendamento,
  type StatusAgendamento,
  type TipoAgendamento,
} from "@/lib/agendamentos-store";
import { useAllResidentes } from "@/lib/residentes-store";
import { diasAte } from "@/lib/mock-data";
import { fmtIsoBR } from "@/lib/date-utils";

export const Route = createFileRoute("/agendamentos")({
  component: AgendamentosPage,
});

const ESPECIALIDADES = [
  "Psiquiatria",
  "Clínica geral",
  "Cardiologia",
  "Neurologia",
  "Ginecologia",
  "Oftalmologia",
  "Outros",
];

type FormState = {
  residenteId: string;
  tipo: TipoAgendamento;
  especialidade: string;
  descricao: string;
  data: string;
  hora: string;
  local: string;
  medico: string;
  motivo: string;
  observacoes: string;
  status: StatusAgendamento;
};

const emptyForm: FormState = {
  residenteId: "",
  tipo: "Consulta",
  especialidade: "Psiquiatria",
  descricao: "",
  data: "",
  hora: "",
  local: "",
  medico: "",
  motivo: "",
  observacoes: "",
  status: "Agendada",
};

function statusVariant(s: StatusAgendamento) {
  if (s === "Aguardando vaga") return "outline" as const;
  if (s === "Realizada") return "secondary" as const;
  if (s === "Cancelada/Faltou") return "destructive" as const;
  return "default" as const;
}

function AgendamentosPage() {
  const { todos, nomePor } = useAllResidentes();
  const { itens } = useAgendamentos();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  // Diálogo de "dar baixa" no agendamento (marca como realizada e, se for
  // exame, permite registrar a data prevista para retirar o resultado).
  const [baixaId, setBaixaId] = useState<string | null>(null);
  const [baixaForm, setBaixaForm] = useState({
    realizada: "sim" as "sim" | "nao",
    realizadoEm: "",
    resultadoData: "",
    observacoes: "",
  });

  function abrirBaixa(a: Agendamento) {
    setBaixaId(a.id);
    setBaixaForm({
      realizada: a.status === "Cancelada/Faltou" ? "nao" : "sim",
      realizadoEm:
        a.realizadoEm || a.data || new Date().toISOString().slice(0, 10),
      resultadoData: a.resultadoData || "",
      observacoes: a.observacoes || "",
    });
  }

  async function confirmarBaixa() {
    if (!baixaId) return;
    try {
      if (baixaForm.realizada === "sim") {
        await atualizarAgendamento(baixaId, {
          status: "Realizada",
          realizado: true,
          realizadoEm: baixaForm.realizadoEm || undefined,
          resultadoData: baixaForm.resultadoData || undefined,
          observacoes: baixaForm.observacoes,
        });
        toast.success(
          baixaForm.resultadoData
            ? "Baixa registrada. Você será avisada na data do resultado."
            : "Baixa registrada.",
        );
      } else {
        await atualizarAgendamento(baixaId, {
          status: "Cancelada/Faltou",
          realizado: false,
          realizadoEm: baixaForm.realizadoEm || undefined,
          observacoes: baixaForm.observacoes,
        });
        toast.success("Registrado como não realizada.");
      }
      setBaixaId(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao salvar.";
      toast.error(msg);
    }
  }

  async function marcarResultadoRetirado(a: Agendamento) {
    try {
      await atualizarAgendamento(a.id, {
        resultadoRetirado: true,
        resultadoRetiradoEm: new Date().toISOString().slice(0, 10),
      });
      toast.success("Resultado marcado como retirado.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao salvar.";
      toast.error(msg);
    }
  }

  function abrirNovo() {
    setEditId(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function abrirEditar(a: Agendamento) {
    setEditId(a.id);
    setForm({
      residenteId: a.residenteId,
      tipo: a.tipo,
      especialidade: a.especialidade || "Psiquiatria",
      descricao: a.descricao,
      data: a.data || "",
      hora: a.hora || "",
      local: a.local || "",
      medico: a.medico || "",
      motivo: a.motivo || "",
      observacoes: a.observacoes || "",
      status: a.status,
    });
    setOpen(true);
  }

  async function salvar() {
    if (!form.residenteId || !form.descricao) {
      toast.error("Preencha residente e descrição.");
      return;
    }
    if (form.status !== "Aguardando vaga" && !form.data) {
      toast.error("Informe a data (ou marque como 'Aguardando vaga').");
      return;
    }
    const dados = {
      ...form,
      data: form.data || new Date().toISOString().slice(0, 10),
    };
    try {
      if (editId) {
        await atualizarAgendamento(editId, dados);
        toast.success("Agendamento atualizado.");
      } else {
        await adicionarAgendamento(dados);
        toast.success("Agendamento criado.");
      }
      setOpen(false);
      setEditId(null);
      setForm(emptyForm);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao salvar.";
      toast.error(`Não foi possível salvar: ${msg}`);
    }
  }

  const aguardandoSus = itens.filter((a) => a.status === "Aguardando vaga");
  const pendentes = itens.filter(
    (a) =>
      a.status !== "Aguardando vaga" &&
      a.status !== "Realizada" &&
      a.status !== "Cancelada/Faltou",
  );
  const finalizadas = itens.filter(
    (a) => a.status === "Realizada" || a.status === "Cancelada/Faltou",
  );
  const ordenados = [...pendentes].sort(
    (a, b) => new Date(a.data).getTime() - new Date(b.data).getTime(),
  );
  const ordenadasFinalizadas = [...finalizadas].sort((a, b) => {
    const da = a.realizadoEm || a.data;
    const db = b.realizadoEm || b.data;
    return new Date(db).getTime() - new Date(da).getTime();
  });

  const ultimasPsiquiatria = useMemo(() => {
    const ePsi = (a: Agendamento) =>
      `${a.especialidade || ""} ${a.descricao || ""}`
        .toLowerCase()
        .includes("psiq");
    const map = new Map<string, Agendamento>();
    for (const a of itens) {
      if (!ePsi(a) || a.status !== "Realizada") continue;
      const atual = map.get(a.residenteId);
      if (!atual || new Date(a.data).getTime() > new Date(atual.data).getTime())
        map.set(a.residenteId, a);
    }
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime(),
    );
  }, [itens]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Consultas e Exames</h1>
          <p className="text-muted-foreground">
            Agende, acompanhe a fila do SUS e registre o resumo das consultas.
          </p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) {
              setEditId(null);
              setForm(emptyForm);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={abrirNovo}>
              <CalendarPlus className="mr-2 h-4 w-4" />
              Novo agendamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editId ? "Editar agendamento" : "Novo agendamento"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-3">
              <div className="grid gap-1">
                <Label>Residente</Label>
                <Select
                  value={form.residenteId}
                  onValueChange={(v) => setForm({ ...form, residenteId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o residente" />
                  </SelectTrigger>
                  <SelectContent>
                    {todos.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {formatNome(r.nome)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1">
                  <Label>Tipo</Label>
                  <Select
                    value={form.tipo}
                    onValueChange={(v) =>
                      setForm({ ...form, tipo: v as TipoAgendamento })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Consulta">Consulta</SelectItem>
                      <SelectItem value="Exame">Exame</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1">
                  <Label>Especialidade</Label>
                  <Select
                    value={form.especialidade}
                    onValueChange={(v) => setForm({ ...form, especialidade: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ESPECIALIDADES.map((e) => (
                        <SelectItem key={e} value={e}>
                          {e}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-1">
                <Label>Descrição</Label>
                <Input
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  placeholder="Ex.: Consulta de retorno, Hemograma"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1">
                  <Label>Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) =>
                      setForm({ ...form, status: v as StatusAgendamento })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_AGENDAMENTO.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1">
                  <Label>
                    Data{" "}
                    {form.status === "Aguardando vaga" && (
                      <span className="text-xs text-muted-foreground">(opcional)</span>
                    )}
                  </Label>
                  <Input
                    type="date"
                    value={form.data}
                    onChange={(e) => setForm({ ...form, data: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1">
                  <Label>Hora</Label>
                  <Input
                    type="time"
                    value={form.hora}
                    onChange={(e) => setForm({ ...form, hora: e.target.value })}
                  />
                </div>
                <div className="grid gap-1">
                  <Label>Local</Label>
                  <Input
                    value={form.local}
                    onChange={(e) => setForm({ ...form, local: e.target.value })}
                    placeholder="UBS, Policlínica, Hospital..."
                  />
                </div>
              </div>
              <div className="grid gap-1">
                <Label>Médico</Label>
                <Input
                  value={form.medico}
                  onChange={(e) => setForm({ ...form, medico: e.target.value })}
                  placeholder="Nome do(a) médico(a)"
                />
              </div>
              <div className="grid gap-1">
                <Label>Motivo do pedido</Label>
                <Textarea
                  value={form.motivo}
                  onChange={(e) => setForm({ ...form, motivo: e.target.value })}
                  placeholder="Ex.: paciente se encontra depressiva; consulta de rotina e renovação de receita..."
                />
              </div>
              <div className="grid gap-1">
                <Label>Observações / Resumo da consulta</Label>
                <Textarea
                  value={form.observacoes}
                  onChange={(e) =>
                    setForm({ ...form, observacoes: e.target.value })
                  }
                  placeholder="O que foi relatado/conduzido na consulta (preencher após realizada)."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={salvar}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {aguardandoSus.length > 0 && (
        <Card className="border-amber-300/60 bg-amber-50/40 dark:bg-amber-950/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              Aguardando vaga no SUS ({aguardandoSus.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Residente</TableHead>
                  <TableHead>Especialidade</TableHead>
                  <TableHead>Motivo do pedido</TableHead>
                  <TableHead>Pedido em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aguardandoSus.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{nomePor(a.residenteId)}</TableCell>
                    <TableCell>{a.especialidade || "—"}</TableCell>
                    <TableCell className="max-w-sm">
                      <div className="font-medium">{a.descricao}</div>
                      {a.motivo && (
                        <div className="text-xs text-muted-foreground">
                          {a.motivo}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{fmtIsoBR(a.criadoEm.slice(0, 10))}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Editar"
                        onClick={() => abrirEditar(a)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Excluir"
                        onClick={() => removerAgendamento(a.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="proximos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="proximos">
            Próximos ({ordenados.length})
          </TabsTrigger>
          <TabsTrigger value="realizadas">
            Já realizadas ({ordenadasFinalizadas.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="proximos">
          <Card>
            <CardHeader>
              <CardTitle>Próximos agendamentos</CardTitle>
            </CardHeader>
            <CardContent>
              {ordenados.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum agendamento pendente.
                </p>
              ) : (
                <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Residente</TableHead>
                  <TableHead>Especialidade</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordenados.map((a) => {
                  const dias = diasAte(a.data);
                  const dataTxt = fmtIsoBR(a.data);
                  const sub =
                    a.status === "Realizada"
                      ? `${a.status}`
                      : a.status === "Cancelada/Faltou"
                        ? a.status
                        : dias < 0
                          ? `Atrasado ${Math.abs(dias)}d`
                          : `Em ${dias}d`;
                  return (
                    <TableRow key={a.id}>
                      <TableCell>{nomePor(a.residenteId)}</TableCell>
                      <TableCell>{a.especialidade || "—"}</TableCell>
                      <TableCell className="max-w-sm">
                        <div className="font-medium">{a.descricao}</div>
                        {a.medico && (
                          <div className="text-xs text-muted-foreground">
                            {a.medico}
                          </div>
                        )}
                        {a.motivo && (
                          <div className="text-xs text-muted-foreground">
                            Motivo: {a.motivo}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {dataTxt}
                        {a.hora && (
                          <span className="text-muted-foreground"> {a.hora}</span>
                        )}
                      </TableCell>
                      <TableCell>{a.local || "—"}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant={statusVariant(a.status)}>
                            {a.status}
                          </Badge>
                          {a.status !== "Realizada" &&
                            a.status !== "Cancelada/Faltou" && (
                              <span className="text-xs text-muted-foreground">
                                {sub}
                              </span>
                            )}
                          {a.realizado && a.resultadoData && (
                            <span
                              className={
                                a.resultadoRetirado
                                  ? "text-xs text-muted-foreground"
                                  : diasAte(a.resultadoData) <= 2
                                    ? "text-xs font-medium text-destructive"
                                    : "text-xs text-amber-700 dark:text-amber-400"
                              }
                            >
                              {a.resultadoRetirado
                                ? `Resultado retirado${a.resultadoRetiradoEm ? ` em ${fmtIsoBR(a.resultadoRetiradoEm)}` : ""}`
                                : `Resultado em ${fmtIsoBR(a.resultadoData)}${
                                    diasAte(a.resultadoData) < 0
                                      ? ` (atrasado ${Math.abs(diasAte(a.resultadoData))}d)`
                                      : diasAte(a.resultadoData) === 0
                                        ? " (hoje)"
                                        : ` (em ${diasAte(a.resultadoData)}d)`
                                  }`}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Editar"
                          onClick={() => abrirEditar(a)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title={
                            a.realizado ? "Desmarcar" : "Marcar como realizada"
                          }
                          onClick={() => {
                            if (a.realizado) {
                              marcarRealizado(a.id, false);
                            } else {
                              abrirBaixa(a);
                            }
                          }}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        {a.realizado &&
                          a.resultadoData &&
                          !a.resultadoRetirado && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Marcar resultado como retirado"
                              onClick={() => marcarResultadoRetirado(a)}
                            >
                              <PackageCheck className="h-4 w-4" />
                            </Button>
                          )}
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Excluir"
                          onClick={() => removerAgendamento(a.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="realizadas">
          <Card>
            <CardHeader>
              <CardTitle>Já realizadas</CardTitle>
            </CardHeader>
            <CardContent>
              {ordenadasFinalizadas.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum agendamento finalizado ainda.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Residente</TableHead>
                      <TableHead>Especialidade</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Realizada em</TableHead>
                      <TableHead>Local</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ordenadasFinalizadas.map((a) => {
                      const dataFeita = a.realizadoEm || a.data;
                      return (
                        <TableRow key={a.id}>
                          <TableCell>{nomePor(a.residenteId)}</TableCell>
                          <TableCell>{a.especialidade || "—"}</TableCell>
                          <TableCell className="max-w-sm">
                            <div className="font-medium">{a.descricao}</div>
                            {a.medico && (
                              <div className="text-xs text-muted-foreground">
                                {a.medico}
                              </div>
                            )}
                            {a.observacoes && (
                              <div className="text-xs text-muted-foreground whitespace-pre-wrap">
                                {a.observacoes}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {dataFeita ? fmtIsoBR(dataFeita) : "—"}
                            {a.realizadoEm && a.realizadoEm !== a.data && (
                              <div className="text-xs text-muted-foreground">
                                agendada: {fmtIsoBR(a.data)}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>{a.local || "—"}</TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <Badge variant={statusVariant(a.status)}>
                                {a.status}
                              </Badge>
                              {a.realizado && a.resultadoData && (
                                <span
                                  className={
                                    a.resultadoRetirado
                                      ? "text-xs text-muted-foreground"
                                      : diasAte(a.resultadoData) <= 2
                                        ? "text-xs font-medium text-destructive"
                                        : "text-xs text-amber-700 dark:text-amber-400"
                                  }
                                >
                                  {a.resultadoRetirado
                                    ? `Resultado retirado${a.resultadoRetiradoEm ? ` em ${fmtIsoBR(a.resultadoRetiradoEm)}` : ""}`
                                    : `Resultado em ${fmtIsoBR(a.resultadoData)}`}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Editar"
                              onClick={() => abrirEditar(a)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {a.realizado &&
                              a.resultadoData &&
                              !a.resultadoRetirado && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Marcar resultado como retirado"
                                  onClick={() => marcarResultadoRetirado(a)}
                                >
                                  <PackageCheck className="h-4 w-4" />
                                </Button>
                              )}
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Reabrir (voltar para pendentes)"
                              onClick={() =>
                                atualizarAgendamento(a.id, {
                                  status: "Agendada",
                                  realizado: false,
                                  realizadoEm: undefined,
                                })
                              }
                            >
                              <Check className="h-4 w-4 rotate-180" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Excluir"
                              onClick={() => removerAgendamento(a.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" /> Última consulta psiquiátrica por residente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ultimasPsiquiatria.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma consulta de psiquiatria marcada como realizada ainda.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Residente</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Psiquiatra</TableHead>
                  <TableHead>Resumo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ultimasPsiquiatria.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">
                      {nomePor(a.residenteId)}
                    </TableCell>
                    <TableCell>{fmtIsoBR(a.data)}</TableCell>
                    <TableCell>{a.medico || "—"}</TableCell>
                    <TableCell className="max-w-md whitespace-pre-wrap text-sm text-muted-foreground">
                      {a.observacoes || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Editar / atualizar resumo"
                        onClick={() => abrirEditar(a)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={baixaId !== null}
        onOpenChange={(v) => {
          if (!v) setBaixaId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck2 className="h-4 w-4 text-primary" /> Dar baixa no agendamento
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1">
              <Label>Foi realizada?</Label>
              <Select
                value={baixaForm.realizada}
                onValueChange={(v) =>
                  setBaixaForm({ ...baixaForm, realizada: v as "sim" | "nao" })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sim">Sim, foi realizada</SelectItem>
                  <SelectItem value="nao">Não (cancelada / faltou)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1">
              <Label>
                {baixaForm.realizada === "sim"
                  ? "Data em que foi realizada"
                  : "Data (cancelamento / falta)"}
              </Label>
              <Input
                type="date"
                value={baixaForm.realizadoEm}
                onChange={(e) =>
                  setBaixaForm({ ...baixaForm, realizadoEm: e.target.value })
                }
              />
            </div>
            {baixaForm.realizada === "sim" && (
            <div className="grid gap-1">
              <Label>
                Data prevista para o resultado{" "}
                <span className="text-xs text-muted-foreground">
                  (deixe em branco se for consulta sem resultado)
                </span>
              </Label>
              <Input
                type="date"
                value={baixaForm.resultadoData}
                onChange={(e) =>
                  setBaixaForm({ ...baixaForm, resultadoData: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                O sistema vai te avisar no dashboard 2 dias antes dessa data.
              </p>
            </div>
            )}
            <div className="grid gap-1">
              <Label>Observações / resumo</Label>
              <Textarea
                value={baixaForm.observacoes}
                onChange={(e) =>
                  setBaixaForm({ ...baixaForm, observacoes: e.target.value })
                }
                placeholder="O que foi conduzido, quais exames pedidos, etc."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setBaixaId(null)}>
              Cancelar
            </Button>
            <Button onClick={confirmarBaixa}>Confirmar baixa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}