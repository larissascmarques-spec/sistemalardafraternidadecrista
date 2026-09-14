import { useReceitas } from "@/lib/receitas-cloud";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Plus, Check, X, FileText, PackagePlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { diasAte, ORIGENS_ESTOQUE } from "@/lib/mock-data";
import { fmtIsoBR, addDaysIso } from "@/lib/date-utils";
import { saldoLote, consumoDoLote } from "@/lib/lotes";
import { useAllResidentes } from "@/lib/residentes-store";
import { formatNome } from "@/lib/format-nome";
import {
  RECEITAS_STORAGE_KEY,
  origemEhSus,
  aplicarBaixaMedicacao,
  removerBaixaMedicacao,
  baixaDaMedicacao,
  medicacaoEstaRetirada,
  medicacoesDaReceita,
  chaveBaixaMedicacao,
  proximaRetiradaAtiva,
  type ReceitaSalva,
} from "@/lib/receitas-store";
import { useEstoque, adicionarItem } from "@/lib/estoque-store";
import {
  diasRestantesLote,
  estoqueDaResidente,
  iniciaisDe,
  statusResidente,
  toneClasses,
} from "@/lib/status-residente";
import { medsEmUsoDaResidente } from "@/lib/meds-em-uso";
import { formatMedNome } from "@/lib/format-med";
import { FichaResidenteDialog } from "@/components/FichaResidenteDialog";
import {
  detectarInconsistencias,
  type Inconsistencia,
} from "@/lib/inconsistencias";
import { AlertTriangle, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/residentes/$id")({
  head: () => ({
    meta: [
      { title: "Prontuário da Residente — Lar da Fraternidade Cristã" },
      { name: "description", content: "Prontuário, ficha, receitas e estoque individual da residente." },
      { property: "og:title", content: "Prontuário da Residente — Lar da Fraternidade Cristã" },
      { property: "og:description", content: "Prontuário, ficha, receitas e estoque individual da residente." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PerfilResidente,
});

function PerfilResidente() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { todos, nomePor, loaded } = useAllResidentes();
  const residente = todos.find((r) => r.id === id);
  const { salvos, setSalvos } = useAllResidentes();

  function atualizarResidenteParcial(
    patch: Partial<import("@/lib/residentes-store").ResidenteSalvo>,
  ) {
    if (!residente) return;
    const existente = salvos.find((s) => s.id === residente.id);
    if (existente) {
      setSalvos(salvos.map((s) => (s.id === existente.id ? { ...s, ...patch } : s)));
    } else {
      // residente vinha só do mock — promove para "salvos" mantendo o mesmo id.
      const promovido: import("@/lib/residentes-store").ResidenteSalvo = {
        ...(residente as any),
        ...patch,
        criadoEm: new Date().toISOString(),
      };
      setSalvos([...salvos, promovido]);
    }
  }
  const [salvas, setSalvas] = useReceitas(
    RECEITAS_STORAGE_KEY,
    [],
  );
  const { itens: estoque } = useEstoque();

  const receitasAtivas = useMemo(
    () =>
      salvas.filter(
        (r) => r.residenteId === id && diasAte(r.vencimento) >= 0,
      ),
    [salvas, id],
  );

  // Mais recente por medicação — mantém a vencida se não houver substituta válida.
  const medsEmUso = useMemo(
    () => medsEmUsoDaResidente(salvas, id, residente?.medicacoesUso ?? []),
    [salvas, id, residente],
  );
  // Receitas a exibir: para cada medicação em uso, o objeto de receita escolhido.
  const receitasParaExibir = useMemo(() => {
    const ids = new Set(medsEmUso.map((m) => m.receitaId).filter(Boolean));
    return salvas.filter((r) => ids.has(r.id));
  }, [salvas, medsEmUso]);

  const estoqueMeu = useMemo(
    () => estoqueDaResidente(estoque, id),
    [estoque, id],
  );

  const status = statusResidente(receitasAtivas, estoque, id);

  const inconsistencias = useMemo<Inconsistencia[]>(
    () =>
      residente && "criadoEm" in (residente as any)
        ? detectarInconsistencias(residente as any, salvas)
        : [],
    [residente, salvas],
  );

  if (!loaded) {
    return (
      <div className="p-6 text-sm text-muted-foreground">Carregando residente…</div>
    );
  }

  if (!residente) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => navigate({ to: "/residentes" })}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <p className="mt-4 text-muted-foreground">Residente não encontrada.</p>
      </div>
    );
  }

  // Origem padrão para "+ Lançar entrada" — usa a receita ativa mais recente
  const origemPadrao =
    receitasAtivas[0]?.origem?.toString() || residente.ubs || "SUS/UBS";

  return (
    <div className="space-y-6 p-6">
      {/* Voltar */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate({ to: "/residentes" })}
        className="-ml-2"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para residentes
      </Button>

      {/* Seção A — cabeçalho */}
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
              {iniciaisDe(residente.nome)}
            </div>
            <div>
              <h1 className="text-2xl font-semibold">{formatNome(residente.nome)}</h1>
              <p className="text-sm text-muted-foreground">
                {residente.id}
                {residente.ubs ? ` • ${residente.ubs}` : ""}
                {residente.medico ? ` • ${residente.medico}` : ""}
              </p>
              {residente.dataInstitucionalizacao && (
                <p className="text-xs text-muted-foreground">
                  Institucionalizada em{" "}
                  {new Date(residente.dataInstitucionalizacao + "T12:00:00").toLocaleDateString("pt-BR")}
                </p>
              )}
              <div className="mt-1 flex flex-wrap gap-1">
                <Badge className={toneClasses(status.tone)} variant="outline">
                  {status.label}
                </Badge>
                {(residente.alergias ?? []).map((a) => (
                  <Badge key={a} variant="destructive" className="text-[10px]">
                    ⚠ {a}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <FichaResidenteDialog
              residente={residente}
              medsEmUso={medsEmUso}
              onSaveResidente={atualizarResidenteParcial}
            />
            <Button asChild variant="outline">
              <Link to="/residentes">Editar cadastro</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Acompanhamento psiquiátrico */}
      {inconsistencias.length > 0 && (
        <Card className="border-amber-300 bg-amber-50/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Inconsistências detectadas ({inconsistencias.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {inconsistencias.map((i, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-2 rounded-md border p-2 text-sm ${
                  i.nivel === "erro"
                    ? "border-rose-200 bg-rose-50 text-rose-800"
                    : "border-amber-200 bg-amber-50 text-amber-800"
                }`}
              >
                {i.nivel === "erro" ? (
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="font-medium">{i.medicacao}</p>
                  <p className="text-xs opacity-90">{i.mensagem}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {residente.acompanhamentoPsiquiatrico &&
        (residente.acompanhamentoPsiquiatrico.medico ||
          residente.acompanhamentoPsiquiatrico.local ||
          residente.acompanhamentoPsiquiatrico.observacoes ||
          residente.acompanhamentoPsiquiatrico.ultimaConsulta ||
          residente.acompanhamentoPsiquiatrico.proximaConsulta) && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Acompanhamento psiquiátrico</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              {residente.acompanhamentoPsiquiatrico.medico && (
                <p>
                  <span className="text-muted-foreground">Médico: </span>
                  {residente.acompanhamentoPsiquiatrico.medico}
                </p>
              )}
              {residente.acompanhamentoPsiquiatrico.local && (
                <p>
                  <span className="text-muted-foreground">Local: </span>
                  {residente.acompanhamentoPsiquiatrico.local}
                </p>
              )}
              {residente.acompanhamentoPsiquiatrico.ultimaConsulta && (
                <p>
                  <span className="text-muted-foreground">Última consulta: </span>
                  {(() => {
                    const v = residente.acompanhamentoPsiquiatrico.ultimaConsulta!;
                    const hasTime = v.includes("T");
                    const d = new Date(hasTime ? v : v + "T12:00:00");
                    return hasTime
                      ? d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
                      : d.toLocaleDateString("pt-BR");
                  })()}
                </p>
              )}
              {residente.acompanhamentoPsiquiatrico.proximaConsulta && (
                <p>
                  <span className="text-muted-foreground">Próxima consulta: </span>
                  {(() => {
                    const v = residente.acompanhamentoPsiquiatrico.proximaConsulta!;
                    const hasTime = v.includes("T");
                    const d = new Date(hasTime ? v : v + "T12:00:00");
                    return hasTime
                      ? d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
                      : d.toLocaleDateString("pt-BR");
                  })()}
                </p>
              )}
              {residente.acompanhamentoPsiquiatrico.observacoes && (
                <p className="whitespace-pre-wrap">
                  <span className="text-muted-foreground">Observações: </span>
                  {residente.acompanhamentoPsiquiatrico.observacoes}
                </p>
              )}
            </CardContent>
          </Card>
        )}

      {/* Seção B — Medicações em uso (mais recente por medicação) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Medicações em uso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {receitasParaExibir.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma receita ativa. Importe um PDF ou cadastre manualmente na aba{" "}
              <Link to="/receitas" className="underline">Receitas</Link>.
            </p>
          ) : (
            receitasParaExibir.map((r) => (
              <ReceitaLinha
                key={r.id}
                receita={r}
                onToggleRetirada={(medicacao, valor) => {
                  const hoje = new Date().toISOString().slice(0, 10);
                  setSalvas(
                    salvas.map((x) =>
                      x.id === r.id
                        ? valor
                          ? aplicarBaixaMedicacao(x, medicacao, { data: hoje, local: x.origem, intervalo: x.intervaloRetiradaDias ?? 30 })
                          : removerBaixaMedicacao(x, medicacao)
                        : x,
                    ),
                  );
                  toast.success(valor ? "Retirada marcada." : "Retirada desmarcada.");
                }}
                onSalvarProxRet={(medicacao, valor) => {
                  setSalvas(
                    salvas.map((x) => {
                      if (x.id !== r.id) return x;
                      const chave = chaveBaixaMedicacao(medicacao);
                      const baixaAtual = baixaDaMedicacao(x, medicacao) ?? {};
                      return {
                        ...x,
                        retiradasMedicacoes: {
                          ...(x.retiradasMedicacoes ?? {}),
                          [chave]: {
                            ...baixaAtual,
                            proximaRetirada: valor || undefined,
                            proximaRetiradaExigeNovaReceita: valor ? valor > x.vencimento : undefined,
                          },
                        },
                        proximaRetirada: medicacoesDaReceita(x.medicacao).length <= 1 ? valor || undefined : x.proximaRetirada,
                      };
                    }),
                  );
                  toast.success("Próxima retirada atualizada.");
                }}
              />
            ))
          )}
        </CardContent>
      </Card>

      {/* Seção C — Estoque por medicamento */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Estoque por medicamento</CardTitle>
          <p className="text-xs text-muted-foreground">
            Só aparecem aqui medicações em que esta residente está listada como usuária.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {estoqueMeu.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma medicação em estoque associada a esta residente ainda.
              Vá em <Link to="/estoque" className="underline">Medicações</Link> e associe a residente ao lote,
              ou clique em <strong>+ Entrada</strong> abaixo em uma receita.
            </p>
          ) : (
            estoqueMeu.map((e) => (
              <MedLinha
                key={e.id}
                lote={e}
                origemPadrao={origemPadrao}
                residenteId={id}
              />
            ))
          )}
          {/* Entrada rápida a partir de receitas sem lote ainda no estoque */}
          {receitasAtivas
            .filter(
              (r) =>
                !estoqueMeu.some(
                  (e) =>
                    e.medicacao.trim().toLowerCase() ===
                    r.medicacao.trim().toLowerCase(),
                ),
            )
            .map((r) => (
              <NovaEntradaDeReceita
                key={"rx-" + r.id}
                receita={r}
                residenteId={id}
              />
            ))}
        </CardContent>
      </Card>
    </div>
  );
}

/* -------------------------------- Seção B -------------------------------- */
function ReceitaLinha({
  receita,
  onToggleRetirada,
  onSalvarProxRet,
}: {
  receita: ReceitaSalva;
  onToggleRetirada: (medicacao: string, v: boolean) => void;
  onSalvarProxRet: (medicacao: string, v: string) => void;
}) {
  const diasVenc = diasAte(receita.vencimento);
  const meds = medicacoesDaReceita(receita.medicacao);
  const proximas = meds
    .map((m) => proximaRetiradaAtiva(receita, m)?.proximaRetirada)
    .filter((v): v is string => Boolean(v));
  const menorProx = proximas.sort()[0];
  const diasRet = menorProx ? diasAte(menorProx) : null;
  const [editProx, setEditProx] = useState<{ medicacao: string; valor: string } | null>(null);

  const badge = (() => {
    if (diasVenc < 0)
      return <Badge variant="destructive">Vencida há {Math.abs(diasVenc)}d</Badge>;
    if (diasRet !== null && diasRet < 0)
      return <Badge variant="destructive">Retirada atrasada {Math.abs(diasRet)}d</Badge>;
    if (diasRet !== null && diasRet <= 7)
      return <Badge variant="destructive">Retirar em {diasRet}d</Badge>;
    if (diasRet !== null && diasRet <= 15)
      return (
        <Badge className="bg-[color:var(--warning)]/20 text-[color:var(--warning-foreground)]">
          Retirar em {diasRet}d
        </Badge>
      );
    if (diasVenc <= 30)
      return (
        <Badge className="bg-[color:var(--warning)]/10 text-[color:var(--warning-foreground)]">
          Renovar em {diasVenc}d
        </Badge>
      );
    return (
      <Badge className="bg-[color:var(--success)]/15 text-[color:var(--success)]">
        OK
      </Badge>
    );
  })();

  return (
    <div className="rounded-md border p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">{meds.map(formatMedNome).join(", ")}</p>
          <p className="text-xs text-muted-foreground">
            Emissão {fmtIsoBR(receita.dataEmissao)} • Vencimento{" "}
            {fmtIsoBR(receita.vencimento)} • {receita.origem}
            {receita.medico ? ` • ${receita.medico}` : ""}
          </p>
          <div className="mt-1">{badge}</div>
        </div>
      </div>

      <div className="mt-3 space-y-2 text-xs">
        {meds.map((m) => {
          const baixa = baixaDaMedicacao(receita, m);
          const retirada = medicacaoEstaRetirada(receita, m);
          const editando = editProx?.medicacao === m;
          return (
            <div key={m} className="flex flex-wrap items-center gap-2 rounded-md border bg-card/60 px-2 py-1.5">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={retirada}
                  onChange={(e) => onToggleRetirada(m, e.target.checked)}
                />
                <span className="font-medium">{formatMedNome(m)}</span>
              </label>
              {retirada && baixa?.retiradaData && (
                <span className="text-muted-foreground">retirada em {fmtIsoBR(baixa.retiradaData)}</span>
              )}
              <span className="text-muted-foreground">Próxima:</span>
              {editando ? (
                <>
                  <Input
                    type="date"
                    className="h-7 w-[140px]"
                    value={editProx.valor}
                    onChange={(e) => setEditProx({ medicacao: m, valor: e.target.value })}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2"
                    onClick={() => {
                      onSalvarProxRet(m, editProx.valor);
                      setEditProx(null);
                    }}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2"
                    onClick={() => setEditProx(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <span className="font-medium">{baixa?.proximaRetirada ? fmtIsoBR(baixa.proximaRetirada) : "—"}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2"
                    onClick={() => setEditProx({ medicacao: m, valor: baixa?.proximaRetirada || "" })}
                  >
                    editar
                  </Button>
                </>
              )}
            </div>
          );
        })}
        {receita.arquivoUrl && (
          <a
            href={receita.arquivoUrl}
            target="_blank"
            rel="noreferrer"
            className="ml-auto inline-flex items-center gap-1 text-xs text-primary underline"
          >
            <FileText className="h-3 w-3" /> Ver PDF
          </a>
        )}
      </div>
    </div>
  );
}

/* -------------------------------- Seção C -------------------------------- */
function MedLinha({
  lote,
  origemPadrao,
  residenteId,
}: {
  lote: import("@/lib/estoque-store").EstoqueRow;
  origemPadrao: string;
  residenteId: string;
}) {
  const [aberto, setAberto] = useState(false);
  const dias = diasRestantesLote(lote);
  const badge =
    dias <= 7 ? (
      <Badge variant="destructive">Crítico ({dias}d)</Badge>
    ) : dias <= 15 ? (
      <Badge className="bg-[color:var(--warning)]/20 text-[color:var(--warning-foreground)]">
        Atenção ({dias}d)
      </Badge>
    ) : (
      <Badge className="bg-[color:var(--success)]/15 text-[color:var(--success)]">
        OK ({dias}d)
      </Badge>
    );
  return (
    <div className="rounded-md border p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium">
            {lote.medicacao}{" "}
            <span className="text-xs text-muted-foreground">
              {lote.apresentacao}
            </span>
          </p>
          <p className="text-xs text-muted-foreground">
            Saldo hoje: <strong>{saldoLote(lote)}</strong>
            {saldoLote(lote) !== (Number(lote.quantidade) || 0)
              ? ` (lançado ${lote.quantidade})`
              : ""}{" "}
            • Consumo/dia: <strong>{consumoDoLote(lote)}</strong>
            {lote.lote ? ` • Lote ${lote.lote}` : ""}
            {lote.validade ? ` • Val ${fmtIsoBR(lote.validade)}` : ""}
          </p>
          <div className="mt-1">{badge}</div>
        </div>
        <Button
          size="sm"
          variant={aberto ? "secondary" : "outline"}
          onClick={() => setAberto(!aberto)}
        >
          <Plus className="mr-1 h-3 w-3" /> Entrada
        </Button>
      </div>
      {aberto && (
        <FormEntradaRapida
          medicacao={lote.medicacao}
          apresentacao={lote.apresentacao}
          origemPadrao={lote.origem || origemPadrao}
          consumoDiario={lote.consumoDiario || 0}
          estoqueMinimo={lote.estoqueMinimo || 0}
          tipoUso={lote.tipoUso || "continua"}
          residenteId={residenteId}
          pacientesUsoAtual={lote.pacientesUso ?? []}
          onClose={() => setAberto(false)}
        />
      )}
    </div>
  );
}

function NovaEntradaDeReceita({
  receita,
  residenteId,
}: {
  receita: ReceitaSalva;
  residenteId: string;
}) {
  const [aberto, setAberto] = useState(false);
  return (
    <div className="rounded-md border border-dashed p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium">
            {receita.medicacao}{" "}
            <span className="text-xs text-muted-foreground">
              (sem lote no estoque)
            </span>
          </p>
          <p className="text-xs text-muted-foreground">
            Receita ativa • {receita.origem}
          </p>
        </div>
        <Button
          size="sm"
          variant={aberto ? "secondary" : "outline"}
          onClick={() => setAberto(!aberto)}
        >
          <PackagePlus className="mr-1 h-3 w-3" /> Entrada
        </Button>
      </div>
      {aberto && (
        <FormEntradaRapida
          medicacao={receita.medicacao}
          apresentacao="Comprimido"
          origemPadrao={receita.origem || "SUS/UBS"}
          consumoDiario={0}
          estoqueMinimo={0}
          tipoUso="continua"
          residenteId={residenteId}
          pacientesUsoAtual={[{ residenteId, qtdDia: 1 }]}
          onClose={() => setAberto(false)}
        />
      )}
    </div>
  );
}

/* --------------------- Seção D — formulário inline ----------------------- */
function FormEntradaRapida({
  medicacao,
  apresentacao,
  origemPadrao,
  consumoDiario,
  estoqueMinimo,
  tipoUso,
  residenteId,
  pacientesUsoAtual,
  onClose,
}: {
  medicacao: string;
  apresentacao: string;
  origemPadrao: string;
  consumoDiario: number;
  estoqueMinimo: number;
  tipoUso: string;
  residenteId: string;
  pacientesUsoAtual: Array<{ residenteId: string; qtdDia: number }>;
  onClose: () => void;
}) {
  const { nomePor } = useAllResidentes();
  const [lote, setLote] = useState("");
  const [validade, setValidade] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [origem, setOrigem] = useState<string>(
    ORIGENS_ESTOQUE.find((o) => o === origemPadrao) || "Farmácia Popular",
  );
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    if (!lote.trim() || !validade || !quantidade) {
      toast.error("Preencha lote, validade e quantidade.");
      return;
    }
    setSalvando(true);
    try {
      const pacientes = pacientesUsoAtual.some((p) => p.residenteId === residenteId)
        ? pacientesUsoAtual
        : [...pacientesUsoAtual, { residenteId, qtdDia: 1 }];
      await adicionarItem({
        medicacao,
        apresentacao,
        lote: lote.trim(),
        validade,
        quantidade: Number(quantidade) || 0,
        estoqueMinimo,
        consumoDiario,
        origem,
        local: "Armário A1",
        tipoUso: tipoUso as any,
        lancadoEm: new Date().toISOString().slice(0, 10),
        pacientesUso: pacientes,
      });
      toast.success("Entrada registrada.");
      onClose();
    } catch (e) {
      console.error(e);
      toast.error("Não consegui registrar a entrada.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="mt-3 grid gap-3 rounded-md bg-muted/40 p-3 md:grid-cols-4">
      <div className="md:col-span-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span>
          <strong>Medicamento:</strong> {medicacao}
        </span>
        <span>•</span>
        <span>
          <strong>Residente:</strong> {nomePor(residenteId)}
        </span>
      </div>
      <div>
        <Label className="text-xs">Lote</Label>
        <Input
          className="h-9"
          value={lote}
          onChange={(e) => setLote(e.target.value)}
          placeholder="Ex.: L23A45"
        />
      </div>
      <div>
        <Label className="text-xs">Validade do lote</Label>
        <Input
          type="date"
          className="h-9"
          value={validade}
          onChange={(e) => setValidade(e.target.value)}
        />
      </div>
      <div>
        <Label className="text-xs">Quantidade recebida</Label>
        <Input
          type="number"
          className="h-9"
          value={quantidade}
          onChange={(e) => setQuantidade(e.target.value)}
          placeholder="Ex.: 60"
        />
      </div>
      <div>
        <Label className="text-xs">Origem</Label>
        <Select value={origem} onValueChange={setOrigem}>
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ORIGENS_ESTOQUE.map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="md:col-span-4 flex justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          disabled={salvando}
        >
          Cancelar
        </Button>
        <Button size="sm" onClick={salvar} disabled={salvando}>
          {salvando ? "Salvando..." : "Salvar entrada"}
        </Button>
      </div>
    </div>
  );
}