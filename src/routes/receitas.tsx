import { useReceitas } from "@/lib/receitas-cloud";
import { createFileRoute, Link } from "@tanstack/react-router";
import { formatNome } from "@/lib/format-nome";
import { formatMedLista, formatMedNome } from "@/lib/format-med";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { diasAte } from "@/lib/mock-data";
import { fmtIsoBR, addDaysIso } from "@/lib/date-utils";
import { FilePlus, Archive, Plus, ArchiveX, FileText, Pencil, Trash2, PackageCheck } from "lucide-react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import {
  RECEITAS_STORAGE_KEY,
  RECEITAS_ARQUIVO_KEY,
  calcVencimento,
  prazoRetiradaPadrao,
  prazoRetiradaDe,
  dataLimiteRetirada,
  origemEhSus,
  intervaloRetiradaDe,
  medicacoesDaReceita,
  baixaDaMedicacao,
  medicacaoEstaRetirada,
  proximaRetiradaAtiva,
  aplicarBaixaMedicacao,
  removerBaixaMedicacao,
  type ReceitaSalva,
} from "@/lib/receitas-store";
import {
  RESIDENTES_STORAGE_KEY,
  useAllResidentes,
  type ResidenteSalvo,
} from "@/lib/residentes-store";
import { useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { salvarReceitaLida, validadePadraoPorTipo } from "@/lib/salvar-receita";
import { toast } from "sonner";

export const Route = createFileRoute("/receitas")({
  component: Page,
});

function statusBadge(dias: number) {
  if (dias < 0) return <Badge variant="destructive">Vencida</Badge>;
  if (dias <= 15) return <Badge variant="destructive">Crítico ({dias}d)</Badge>;
  if (dias <= 30) return <Badge className="bg-[color:var(--warning)]/20 text-[color:var(--warning-foreground)]">Atenção ({dias}d)</Badge>;
  return <Badge className="bg-[color:var(--success)]/15 text-[color:var(--success)]">Válida ({dias}d)</Badge>;
}

function retiradaBadge(dias: number) {
  if (dias < 0)
    return <Badge variant="destructive">Prazo passou ({Math.abs(dias)}d)</Badge>;
  if (dias <= 7) return <Badge variant="destructive">Retirar ({dias}d)</Badge>;
  if (dias <= 15)
    return (
      <Badge className="bg-[color:var(--warning)]/20 text-[color:var(--warning-foreground)]">
        Retirar ({dias}d)
      </Badge>
    );
  return (
    <Badge className="bg-[color:var(--success)]/15 text-[color:var(--success)]">
      OK ({dias}d)
    </Badge>
  );
}

function Page() {
  const [salvas, setSalvas] = useReceitas(RECEITAS_STORAGE_KEY, []);
  const [arquivo, setArquivo] = useReceitas(RECEITAS_ARQUIVO_KEY, []);
  const [residentesSalvos, setResidentesSalvos] = useLocalStorage<ResidenteSalvo[]>(
    RESIDENTES_STORAGE_KEY,
    [],
  );
  const { todos, nomePor } = useAllResidentes();
  const [abrirManual, setAbrirManual] = useState(false);
  const [residenteFiltro, setResidenteFiltro] = useState<string>("todos");
  const normNome = (s: string) =>
    (s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  const nomeSalvoNaReceita = (r: ReceitaSalva) => {
    const extra = r as ReceitaSalva & {
      residenteNome?: string;
      nomeResidente?: string;
      paciente?: string;
      residente?: string;
    };
    return (
      extra.residenteNome ||
      extra.nomeResidente ||
      extra.paciente ||
      extra.residente ||
      ""
    );
  };
  const nomeDaReceita = (r: ReceitaSalva) => {
    return formatNome(nomeSalvoNaReceita(r) || nomePor(r.residenteId));
  };
  const salvasAtivas = salvas
    .map((r) => ({ ...r, dias: diasAte(r.vencimento) }))
    // Receitas vencidas ficam ocultas, exceto quando foram restauradas
    // manualmente do arquivo (senão elas "sumiriam" após restaurar).
    .filter((r) => r.dias >= 0 || !!r.restauradaEm);

  // O filtro da tela de Receitas precisa usar exatamente o mesmo nome exibido
  // na coluna "Residente". Assim ele não depende de id salvo, id duplicado ou
  // cadastro antigo da residente.
  const opcoesFiltro = Array.from(
    new Map(
      salvasAtivas
        .map((r) => {
          const label = nomeDaReceita(r);
          return [normNome(label), label] as const;
        })
        .filter(([value]) => Boolean(value)),
    ).entries(),
  )
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));

  const filtroNormalizado = residenteFiltro === "todos" ? "todos" : normNome(residenteFiltro);

  const lista = salvasAtivas
    .filter((r) => {
      if (filtroNormalizado === "todos") return true;
      return normNome(nomeDaReceita(r)) === filtroNormalizado;
    })
    .sort((a, b) => a.dias - b.dias);

  // Algumas receitas importadas em lote podem ter vindo com id repetido.
  // Se a chave da linha for só o id, o React reaproveita uma linha antiga
  // visualmente e parece que o filtro falhou. Esta chave usa também paciente,
  // medicação e data, garantindo que a tabela redesenhe a linha correta.
  const chaveLinhaReceita = (r: ReceitaSalva) =>
    [r.id, normNome(nomeDaReceita(r)), normNome(r.medicacao), r.dataEmissao, r.vencimento].join("|");


  function arquivarManual(id: string) {
    const alvo = salvas.find((r) => r.id === id);
    if (!alvo) return;
    setSalvas(salvas.filter((r) => r.id !== id));
    setArquivo([
      ...arquivo,
      { ...alvo, arquivadaEm: new Date().toISOString(), motivoArquivamento: "manual" },
    ]);
    toast.success("Receita movida para o Arquivo.");
  }

  function arquivarComMotivo(id: string, motivo: ReceitaSalva["motivoArquivamento"], obs?: string) {
    const alvo = salvas.find((r) => r.id === id);
    if (!alvo) return;
    setSalvas(salvas.filter((r) => r.id !== id));
    setArquivo([
      ...arquivo,
      { ...alvo, arquivadaEm: new Date().toISOString(), motivoArquivamento: motivo, observacao: obs },
    ]);
    toast.success("Receita arquivada.");
  }

  function visualizarPdf(r: ReceitaSalva) {
    if (!r.arquivoUrl) {
      toast.error(
        "Esta receita foi cadastrada antes do PDF ser guardado, ou o PDF era grande demais. Importe novamente para ver o PDF.",
      );
      return;
    }
    const w = window.open();
    if (!w) {
      toast.error("Permita pop-ups para visualizar o PDF.");
      return;
    }
    w.document.write(
      `<title>${formatMedLista(r.medicacao)}</title><iframe src="${r.arquivoUrl}" style="border:0;width:100vw;height:100vh"></iframe>`,
    );
  }

  const [editandoValidade, setEditandoValidade] = useState<ReceitaSalva | null>(null);
  const [editando, setEditando] = useState<ReceitaSalva | null>(null);
  const [darBaixa, setDarBaixa] = useState<ReceitaSalva | null>(null);

  function salvarBaixa(id: string, medicacao: string, local: string, data: string, intervalo?: number, usoUnico?: boolean) {
    // Usa a referência exata do objeto vindo do diálogo. Assim, se por acaso
    // duas receitas antigas tiverem o mesmo id (ids importados repetidos),
    // a baixa é aplicada só na receita certa e as outras ficam intactas.
    const alvo = darBaixa;
    if (!alvo) return;
    const idxs = salvas
      .map((x, i) => (x === alvo ? i : x.id === id ? i : -1))
      .filter((i) => i >= 0);
    const idx = salvas.indexOf(alvo) >= 0 ? salvas.indexOf(alvo) : idxs[0];
    if (idx < 0) return;
    const r = salvas[idx];
    const atualizada = aplicarBaixaMedicacao(r, medicacao, { local, data, intervalo, usoUnico });
    const baixa = baixaDaMedicacao(atualizada, medicacao);
    const novas = salvas.slice();
    novas[idx] = atualizada;
    setSalvas(novas);
    setDarBaixa(null);
    toast.success(
      usoUnico
        ? `Retirada de ${formatMedNome(medicacao)} registrada (uso pontual, sem próxima retirada).`
        : baixa?.proximaRetirada
        ? `Retirada de ${formatMedNome(medicacao)} registrada. Próxima em ${fmtIsoBR(baixa.proximaRetirada)}${
            baixa.proximaRetiradaExigeNovaReceita ? " (com nova receita)" : ""
          }.`
        : `Retirada de ${formatMedNome(medicacao)} registrada.`,
    );
  }

  function desfazerBaixa(id: string, medicacao: string) {
    const alvo = darBaixa;
    const idx = alvo ? salvas.indexOf(alvo) : salvas.findIndex((x) => x.id === id);
    if (idx < 0) return;
    const atualizada = removerBaixaMedicacao(salvas[idx], medicacao);
    const novas = salvas.slice();
    novas[idx] = atualizada;
    setSalvas(novas);
    toast.success(`Baixa de ${formatMedNome(medicacao)} desfeita.`);
  }


  function salvarNovaValidade(id: string, novaDias: number) {
    const r = salvas.find((x) => x.id === id);
    if (!r) return;
    const atualizada: ReceitaSalva = {
      ...r,
      validadeDias: novaDias,
      vencimento: calcVencimento(r.dataEmissao, novaDias),
      prazoRetiradaDias: prazoRetiradaPadrao(novaDias),
    };
    setSalvas(salvas.map((x) => (x.id === id ? atualizada : x)));
    setEditandoValidade(null);
    toast.success("Validade atualizada.");
  }

  function salvarEdicao(id: string, patch: Partial<ReceitaSalva>) {
    const r = salvas.find((x) => x.id === id);
    if (!r) return;
    const merged: ReceitaSalva = { ...r, ...patch };
    if (patch.validadeDias != null || patch.dataEmissao != null) {
      merged.vencimento = calcVencimento(merged.dataEmissao, merged.validadeDias);
      // Se o usuário não passou prazo customizado explicitamente, recalcula pelo padrão.
      if (patch.prazoRetiradaDias == null) {
        merged.prazoRetiradaDias = prazoRetiradaPadrao(merged.validadeDias);
      }
    }
    setSalvas(salvas.map((x) => (x.id === id ? merged : x)));
    setEditando(null);
    toast.success("Receita atualizada.");
  }

  const vencidas = salvas.filter((r) => diasAte(r.vencimento) < 0);
  function arquivarTodasVencidas() {
    if (vencidas.length === 0) return;
    const ids = new Set(vencidas.map((r) => r.id));
    setSalvas(salvas.filter((r) => !ids.has(r.id)));
    setArquivo([
      ...arquivo,
      ...vencidas.map((r) => ({ ...r, arquivadaEm: new Date().toISOString() })),
    ]);
    toast.success(`${vencidas.length} receita(s) vencida(s) movida(s) para o Arquivo.`);
  }

  function apagarTodas() {
    if (salvas.length === 0) return;
    if (!confirm(`Apagar TODAS as ${salvas.length} receitas ativas? Esta ação não pode ser desfeita.`)) return;
    setSalvas([]);
    toast.success("Todas as receitas ativas foram apagadas.");
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Receitas / Prescrições"
        description="Mostra apenas as receitas ativas (não vencidas). Receitas vencidas ficam no Arquivo."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={residenteFiltro}
              onChange={(event) => setResidenteFiltro(event.target.value)}
              className="h-9 w-[220px] rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Filtrar receitas por paciente"
            >
              <option value="todos">Todos os pacientes</option>
              {opcoesFiltro.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            {residenteFiltro !== "todos" && (
              <Button variant="ghost" size="sm" onClick={() => setResidenteFiltro("todos")}>
                Limpar filtro
              </Button>
            )}
            {vencidas.length > 0 && (
              <Button variant="outline" onClick={arquivarTodasVencidas}>
                <ArchiveX className="mr-2 h-4 w-4" /> Arquivar vencidas ({vencidas.length})
              </Button>
            )}
            {salvas.length > 0 && (
              <Button variant="destructive" onClick={apagarTodas}>
                <Trash2 className="mr-2 h-4 w-4" /> Apagar tudo
              </Button>
            )}
            <Button asChild variant="outline">
              <Link to="/receitas/arquivo">
                <Archive className="mr-2 h-4 w-4" /> Arquivo
              </Link>
            </Button>
            <Button variant="outline" onClick={() => setAbrirManual(true)}>
              <Plus className="mr-2 h-4 w-4" /> Nova receita manual
            </Button>
            <Button asChild variant="outline">
              <Link to="/receitas/testar">Testar 1 PDF</Link>
            </Button>
            <Button asChild>
              <Link to="/receitas/importar">
                <FilePlus className="mr-2 h-4 w-4" /> Importar PDFs
              </Link>
            </Button>
          </div>
        }
      />
      <Card>
        <CardContent className="p-0">
          {lista.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              Nenhuma receita ativa. Use <strong>Importar PDFs</strong> ou
              <strong> Nova receita manual</strong> para cadastrar.
            </p>
          ) : (
          <Table key={filtroNormalizado}>
            <TableHeader>
              <TableRow>
                <TableHead>Residente</TableHead>
                <TableHead>Medicação</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Emissão</TableHead>
                <TableHead>Retirar até</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lista.map((r) => {
                const meds = medicacoesDaReceita(r.medicacao);
                const retiradas = meds.filter((m) => medicacaoEstaRetirada(r, m));
                const pendentes = meds.length - retiradas.length;
                return (
                <TableRow key={chaveLinhaReceita(r)}>
                  <TableCell className="font-medium">
                    {nomeDaReceita(r)}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                       {meds.map((m) => {
                         const prox = proximaRetiradaAtiva(r, m);
                         return (
                        <div key={m} className="flex flex-col">
                          <div className="flex flex-wrap items-center gap-2">
                            <span>{formatMedNome(m)}</span>
                            {medicacaoEstaRetirada(r, m) ? (
                              <Badge className="bg-[color:var(--success)]/15 text-[color:var(--success)] border-[color:var(--success)]/40">
                                Retirada
                              </Badge>
                            ) : null}
                          </div>
                          {prox ? (
                            <span className="text-[11px] text-muted-foreground">
                              próxima retirada: {fmtIsoBR(prox.proximaRetirada)}
                              {prox.proximaRetiradaExigeNovaReceita ? " (nova receita)" : ""}
                            </span>
                          ) : null}
                          {!medicacaoEstaRetirada(r, m) && (
                            <span className="text-[11px] font-medium text-destructive">
                              pendente compra
                            </span>
                          )}
                        </div>
                         );
                       })}
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline">{r.tipo}</Badge></TableCell>
                  <TableCell>{fmtIsoBR(r.dataEmissao)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">{fmtIsoBR(dataLimiteRetirada(r))}</span>
                      {(() => {
                        if (pendentes === 0) {
                          return (
                            <Badge className="bg-[color:var(--success)]/15 text-[color:var(--success)] border-[color:var(--success)]/40 w-fit">
                              Retiradas
                            </Badge>
                          );
                        }
                        const dRet = diasAte(dataLimiteRetirada(r));
                        return (
                          <div className="flex items-center gap-1">
                            {retiradaBadge(dRet)}
                            <span className="text-[10px] text-muted-foreground">
                              ({prazoRetiradaDe(r)}d{retiradas.length > 0 ? ` • ${retiradas.length}/${meds.length}` : ""})
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{fmtIsoBR(r.vencimento)}</span>
                      <span className="text-xs text-muted-foreground">
                        ({r.validadeDias}d)
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{r.origem}</TableCell>
                  <TableCell>{statusBadge(r.dias)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDarBaixa(r)}
                        title="Dar baixa por medicação"
                      >
                        <PackageCheck className={pendentes === 0 ? "h-4 w-4 text-[color:var(--success)]" : "h-4 w-4"} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => visualizarPdf(r)}
                        title="Visualizar PDF"
                        disabled={!r.arquivoUrl}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditando(r)}
                        title="Editar receita"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => arquivarManual(r.id)}
                        title="Mover para o Arquivo"
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
              })}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>

      <EditarValidadeDialog
        receita={editandoValidade}
        onClose={() => setEditandoValidade(null)}
        onSalvar={salvarNovaValidade}
      />

      <BaixaRetiradaDialog
        receita={darBaixa}
        onClose={() => setDarBaixa(null)}
        onSalvar={salvarBaixa}
        onDesfazer={desfazerBaixa}
      />

      <EditarReceitaDialog
        receita={editando}
        onClose={() => setEditando(null)}
        onSalvar={salvarEdicao}
        onArquivar={(id, motivo, obs) => {
          arquivarComMotivo(id, motivo, obs);
          setEditando(null);
        }}
      />

      <ReceitaManualDialog
        open={abrirManual}
        onOpenChange={setAbrirManual}
        residentes={todos}
        onSalvar={(dados, residenteIdManual, validadeDias) => {
          const r = salvarReceitaLida(
            { dados, residenteIdManual, validadeDias },
            {
              residentes: residentesSalvos,
              setResidentes: setResidentesSalvos,
              receitas: salvas,
              setReceitas: setSalvas,
              arquivo,
              setArquivo,
            },
          );
          if (!r.ok) {
            toast.error(r.motivo ?? "Não foi possível salvar.");
            return false;
          }
          toast.success(
            r.arquivouAntiga
              ? "Receita salva. A anterior foi para o Arquivo."
              : "Receita salva.",
          );
          setAbrirManual(false);
          return true;
        }}
      />
    </div>
  );
}

const TIPOS = [
  "Branca simples",
  "Controle especial",
  "Azul",
  "Amarela",
  "LME",
  "Alto custo",
  "Receita contínua",
] as const;

function BaixaRetiradaDialog({
  receita,
  onClose,
  onSalvar,
  onDesfazer,
}: {
  receita: ReceitaSalva | null;
  onClose: () => void;
  onSalvar: (id: string, medicacao: string, local: string, data: string, intervalo?: number, usoUnico?: boolean) => void;
  onDesfazer: (id: string, medicacao: string) => void;
}) {
  const [medicacao, setMedicacao] = useState("");
  const [local, setLocal] = useState("");
  const [data, setData] = useState("");
  const [intervalo, setIntervalo] = useState("30");
  const [usoUnico, setUsoUnico] = useState(false);
  useEffect(() => {
    if (receita) {
      const meds = medicacoesDaReceita(receita.medicacao);
      setMedicacao(meds.find((m) => !medicacaoEstaRetirada(receita, m)) ?? meds[0] ?? "");
    }
  }, [receita]);
  useEffect(() => {
    if (receita && medicacao) {
      const baixa = baixaDaMedicacao(receita, medicacao);
      setLocal(baixa?.retiradaLocal ?? receita.origem ?? "");
      setData(baixa?.retiradaData ?? new Date().toISOString().slice(0, 10));
      setIntervalo(String(baixa?.intervaloRetiradaDias ?? intervaloRetiradaDe(receita)));
      setUsoUnico(!!baixa?.usoUnico);
    }
  }, [receita, medicacao]);
  const isSus = receita ? origemEhSus(receita.origem) : false;
  const intervaloNum = Number(intervalo) || 30;
  const proxPrevista = data && isSus ? addDaysIso(data, intervaloNum) : "";
  const dentroValidade =
    receita && proxPrevista ? proxPrevista <= receita.vencimento : false;
  const meds = receita ? medicacoesDaReceita(receita.medicacao) : [];
  const baixaAtual = receita && medicacao ? baixaDaMedicacao(receita, medicacao) : undefined;
  const prazoLimiteIso = receita
    ? addDaysIso(receita.dataEmissao, receita.prazoRetiradaDias ?? 30)
    : "";
  const prazoVencido = !!prazoLimiteIso && prazoLimiteIso < new Date().toISOString().slice(0, 10);
  return (
    <Dialog open={!!receita} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dar baixa — retirada</DialogTitle>
          <DialogDescription>
            Registre onde e quando a medicação foi retirada. Você tem até 30 dias
            da data de emissão para conseguir retirar.
          </DialogDescription>
        </DialogHeader>
        {receita && (
          <div className="grid gap-3">
            {meds.length > 1 ? (
              <div className="grid gap-1">
                <Label>Medicação desta baixa</Label>
                <Select value={medicacao} onValueChange={setMedicacao}>
                  <SelectTrigger><SelectValue placeholder="Selecione a medicação" /></SelectTrigger>
                  <SelectContent>
                    {meds.map((m) => (
                      <SelectItem key={m} value={m}>
                        {formatMedNome(m)}{medicacaoEstaRetirada(receita, m) ? " — retirada" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <p className="text-sm font-medium">{formatMedNome(medicacao || receita.medicacao)}</p>
            )}
            {baixaAtual?.retirada && (
              <Badge className="w-fit bg-[color:var(--success)]/15 text-[color:var(--success)] border-[color:var(--success)]/40">
                Já retirada{baixaAtual.retiradaData ? ` em ${fmtIsoBR(baixaAtual.retiradaData)}` : ""}
              </Badge>
            )}
            <div className="text-sm text-muted-foreground">
              Emissão: {fmtIsoBR(receita.dataEmissao)} • Prazo limite:{" "}
              {fmtIsoBR(addDaysIso(receita.dataEmissao, receita.prazoRetiradaDias ?? 30))}
            </div>
            {prazoVencido && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 p-2 text-xs text-destructive">
                <strong>Prazo de retirada vencido.</strong> O prazo para retirar essa
                medicação nesta receita já passou. Você ainda pode confirmar a baixa,
                mas provavelmente foi necessária uma nova receita.
              </div>
            )}
            <div className="grid gap-1">
              <Label>Onde foi retirada</Label>
              <Input
                value={local}
                onChange={(e) => setLocal(e.target.value)}
                placeholder="Ex.: Farmácia Popular, UBS, Policlínica..."
              />
            </div>
            <div className="grid gap-1">
              <Label>Data da retirada</Label>
              <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
            </div>
            <label className="flex items-start gap-2 rounded-md border p-2 text-sm">
              <input
                type="checkbox"
                checked={usoUnico}
                onChange={(e) => setUsoUnico(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                <strong>Uso pontual — não haverá próxima retirada</strong>
                <span className="block text-xs text-muted-foreground">
                  Marque para antibióticos, dipirona, tratamento curto, etc. O sistema não vai cobrar uma próxima retirada.
                </span>
              </span>
            </label>
            {isSus && !usoUnico && (
              <div className="grid gap-1 rounded-md border border-[color:var(--warning)]/40 bg-[color:var(--warning)]/10 p-2">
                <Label className="text-xs">
                  Intervalo até a próxima retirada (SUS/UBS)
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    value={intervalo}
                    onChange={(e) => setIntervalo(e.target.value)}
                    className="w-24"
                  />
                  <span className="text-xs text-muted-foreground">dias</span>
                </div>
                {proxPrevista && (
                  <p className="text-xs text-muted-foreground">
                    Próxima retirada prevista:{" "}
                    <strong>{fmtIsoBR(proxPrevista)}</strong>
                    {!dentroValidade && (
                      <span className="text-[color:var(--warning)]">
                        {" "}— fora da validade da receita: será necessária <strong>nova receita</strong>.
                      </span>
                    )}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
        <DialogFooter>
          {receita && medicacao && baixaAtual?.retirada && (
            <Button variant="ghost" onClick={() => onDesfazer(receita.id, medicacao)}>
              Desfazer esta baixa
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => receita && medicacao && onSalvar(receita.id, medicacao, local, data, intervaloNum, usoUnico)}>
            Confirmar baixa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditarValidadeDialog({
  receita,
  onClose,
  onSalvar,
}: {
  receita: ReceitaSalva | null;
  onClose: () => void;
  onSalvar: (id: string, dias: number) => void;
}) {
  const [dias, setDias] = useState<string>("");
  useEffect(() => {
    if (receita) setDias(String(receita.validadeDias));
  }, [receita]);
  return (
    <Dialog open={!!receita} onOpenChange={(v) => { if (!v) { setDias(""); onClose(); } }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Editar validade</DialogTitle>
          <DialogDescription>
            Informe por quantos dias a medicação será usada. O vencimento é
            recalculado como <strong>data da receita + dias</strong>.
          </DialogDescription>
        </DialogHeader>
        {receita && (
          <div className="grid gap-3">
            <div className="text-sm text-muted-foreground">
              Emissão: {new Date(receita.dataEmissao).toLocaleDateString("pt-BR")}
            </div>
            <div className="grid gap-1">
              <Label>Dias de uso</Label>
              <Input
                type="number"
                min={1}
                value={dias}
                onChange={(e) => setDias(e.target.value)}
              />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => { setDias(""); onClose(); }}>Cancelar</Button>
          <Button
            onClick={() => {
              const n = Number(dias);
              if (!Number.isFinite(n) || n <= 0) {
                toast.error("Informe um número de dias válido.");
                return;
              }
              if (receita) onSalvar(receita.id, n);
              setDias("");
            }}
          >
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const ORIGENS = [
  "SUS/UBS",
  "Farmácia Popular",
  "GRS/Policlínica",
  "Compra própria",
  "Alto custo",
] as const;

function EditarReceitaDialog({
  receita,
  onClose,
  onSalvar,
  onArquivar,
}: {
  receita: ReceitaSalva | null;
  onClose: () => void;
  onSalvar: (id: string, patch: Partial<ReceitaSalva>) => void;
  onArquivar: (id: string, motivo: NonNullable<ReceitaSalva["motivoArquivamento"]>, obs?: string) => void;
}) {
  const [medicacao, setMedicacao] = useState("");
  const [dosagem, setDosagem] = useState("");
  const [dataEmissao, setDataEmissao] = useState("");
  const [dias, setDias] = useState("");
  const [prazoRet, setPrazoRet] = useState("");
  const [tipo, setTipo] = useState<(typeof TIPOS)[number]>("Branca simples");
  const [origem, setOrigem] = useState<(typeof ORIGENS)[number]>("SUS/UBS");
  const [medico, setMedico] = useState("");
  const [obs, setObs] = useState("");

  useEffect(() => {
    if (receita) {
      setMedicacao(receita.medicacao);
      setDosagem(receita.dosagem);
      setDataEmissao(receita.dataEmissao);
      setDias(String(receita.validadeDias));
      setPrazoRet(String(prazoRetiradaDe(receita)));
      setTipo(receita.tipo as (typeof TIPOS)[number]);
      setOrigem(receita.origem as (typeof ORIGENS)[number]);
      setMedico(receita.medico || "");
      setObs(receita.observacao || "");
    }
  }, [receita]);

  if (!receita) return null;

  function salvar() {
    const n = Number(dias);
    const p = Number(prazoRet);
    if (!medicacao.trim()) return toast.error("Informe a medicação.");
    if (!Number.isFinite(n) || n <= 0) return toast.error("Validade em dias inválida.");
    if (!Number.isFinite(p) || p <= 0) return toast.error("Prazo de retirada inválido.");
    onSalvar(receita!.id, {
      medicacao: medicacao.trim(),
      dosagem: dosagem.trim(),
      dataEmissao,
      validadeDias: n,
      prazoRetiradaDias: p,
      tipo,
      origem,
      medico: medico.trim() || "—",
      observacao: obs.trim() || undefined,
    });
  }

  return (
    <Dialog open={!!receita} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar receita</DialogTitle>
          <DialogDescription>
            Atualize qualquer informação ou marque a receita como suspensa,
            substituída ou com alteração de dosagem (vai para o Arquivo).
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1">
            <Label>Medicação</Label>
            <Input value={medicacao} onChange={(e) => setMedicacao(e.target.value)} />
          </div>
          <div className="grid gap-1">
            <Label>Dosagem / posologia</Label>
            <Input value={dosagem} onChange={(e) => setDosagem(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1">
              <Label>Data de emissão</Label>
              <Input type="date" value={dataEmissao} onChange={(e) => setDataEmissao(e.target.value)} />
            </div>
            <div className="grid gap-1">
              <Label>Validade (dias)</Label>
              <Input type="number" min={1} value={dias} onChange={(e) => setDias(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-1">
            <Label>Prazo para retirar/comprar (dias a partir da emissão)</Label>
            <Input
              type="number"
              min={1}
              value={prazoRet}
              onChange={(e) => setPrazoRet(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Regra padrão: 30 dias para receitas comuns; igual à validade para receitas de 180 dias.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1">
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as typeof tipo)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TIPOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-1">
              <Label>Origem</Label>
              <Select value={origem} onValueChange={(v) => setOrigem(v as typeof origem)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ORIGENS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-1">
            <Label>Médico</Label>
            <Input value={medico} onChange={(e) => setMedico(e.target.value)} />
          </div>
          <div className="grid gap-1">
            <Label>Observação</Label>
            <Input value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Ex.: motivo da troca, ajuste..." />
          </div>
          <div className="grid gap-2 rounded-md border p-3">
            <p className="text-sm font-medium">Sinalizar status (envia ao Arquivo)</p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => onArquivar(receita!.id, "suspensa", obs.trim() || undefined)}>
                Suspensa
              </Button>
              <Button size="sm" variant="outline" onClick={() => onArquivar(receita!.id, "substituida", obs.trim() || undefined)}>
                Substituída
              </Button>
              <Button size="sm" variant="outline" onClick={() => onArquivar(receita!.id, "alteracao_dosagem", obs.trim() || undefined)}>
                Alteração de dosagem
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={salvar}>Salvar alterações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type ManualProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  residentes: { id: string; nome: string }[];
  onSalvar: (
    dados: {
      residenteNome?: string;
      medico: string;
      medicacao: string;
      dosagem: string;
      dataEmissao: string;
      tipo: string;
      origem: string;
      duracaoTratamentoDias?: number | null;
    },
    residenteIdManual: string | undefined,
    validadeDias: number | undefined,
  ) => boolean;
};

function ReceitaManualDialog({ open, onOpenChange, residentes, onSalvar }: ManualProps) {
  const hoje = new Date().toISOString().slice(0, 10);
  const [residenteId, setResidenteId] = useState<string>("");
  const [medico, setMedico] = useState("");
  const [medicacao, setMedicacao] = useState("");
  const [dosagem, setDosagem] = useState("");
  const [dataEmissao, setDataEmissao] = useState(hoje);
  const [tipo, setTipo] = useState<(typeof TIPOS)[number]>("Branca simples");
  const [origem, setOrigem] = useState<(typeof ORIGENS)[number]>("SUS/UBS");
  const [validadeDias, setValidadeDias] = useState<string>("");

  function submit() {
    if (!residenteId) {
      toast.error("Selecione o residente.");
      return;
    }
    if (!medicacao.trim()) {
      toast.error("Informe a medicação.");
      return;
    }
    const vd =
      validadeDias.trim() === ""
        ? validadePadraoPorTipo(tipo)
        : Number(validadeDias);
    if (!Number.isFinite(vd) || vd <= 0) {
      toast.error("Validade em dias inválida.");
      return;
    }
    const ok = onSalvar(
      {
        medico: medico.trim(),
        medicacao: medicacao.trim(),
        dosagem: dosagem.trim(),
        dataEmissao,
        tipo,
        origem,
      },
      residenteId,
      vd,
    );
    if (ok) {
      // reset
      setMedicacao("");
      setDosagem("");
      setMedico("");
      setValidadeDias("");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova receita manual</DialogTitle>
          <DialogDescription>
            Use quando o leitor de PDF não funcionar ou para registrar uma receita
            antiga.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1">
            <Label>Residente</Label>
            <Select value={residenteId} onValueChange={setResidenteId}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {residentes.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{formatNome(r.nome)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1">
            <Label>Medicação</Label>
            <Input value={medicacao} onChange={(e) => setMedicacao(e.target.value)} placeholder="Ex.: Risperidona 2mg" />
          </div>
          <div className="grid gap-1">
            <Label>Dosagem / posologia</Label>
            <Input value={dosagem} onChange={(e) => setDosagem(e.target.value)} placeholder="Ex.: 1 cp 12/12h" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1">
              <Label>Data de emissão</Label>
              <Input type="date" value={dataEmissao} onChange={(e) => setDataEmissao(e.target.value)} />
            </div>
            <div className="grid gap-1">
              <Label>Validade (dias)</Label>
              <Input
                type="number"
                min={1}
                value={validadeDias}
                onChange={(e) => setValidadeDias(e.target.value)}
                placeholder={`padrão: ${validadePadraoPorTipo(tipo)}`}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1">
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as typeof tipo)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1">
              <Label>Origem</Label>
              <Select value={origem} onValueChange={(v) => setOrigem(v as typeof origem)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ORIGENS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-1">
            <Label>Médico (opcional)</Label>
            <Input value={medico} onChange={(e) => setMedico(e.target.value)} placeholder="Dr(a)..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit}>Salvar receita</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}