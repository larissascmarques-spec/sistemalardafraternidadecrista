import { useReceitas } from "@/lib/receitas-cloud";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { UserPlus, Pencil, Trash2 } from "lucide-react";
import {
  FichaResidenteDialog,
  sincronizarFichaResidenteLocal,
} from "@/components/FichaResidenteDialog";
import { FichaHistoriaPregressaDialog } from "@/components/FichaHistoriaPregressaDialog";
import { FichaChecagemDialog } from "@/components/FichaChecagemDialog";
import {
  novoIdResidente,
  useAllResidentes,
  type ResidenteSalvo,
} from "@/lib/residentes-store";
import { useLocalStorage } from "@/hooks/use-local-storage";
import {
  RECEITAS_STORAGE_KEY,
  RECEITAS_ARQUIVO_KEY,
  type ReceitaSalva,
} from "@/lib/receitas-store";
import { diasAte } from "@/lib/mock-data";
import { formatMedNome } from "@/lib/format-med";
import { chaveFarmaco } from "@/lib/farmacologia-db";
import { medsEmUsoDaResidente } from "@/lib/meds-em-uso";
import { detectarInconsistencias } from "@/lib/inconsistencias";
import { addDaysIso, fmtIsoBR, parseIsoLocal } from "@/lib/date-utils";
import { useEstoque } from "@/lib/estoque-store";
import {
  statusResidente,
  iniciaisDe,
  diasPorMedicacaoDaResidente,
} from "@/lib/status-residente";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/residentes")({
  head: () => ({
    meta: [
      { title: "Residentes — Lar da Fraternidade Cristã" },
      { name: "description", content: "Cadastro e prontuários das residentes do Lar da Fraternidade Cristã." },
      { property: "og:title", content: "Residentes — Lar da Fraternidade Cristã" },
      { property: "og:description", content: "Cadastro e prontuários das residentes do Lar da Fraternidade Cristã." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

function idade(nasc: string) {
  const d = new Date(nasc);
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

function tempoInstitucionalizacao(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso + "T12:00:00");
  if (isNaN(d.getTime())) return null;
  const dias = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (dias < 0) return null;
  if (dias < 30) return `${dias} dia${dias === 1 ? "" : "s"}`;
  const meses = Math.floor(dias / 30);
  if (meses < 12) return `${meses} ${meses === 1 ? "mês" : "meses"}`;
  const anos = Math.floor(meses / 12);
  const mesesRest = meses % 12;
  return mesesRest > 0 ? `${anos}a ${mesesRest}m` : `${anos} ano${anos === 1 ? "" : "s"}`;
}

import { formatNome as titulo } from "@/lib/format-nome";

function Page() {
  const { salvos, setSalvos, todos } = useAllResidentes();
  const [receitas, setReceitas] = useReceitas(RECEITAS_STORAGE_KEY, []);
  const [arquivo, setArquivo] = useReceitas(RECEITAS_ARQUIVO_KEY, []);
  const { itens: estoque } = useEstoque();
  const navigate = useNavigate();
  const [editando, setEditando] = useState<ResidenteSalvo | null>(null);
  const [criando, setCriando] = useState(false);
  const [inconsAberto, setInconsAberto] = useState<{
    nome: string;
    itens: ReturnType<typeof detectarInconsistencias>;
  } | null>(null);

  function excluirResidente(id: string) {
    const daResidente = receitas.filter((r) => r.residenteId === id);
    if (daResidente.length > 0) {
      const agora = new Date().toISOString();
      setArquivo([
        ...arquivo,
        ...daResidente.map((r) => ({
          ...r,
          arquivadaEm: agora,
          motivoArquivamento: "manual" as const,
        })),
      ]);
      setReceitas(receitas.filter((r) => r.residenteId !== id));
    }
    setSalvos(salvos.filter((s) => s.id !== id));
    toast.success(
      daResidente.length > 0
        ? `Residente excluída. ${daResidente.length} receita(s) movida(s) para o Arquivo.`
        : "Residente excluída.",
    );
  }

  function medsDe(residenteId: string) {
    const manual =
      (salvos.find((s) => s.id === residenteId)?.medicacoesUso ?? []).filter(Boolean);
    return medsEmUsoDaResidente(receitas, residenteId, manual);
  }

  function salvarEdicao(r: ResidenteSalvo) {
    const existe = salvos.some((s) => s.id === r.id);
    if (existe) {
      setSalvos(salvos.map((s) => (s.id === r.id ? r : s)));
    } else {
      setSalvos([...salvos, r]);
    }
    sincronizarFichaResidenteLocal(r);
    toast.success("Residente salvo.");
    setEditando(null);
    setCriando(false);
  }

  function marcarHaldolFeito(r: ResidenteSalvo) {
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
    salvarEdicao(atualizado);
    toast.success(`Aplicação registrada. Próxima dose: ${fmtIsoBR(proxima)}`);
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Residentes"
        description="Residentes cadastrados manualmente ou a partir das receitas importadas. Clique em 'a revisar' ou no lápis para completar os dados."
        actions={
          <Button
            onClick={() => {
              setEditando({
                id: novoIdResidente(salvos),
                nome: "",
                dataNascimento: "",
                dataInstitucionalizacao: "",
                diagnosticos: [],
                alergias: [],
                responsavel: "",
                medico: "",
                ubs: "",
                aRevisar: false,
                criadoEm: new Date().toISOString(),
              });
              setCriando(true);
            }}
          >
            <UserPlus className="mr-2 h-4 w-4" /> Nova residente
          </Button>
        }
      />
      {todos.length === 0 && (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Nenhum residente ainda. Clique em <strong>Nova residente</strong> ou
            importe receitas em PDF para cadastrar automaticamente.
          </CardContent>
        </Card>
      )}
      <div className="grid gap-5 lg:grid-cols-2">
        {todos.map((r) => {
          const ehSalvo = salvos.some((s) => s.id === r.id);
          const aRevisar = (r as ResidenteSalvo).aRevisar;
          const receitasAtivas = receitas.filter(
            (rc) => rc.residenteId === r.id && diasAte(rc.vencimento) >= 0,
          );
          const status = statusResidente(receitasAtivas, estoque, r.id);
          const meds = medsDe(r.id);
          const barColor =
            status.tone === "destructive"
              ? "bg-rose-500"
              : status.tone === "warning"
                ? "bg-amber-500"
                : status.tone === "warning-soft"
                  ? "bg-amber-400"
                  : "bg-emerald-500";
          const chipBg =
            status.tone === "destructive"
              ? "bg-rose-50 text-rose-700 border-rose-100"
              : status.tone === "warning"
                ? "bg-amber-50 text-amber-700 border-amber-100"
                : status.tone === "warning-soft"
                  ? "bg-amber-50/70 text-amber-700 border-amber-100"
                  : "bg-emerald-50 text-emerald-700 border-emerald-100";
          const diasMeds = diasPorMedicacaoDaResidente(estoque, r.id);
          const menorEstoque = diasMeds.length > 0 ? Math.min(...diasMeds.map((m) => m.dias)) : null;
          const incons = ehSalvo
            ? detectarInconsistencias(r as ResidenteSalvo, receitas)
            : [];
          return (
          <div
            key={r.id}
            className="group relative flex overflow-hidden rounded-xl border border-border bg-card shadow-sm transition hover:shadow-md hover:border-primary/30"
          >
            <Link
              to="/residentes/$id"
              params={{ id: r.id }}
              aria-label={`Acessar prontuário de ${titulo(r.nome)}`}
              className="absolute inset-0 z-0"
            />
            <div className={`relative z-10 w-1.5 shrink-0 pointer-events-none ${barColor}`} />
            <div className="relative z-10 flex-1 space-y-4 p-5 pointer-events-none [&_a]:pointer-events-auto [&_button]:pointer-events-auto [&_[role=button]]:pointer-events-auto">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {iniciaisDe(r.nome)}
                  </div>
                  <div className="min-w-0">
                    <Link
                      to="/residentes/$id"
                      params={{ id: r.id }}
                      onClick={(e) => e.stopPropagation()}
                      className="line-clamp-2 break-words font-display text-sm font-semibold leading-tight text-foreground hover:text-primary"
                    >
                      {titulo(r.nome)}
                    </Link>
                    <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Pront: #{r.id}
                    </p>
                  </div>
                </div>
                <span
                  className={`shrink-0 whitespace-nowrap rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase ${chipBg}`}
                >
                  {status.label}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-[11px] text-muted-foreground">Idade</div>
                  <div className="font-semibold">
                    {r.dataNascimento ? `${idade(r.dataNascimento)} anos` : "—"}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-muted-foreground">Na casa</div>
                  <div className="font-semibold">
                    {tempoInstitucionalizacao(r.dataInstitucionalizacao) ?? "—"}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-muted/40 p-3">
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Medicações em uso</span>
                  <span className="font-bold text-primary">
                    {String(meds.length).padStart(2, "0")}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Receitas ativas</span>
                  <span className="font-bold text-foreground">
                    {String(receitasAtivas.length).padStart(2, "0")}
                    {menorEstoque !== null && menorEstoque <= 15 && (
                      <span className="ml-2 text-rose-600">• estoque {menorEstoque}d</span>
                    )}
                  </span>
                </div>
              </div>

              {incons.length > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setInconsAberto({ nome: titulo(r.nome), itens: incons });
                  }}
                  className="block w-full text-left rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-800 hover:bg-amber-100"
                >
                  ⚠ {incons.length} inconsistência{incons.length === 1 ? "" : "s"} — ver detalhes
                </button>
              )}

              {aRevisar && (
                <div
                  className="cursor-pointer rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    ehSalvo && setEditando(r as ResidenteSalvo);
                  }}
                >
                  ⚠ dados a revisar — clique para completar
                </div>
              )}

              {r.alertas && r.alertas.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {r.alertas.map((a) => (
                    <span
                      key={a}
                      className="rounded-md bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive"
                    >
                      ⚠ {a}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Link
                  to="/residentes/$id"
                  params={{ id: r.id }}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 rounded-lg border border-border py-2 text-center text-xs font-semibold text-primary transition hover:bg-primary/5"
                >
                  Acessar prontuário
                </Link>
                {ehSalvo && (
                  <div onClick={(e) => e.stopPropagation()}>
                    <FichaResidenteDialog
                      residente={r as ResidenteSalvo}
                      medsEmUso={meds}
                      onSaveResidente={(patch) => {
                        const alvo = salvos.find((s) => s.id === r.id);
                        if (!alvo) return;
                        salvarEdicao({ ...alvo, ...patch });
                      }}
                    />
                  </div>
                )}
                {ehSalvo && (
                  <div onClick={(e) => e.stopPropagation()}>
                    <FichaHistoriaPregressaDialog residente={r as ResidenteSalvo} />
                  </div>
                )}
                {ehSalvo && (
                  <div onClick={(e) => e.stopPropagation()}>
                    <FichaChecagemDialog
                      residente={r as ResidenteSalvo}
                      medsEmUso={meds.map((m) => m.nome)}
                    />
                  </div>
                )}
                {ehSalvo && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditando(r as ResidenteSalvo);
                    }}
                    aria-label="Editar"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
                {ehSalvo && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => e.stopPropagation()}
                        aria-label="Excluir"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir residente?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir <strong>{titulo(r.nome)}</strong>? Esta ação
                          remove a residente do sistema. As receitas e registros vinculados a ela
                          serão movidos para o Arquivo.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => excluirResidente(r.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Sim, excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          </div>
          );
        })}
      </div>

      <EditarResidenteDialog
        residente={editando}
        novo={criando}
        medsIniciais={editando ? medsDe(editando.id).map((m) => m.nome) : []}
        onClose={() => { setEditando(null); setCriando(false); }}
        onSave={salvarEdicao}
      />

      <Dialog open={!!inconsAberto} onOpenChange={(o) => !o && setInconsAberto(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Inconsistências — {inconsAberto?.nome}</DialogTitle>
            <DialogDescription>
              Confira cada item abaixo e ajuste no cadastro ou nas receitas.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {inconsAberto?.itens.map((i, idx) => (
              <div
                key={idx}
                className={`rounded-md border p-3 text-sm ${
                  i.nivel === "erro"
                    ? "border-rose-200 bg-rose-50 text-rose-800"
                    : "border-amber-200 bg-amber-50 text-amber-800"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <strong className="text-[13px]">{i.medicacao}</strong>
                  <span className="text-[10px] font-bold uppercase">
                    {i.nivel === "erro" ? "Erro" : "Alerta"}
                  </span>
                </div>
                <p className="mt-1 text-[12px] leading-snug">{i.mensagem}</p>
              </div>
            ))}
            {inconsAberto?.itens.length === 0 && (
              <p className="text-sm text-muted-foreground">Sem inconsistências.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInconsAberto(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type EditProps = {
  residente: ResidenteSalvo | null;
  novo: boolean;
  medsIniciais: string[];
  onClose: () => void;
  onSave: (r: ResidenteSalvo) => void;
};

function EditarResidenteDialog({ residente, novo, medsIniciais, onClose, onSave }: EditProps) {
  if (!residente) return null;
  return (
    <Dialog open={!!residente} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{novo ? "Nova residente" : "Editar residente"}</DialogTitle>
          <DialogDescription>
            Preencha os dados. Você pode salvar parcialmente e completar depois.
          </DialogDescription>
        </DialogHeader>
        <FormResidente residente={residente} medsIniciais={medsIniciais} onSave={onSave} onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
}

function FormResidente({
  residente,
  medsIniciais,
  onSave,
  onClose,
}: {
  residente: ResidenteSalvo;
  medsIniciais: string[];
  onSave: (r: ResidenteSalvo) => void;
  onClose: () => void;
}) {
  const [nome, setNome] = useState(residente.nome);
  const [dataNascimento, setDataNascimento] = useState(residente.dataNascimento);
  const [dataInstitucionalizacao, setDataInstitucionalizacao] = useState(
    residente.dataInstitucionalizacao ?? "",
  );
  const [cpf, setCpf] = useState(residente.cpf ?? "");
  const [sanitas, setSanitas] = useState(residente.sanitas ?? "");
  const [diagnosticos, setDiagnosticos] = useState(residente.diagnosticos.join(", "));
  const [alergias, setAlergias] = useState(residente.alergias.join(", "));
  // Pré-preenche com a lista completa em uso (manual + receitas), para que
  // a usuária edite tudo num lugar só sem duplicar.
  const [medicacoesUso, setMedicacoesUso] = useState(
    (medsIniciais.length > 0 ? medsIniciais : residente.medicacoesUso ?? []).join(", "),
  );
  const [responsavel, setResponsavel] = useState(residente.responsavel);
  const [medico, setMedico] = useState(residente.medico);
  const [ubs, setUbs] = useState(residente.ubs);
  const [observacoes, setObservacoes] = useState(residente.observacoes ?? "");
  const [dependencia, setDependencia] = useState<string>(residente.dependencia ?? "");
  const [mobilidade, setMobilidade] = useState<string>(residente.mobilidade ?? "");
  const [dieta, setDieta] = useState(residente.dieta ?? "");
  const [alertas, setAlertas] = useState((residente.alertas ?? []).join(", "));
  const [usaHaldol, setUsaHaldol] = useState(!!residente.haldolInjetavel);
  const [haldolPeriod, setHaldolPeriod] = useState<number>(
    residente.haldolInjetavel?.periodicidadeDias ?? 30,
  );
  const [haldolProxima, setHaldolProxima] = useState<string>(
    residente.haldolInjetavel?.proximaDose ?? "",
  );
  const [psiqMedico, setPsiqMedico] = useState(
    residente.acompanhamentoPsiquiatrico?.medico ?? "",
  );
  const [psiqLocal, setPsiqLocal] = useState(
    residente.acompanhamentoPsiquiatrico?.local ?? "",
  );
  const [psiqObs, setPsiqObs] = useState(
    residente.acompanhamentoPsiquiatrico?.observacoes ?? "",
  );
  const [psiqUltima, setPsiqUltima] = useState(
    residente.acompanhamentoPsiquiatrico?.ultimaConsulta ?? "",
  );
  const [psiqProxima, setPsiqProxima] = useState(
    residente.acompanhamentoPsiquiatrico?.proximaConsulta ?? "",
  );

  function submit() {
    if (!nome.trim()) {
      toast.error("Informe o nome.");
      return;
    }
    const split = (s: string) =>
      s.split(",").map((x) => x.trim()).filter(Boolean);
    const atualizado: ResidenteSalvo = {
      ...residente,
      nome: nome.trim(),
      dataNascimento,
      dataInstitucionalizacao: dataInstitucionalizacao || undefined,
      cpf: cpf.trim() || undefined,
      sanitas: sanitas.trim() || undefined,
      diagnosticos: split(diagnosticos),
      alergias: split(alergias),
      medicacoesUso: split(medicacoesUso),
      responsavel: responsavel.trim(),
      medico: medico.trim(),
      ubs: ubs.trim(),
      observacoes: observacoes.trim() || undefined,
      dependencia: (dependencia || undefined) as ResidenteSalvo["dependencia"],
      mobilidade: (mobilidade || undefined) as ResidenteSalvo["mobilidade"],
      dieta: dieta.trim() || undefined,
      alertas: split(alertas),
      haldolInjetavel: usaHaldol
        ? {
            periodicidadeDias: Number(haldolPeriod) || 30,
            proximaDose: haldolProxima,
            historico: residente.haldolInjetavel?.historico ?? [],
          }
        : undefined,
      acompanhamentoPsiquiatrico:
        psiqMedico.trim() || psiqLocal.trim() || psiqObs.trim() || psiqUltima || psiqProxima
          ? {
              medico: psiqMedico.trim() || undefined,
              local: psiqLocal.trim() || undefined,
              observacoes: psiqObs.trim() || undefined,
              ultimaConsulta: psiqUltima || undefined,
              proximaConsulta: psiqProxima || undefined,
            }
          : undefined,
      aRevisar: false,
    };
    onSave(atualizado);
  }

  return (
    <>
      <div className="grid gap-3">
        <div className="grid gap-1">
          <Label>Nome completo</Label>
          <Input value={nome} onChange={(e) => setNome(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1">
            <Label>Data de nascimento</Label>
            <Input type="date" value={dataNascimento} onChange={(e) => setDataNascimento(e.target.value)} />
          </div>
          <div className="grid gap-1">
            <Label>Data de institucionalização</Label>
            <Input
              type="date"
              value={dataInstitucionalizacao}
              onChange={(e) => setDataInstitucionalizacao(e.target.value)}
            />
          </div>
        </div>
        <div className="grid gap-1">
          <Label>Responsável</Label>
          <Input value={responsavel} onChange={(e) => setResponsavel(e.target.value)} />
        </div>
        <div className="grid gap-1">
          <Label>Comorbidades (separar por vírgula)</Label>
          <Input value={diagnosticos} onChange={(e) => setDiagnosticos(e.target.value)} placeholder="Ex.: HAS, DM2" />
        </div>
        <div className="grid gap-1">
          <Label>Alergias (separar por vírgula)</Label>
          <Input value={alergias} onChange={(e) => setAlergias(e.target.value)} placeholder="Ex.: Dipirona" />
        </div>
        <div className="grid gap-1">
          <Label>Medicações em uso (separar por vírgula)</Label>
          <Textarea
            rows={2}
            value={medicacoesUso}
            onChange={(e) => setMedicacoesUso(e.target.value)}
            placeholder="Ex.: Desvenlafaxina 50mg, Risperidona 2mg"
          />
          <p className="text-xs text-muted-foreground">
            Medicações vindas das receitas importadas aparecem automaticamente. Use este campo para acrescentar manualmente.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1">
            <Label>CPF</Label>
            <Input value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="000.000.000-00" />
          </div>
          <div className="grid gap-1">
            <Label>Cartão SANITAS</Label>
            <Input value={sanitas} onChange={(e) => setSanitas(e.target.value)} placeholder="Número do cartão" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1">
            <Label>Nível de dependência</Label>
            <Select value={dependencia} onValueChange={setDependencia}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="independente">Independente</SelectItem>
                <SelectItem value="parcial">Parcial</SelectItem>
                <SelectItem value="total">Total</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1">
            <Label>Mobilidade</Label>
            <Select value={mobilidade} onValueChange={setMobilidade}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="deambula">Deambula</SelectItem>
                <SelectItem value="cadeirante">Cadeirante</SelectItem>
                <SelectItem value="acamada">Acamada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid gap-1">
          <Label>Dieta / restrições alimentares</Label>
          <Input value={dieta} onChange={(e) => setDieta(e.target.value)} placeholder="Ex.: pastosa, hipossódica, sem lactose" />
        </div>
        <div className="grid gap-1">
          <Label>Alertas (separar por vírgula)</Label>
          <Input value={alertas} onChange={(e) => setAlertas(e.target.value)} placeholder="Ex.: risco de queda, fuga, agressividade" />
        </div>
        <div className="rounded-md border p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="usa-haldol"
              checked={usaHaldol}
              onCheckedChange={(v) => setUsaHaldol(v === true)}
            />
            <Label htmlFor="usa-haldol" className="cursor-pointer">
              Faz uso de Haldol injetável (decanoato)?
            </Label>
          </div>
          {usaHaldol && (
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1">
                <Label>Periodicidade (dias)</Label>
                <Select
                  value={String(haldolPeriod)}
                  onValueChange={(v) => setHaldolPeriod(Number(v))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="14">14 dias</SelectItem>
                    <SelectItem value="21">21 dias</SelectItem>
                    <SelectItem value="28">28 dias</SelectItem>
                    <SelectItem value="30">30 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1">
                <Label>Data da próxima dose</Label>
                <Input
                  type="date"
                  value={haldolProxima}
                  onChange={(e) => setHaldolProxima(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1">
            <Label>Médico</Label>
            <Input value={medico} onChange={(e) => setMedico(e.target.value)} />
          </div>
          <div className="grid gap-1">
            <Label>UBS / ESF</Label>
            <Input value={ubs} onChange={(e) => setUbs(e.target.value)} />
          </div>
        </div>
        <div className="rounded-md border p-3 space-y-2">
          <div className="text-sm font-medium">Acompanhamento psiquiátrico</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1">
              <Label>Médico psiquiatra</Label>
              <Input
                value={psiqMedico}
                onChange={(e) => setPsiqMedico(e.target.value)}
                placeholder="Ex.: Dr. João Silva"
              />
            </div>
            <div className="grid gap-1">
              <Label>Local de atendimento</Label>
              <Input
                value={psiqLocal}
                onChange={(e) => setPsiqLocal(e.target.value)}
                placeholder="Ex.: CAPS, policlínica, consultório"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1">
              <Label>Última consulta</Label>
              <Input
                type="datetime-local"
                value={psiqUltima}
                onChange={(e) => setPsiqUltima(e.target.value)}
              />
            </div>
            <div className="grid gap-1">
              <Label>Próxima consulta</Label>
              <Input
                type="datetime-local"
                value={psiqProxima}
                onChange={(e) => setPsiqProxima(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-1">
            <Label>Observações do acompanhamento</Label>
            <Textarea
              rows={2}
              value={psiqObs}
              onChange={(e) => setPsiqObs(e.target.value)}
              placeholder="Ex.: retorno a cada 3 meses, ajustes recentes, comportamento"
            />
          </div>
        </div>
        <div className="grid gap-1">
          <Label>Observações</Label>
          <Textarea rows={3} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
        </div>
      </div>
      <DialogFooter className="mt-4">
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button onClick={submit}>Salvar</Button>
      </DialogFooter>
    </>
  );
}

function HaldolBox({
  residente,
  onMarcar,
}: {
  residente: ResidenteSalvo;
  onMarcar: () => void;
}) {
  const h = residente.haldolInjetavel;
  if (!h) return null;
  const hojeIso = new Date().toISOString().slice(0, 10);
  const dias = h.proximaDose
    ? Math.ceil(
        (parseIsoLocal(h.proximaDose).getTime() - parseIsoLocal(hojeIso).getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : null;
  const atrasada = dias !== null && dias < 0;
  const hoje = dias === 0;
  const proxima = dias !== null && dias <= 3 && dias >= 0;
  const tone = atrasada
    ? "border-destructive bg-destructive/10"
    : hoje
      ? "border-[color:var(--warning)] bg-[color:var(--warning)]/10"
      : proxima
        ? "border-[color:var(--warning)]/60 bg-[color:var(--warning)]/5"
        : "border-muted";
  return (
    <div className={`mt-2 rounded-md border p-2 text-xs ${tone}`}>
      <div className="font-medium">Haldol injetável</div>
      <div>
        Periodicidade: <span className="font-medium">{h.periodicidadeDias} dias</span>
      </div>
      <div>
        Próxima dose: <span className="font-medium">{fmtIsoBR(h.proximaDose)}</span>
        {dias !== null && (
          <span className="text-muted-foreground">
            {" "}
            ({atrasada
              ? `atrasada ${Math.abs(dias)} dia(s)`
              : hoje
                ? "é hoje"
                : `em ${dias} dia(s)`})
          </span>
        )}
      </div>
      {(atrasada || hoje || proxima) && (
        <Button size="sm" className="mt-2 h-7" onClick={onMarcar}>
          Marcar dose como feita hoje
        </Button>
      )}
    </div>
  );
}
