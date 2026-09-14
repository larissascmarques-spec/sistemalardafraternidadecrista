import { createFileRoute } from "@tanstack/react-router";
import { formatNome } from "@/lib/format-nome";
import { Fragment, useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  diasRestantesEstoque,
  diasAte,
  ORIGENS_ESTOQUE,
  TIPOS_USO_MED,
  rotuloTipoUso,
  type EstoqueItem,
} from "@/lib/mock-data";
import {
  useEstoque,
  adicionarItem,
  adicionarVarios,
  atualizarItem,
  removerItem,
  type EstoqueRow,
} from "@/lib/estoque-store";
import { fmtIsoBR } from "@/lib/date-utils";
import { useAllResidentes } from "@/lib/residentes-store";
import { isHaldolDecanoato, consumoDiaHaldol } from "@/lib/haldol";
import { consumoGrupoLotes, sequenciaLotes, saldoLote, saldoGrupo } from "@/lib/lotes";
import {
  ehSolucaoGotas,
  gotasParaMl,
  mlParaGotas,
  textoConsumoDia,
  textoQuantidade,
} from "@/lib/unidades";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PackagePlus,
  FileSpreadsheet,
  Download,
  Pencil,
  Trash2,
  Plus,
  X,
  ChevronDown,
  ChevronRight,
  Check,
} from "lucide-react";

export const Route = createFileRoute("/estoque")({
  component: Page,
});

type Form = {
  medicacao: string;
  apresentacao: string;
  lote: string;
  validade: string;
  quantidade: string;
  estoqueMinimo: string;
  consumoDiario: string;
  origem: string;
  local: string;
  tipoUso: "continua" | "nao_continua" | "queixa_simples";
  lancadoEm: string;
  ampolas: string;
  intervaloDias: string;
  unidade: "unidade" | "ml";
  gotasPorMl: string;
};

const formVazio: Form = {
  medicacao: "",
  apresentacao: "Comprimido",
  lote: "",
  validade: "",
  quantidade: "",
  estoqueMinimo: "",
  consumoDiario: "",
  origem: "SUS/UBS",
  local: "",
  tipoUso: "continua",
  lancadoEm: new Date().toISOString().slice(0, 10),
  ampolas: "1",
  intervaloDias: "30",
  unidade: "unidade",
  gotasPorMl: "20",
};

function Page() {
  const { itens } = useEstoque();
  const [abrirManual, setAbrirManual] = useState(false);
  const [abrirPlanilha, setAbrirPlanilha] = useState(false);
  const [editando, setEditando] = useState<EstoqueRow | null>(null);
  const [form, setForm] = useState<Form>(formVazio);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [importando, setImportando] = useState(false);
  const [expandido, setExpandido] = useState<Record<string, boolean>>({});
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [ordenacao, setOrdenacao] = useState<string>("dias_restantes");
  const [edicaoLancado, setEdicaoLancado] = useState<Record<string, string>>({});
  const [edicaoQtd, setEdicaoQtd] = useState<Record<string, string>>({});
  const [filtroResidente, setFiltroResidente] = useState<string>("todos");
  const { todos: residentes, nomePor } = useAllResidentes();
  // Residentes que já vão usar o lote que está sendo lançado.
  const [pacientesNovo, setPacientesNovo] = useState<Paciente[]>([]);

  const lista = itens
    .map((e) => ({ ...e, dias: diasRestantesEstoque(e), validadeDias: diasAte(e.validade) }))
    .sort((a, b) => a.dias - b.dias);

  // Agrupa por medicação + apresentação (1 linha por medicação; lotes ficam dentro).
  type GrupoMed = {
    chave: string;
    medicacao: string;
    apresentacao: string;
    tipoUso: string;
    estoqueMinimo: number;
    consumoDiario: number;
    quantidade: number;
    dias: number;
    proximaValidade: string;
    validadeDias: number;
    proximaCompra?: string;
    ultimaRetirada?: string;
    proximaRetirada?: string;
    lotes: typeof lista;
    residentes: string[];
  };
  const gruposMap = new Map<string, GrupoMed>();
  for (const it of lista) {
    if (filtroTipo !== "todos" && (it.tipoUso || "continua") !== filtroTipo) continue;
    const chave = `${it.medicacao.toLowerCase()}|${it.apresentacao.toLowerCase()}`;
    const g = gruposMap.get(chave);
    const residentesLote = (it.pacientesUso ?? []).map((p) => p.residenteId).filter(Boolean);
    if (!g) {
      gruposMap.set(chave, {
        chave,
        medicacao: it.medicacao,
        apresentacao: it.apresentacao,
        tipoUso: it.tipoUso || "continua",
        estoqueMinimo: it.estoqueMinimo,
        consumoDiario: it.consumoDiario,
        quantidade: saldoLote(it as never),
        dias: it.dias,
        proximaValidade: it.validade,
        validadeDias: it.validadeDias,
        proximaCompra: it.proximaCompra,
        ultimaRetirada: it.ultimaRetirada,
        proximaRetirada: it.proximaRetirada,
        lotes: [it],
        residentes: residentesLote,
      });
    } else {
      g.quantidade += saldoLote(it as never);
      g.lotes.push(it);
      g.residentes = Array.from(new Set([...g.residentes, ...residentesLote]));
      if (it.proximaCompra && (!g.proximaCompra || it.proximaCompra < g.proximaCompra)) {
        g.proximaCompra = it.proximaCompra;
      }
      if (!g.ultimaRetirada && it.ultimaRetirada) g.ultimaRetirada = it.ultimaRetirada;
      if (!g.proximaRetirada && it.proximaRetirada) g.proximaRetirada = it.proximaRetirada;
      if (it.validadeDias < g.validadeDias) {
        g.validadeDias = it.validadeDias;
        g.proximaValidade = it.validade;
      }
    }
  }
  const grupos = Array.from(gruposMap.values()).map((g) => ({
    ...g,
    // Consumo do grupo: soma por residente (a mesma residente em dois lotes
    // consome uma vez só). Os lotes são usados em sequência, do menor para o maior.
    consumoDiario: consumoGrupoLotes(g.lotes),
    quantidade: saldoGrupo(g.lotes as never),
    dias:
      consumoGrupoLotes(g.lotes) > 0
        ? Math.floor(saldoGrupo(g.lotes as never) / consumoGrupoLotes(g.lotes))
        : 999,
  })).filter((g) => filtroResidente === "todos" || g.residentes.includes(filtroResidente))
    .sort((a, b) => {
    if (ordenacao === "alfabetica") return a.medicacao.localeCompare(b.medicacao);
    if (ordenacao === "residente") {
      const nomeA = nomePor(a.residentes[0] || "").toLowerCase() || a.medicacao.toLowerCase();
      const nomeB = nomePor(b.residentes[0] || "").toLowerCase() || b.medicacao.toLowerCase();
      return nomeA.localeCompare(nomeB);
    }
    if (ordenacao === "proxima_compra") {
      const pa = a.proximaCompra || "9999-12-31";
      const pb = b.proximaCompra || "9999-12-31";
      return pa.localeCompare(pb);
    }
    return a.dias - b.dias;
  });

  async function salvarManual() {
    if (!form.medicacao.trim() || !form.lote.trim() || !form.validade || !form.quantidade) {
      toast.error("Preencha medicação, lote, validade e quantidade.");
      return;
    }
    const emGotas = form.unidade === "ml";
    const gotasMl = Number(form.gotasPorMl) || 20;
    const consumoBase = isHaldolDecanoato(form.medicacao)
      ? consumoDiaHaldol(Number(form.ampolas) || 0, Number(form.intervaloDias) || 0)
      : Number(form.consumoDiario) || 0;
    // Se marcou residentes, o consumo/dia vem da soma deles.
    const pacientesValidos = pacientesNovo
      .filter((p) => p.residenteId && (Number(p.qtdDia) > 0 || p.seNecessario))
      .map((p) => ({
        ...p,
        qtdDia: emGotas ? Number(p.qtdDia) / gotasMl : Number(p.qtdDia),
      }));
    const consumoPacientes = pacientesValidos.reduce(
      (a, p) => a + (p.seNecessario ? 0 : p.qtdDia),
      0,
    );
    await adicionarItem({
      medicacao: form.medicacao.trim(),
      apresentacao: form.apresentacao.trim() || "Comprimido",
      lote: form.lote.trim(),
      validade: form.validade,
      quantidade: Number(form.quantidade) || 0,
      estoqueMinimo: Number(form.estoqueMinimo) || 0,
      // Em soluções, a pessoa digita gotas/dia e guardamos em ml/dia.
      consumoDiario:
        consumoPacientes > 0
          ? consumoPacientes
          : emGotas
            ? consumoBase / gotasMl
            : consumoBase,
      pacientesUso: pacientesValidos,
      unidade: form.unidade,
      gotasPorMl: emGotas ? gotasMl : undefined,
      origem: form.origem || "SUS/UBS",
      local: form.local.trim() || "Armário A1",
      tipoUso: form.tipoUso,
      lancadoEm: form.lancadoEm || new Date().toISOString().slice(0, 10),
    });
    toast.success("Item lançado no estoque.");
    setForm(formVazio);
    setPacientesNovo([]);
    setAbrirManual(false);
  }

  async function baixarModelo() {
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      [
        "medicacao",
        "apresentacao",
        "lote",
        "validade",
        "quantidade",
        "estoqueMinimo",
        "consumoDiario",
        "origem",
        "local",
      ],
      [
        "Risperidona 2mg",
        "Comprimido",
        "L23A45",
        "2026-12-31",
        60,
        60,
        2,
        "SUS/UBS",
        "Armário A1",
      ],
    ]);
    XLSX.utils.book_append_sheet(wb, ws, "Estoque");
    XLSX.writeFile(wb, "modelo-estoque.xlsx");
  }

  async function normalizarData(v: unknown): Promise<string> {
    if (!v) return "";
    if (v instanceof Date) return v.toISOString().slice(0, 10);
    if (typeof v === "number") {
      // Excel serial date
      const XLSX = await import("xlsx");
      const d = XLSX.SSF.parse_date_code(v);
      if (d) {
        const iso = new Date(Date.UTC(d.y, d.m - 1, d.d)).toISOString().slice(0, 10);
        return iso;
      }
    }
    const s = String(v).trim();
    // dd/mm/yyyy
    const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (m) return `${m[3]}-${m[2]}-${m[1]}`;
    // já é yyyy-mm-dd
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    const dt = new Date(s);
    if (!isNaN(dt.getTime())) return dt.toISOString().slice(0, 10);
    return "";
  }

  async function importarPlanilha() {
    if (!arquivo) {
      toast.error("Selecione um arquivo .xlsx ou .csv.");
      return;
    }
    setImportando(true);
    try {
      const XLSX = await import("xlsx");
      const buf = await arquivo.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const linhas = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
      const novos: Array<Omit<EstoqueItem, "codigo">> = [];
      const erros: string[] = [];
      for (let i = 0; i < linhas.length; i++) {
        const linha = linhas[i];
        const med = String(linha["medicacao"] || linha["Medicação"] || linha["medicação"] || "").trim();
        const lote = String(linha["lote"] || linha["Lote"] || "").trim();
        const qtd = Number(linha["quantidade"] || linha["Qtd"] || linha["quantidade"] || 0);
        const validade = await normalizarData(linha["validade"] || linha["Validade"]);
        if (!med || !lote || !validade || !qtd) {
          erros.push(`Linha ${i + 2}: dados incompletos`);
          continue;
        }
        novos.push({
          medicacao: med,
          apresentacao: String(linha["apresentacao"] || linha["Apresentação"] || "Comprimido"),
          lote,
          validade,
          quantidade: qtd,
          estoqueMinimo: Number(linha["estoqueMinimo"] || linha["Mínimo"] || 0),
          consumoDiario: Number(linha["consumoDiario"] || linha["Consumo/dia"] || 0),
          origem: String(linha["origem"] || linha["Origem"] || "SUS/UBS"),
          local: String(linha["local"] || linha["Local"] || "Armário A1"),
        });
      }
      if (novos.length === 0) {
        toast.error("Nenhuma linha válida encontrada na planilha.");
        return;
      }
      const { inseridos, atualizados } = await adicionarVarios(novos);
      toast.success(
        `${inseridos} novos, ${atualizados} atualizados${erros.length ? `, ${erros.length} com erro` : ""}.`,
      );
      setArquivo(null);
      setAbrirPlanilha(false);
    } catch (e) {
      toast.error("Não consegui ler a planilha.");
      console.error(e);
    } finally {
      setImportando(false);
    }
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Medicações"
        description="Estoque, lotes, validade e retirada de receitas."
        actions={
          <div className="flex flex-wrap gap-2 items-center">
            <Select value={filtroResidente} onValueChange={setFiltroResidente}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Residente" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas as residentes</SelectItem>
                {residentes.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{formatNome(r.nome)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                {TIPOS_USO_MED.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={ordenacao} onValueChange={setOrdenacao}>
              <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="dias_restantes">Ordenar: dias restantes</SelectItem>
                <SelectItem value="alfabetica">Ordenar: A a Z</SelectItem>
                <SelectItem value="residente">Ordenar: por residente</SelectItem>
                <SelectItem value="proxima_compra">Ordenar: próxima compra</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => setAbrirPlanilha(true)}>
              <FileSpreadsheet className="mr-2 h-4 w-4" /> Importar planilha
            </Button>
            <Button onClick={() => setAbrirManual(true)}>
              <PackagePlus className="mr-2 h-4 w-4" /> Lançar entrada
            </Button>
          </div>
        }
      />
      <p className="text-xs text-muted-foreground">
        A retirada de receitas foi movida para o perfil de cada residente.{" "}
        <Link to="/residentes" className="underline">Abrir residentes</Link>.
      </p>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Medicação</TableHead>
                <TableHead>Tipo de uso</TableHead>
                <TableHead className="text-right">Qtd total</TableHead>
                <TableHead className="text-right">Mínimo</TableHead>
                <TableHead className="text-right">Consumo/dia</TableHead>
                <TableHead>Dias restantes</TableHead>
                <TableHead>Próx. validade</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {grupos.map((g) => {
                const aberto = !!expandido[g.chave];
                const precisa =
                  g.tipoUso !== "queixa_simples" && g.quantidade <= g.estoqueMinimo;
                // Lotes são consumidos em sequência: do menor para o maior.
                const seq = sequenciaLotes(g.lotes);
                const lotesOrdenados = [...g.lotes].sort(
                  (a, b) => (a.quantidade || 0) - (b.quantidade || 0),
                );
                return (
                  <Fragment key={g.chave}>
                    <TableRow className="cursor-pointer" onClick={() => setExpandido({ ...expandido, [g.chave]: !aberto })}>
                      <TableCell>
                        {aberto ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </TableCell>
                      <TableCell className="font-medium">
                        {g.medicacao}
                        <span className="ml-2 text-xs text-muted-foreground">
                          {g.apresentacao} · {g.lotes.length} lote{g.lotes.length > 1 ? "s" : ""}
                        </span>
                        {g.residentes.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {g.residentes.map((rid) => (
                              <Badge key={rid} variant="secondary" className="text-[10px] font-normal">
                                {nomePor(rid).split(" ")[0]}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{rotuloTipoUso(g.tipoUso)}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {textoQuantidade(g.quantidade, g.lotes[0])}
                      </TableCell>
                      <TableCell className="text-right">
                        {g.tipoUso === "queixa_simples" ? "—" : g.estoqueMinimo}
                      </TableCell>
                      <TableCell className="text-right">
                        {g.consumoDiario > 0 ? textoConsumoDia(g.consumoDiario, g.lotes[0]) : "—"}
                      </TableCell>
                      <TableCell>{g.consumoDiario > 0 ? `${g.dias} dias` : "—"}</TableCell>
                      <TableCell>
                        {g.proximaValidade ? fmtIsoBR(g.proximaValidade) : "—"}
                        {g.proximaValidade && g.validadeDias <= 10 && (
                          <Badge variant="destructive" className="ml-2">Vence em {g.validadeDias}d</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {precisa ? (
                          <Badge variant="destructive">Comprar</Badge>
                        ) : (
                          <Badge className="bg-[color:var(--success)]/15 text-[color:var(--success)]">OK</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                    {aberto && (
                      <TableRow>
                        <TableCell></TableCell>
                         <TableCell colSpan={8} className="bg-muted/30">
                           <div className="flex items-center justify-between mb-2">
                             <div className="text-xs font-medium text-muted-foreground">Lotes</div>
                             <Button
                               size="sm"
                               variant="outline"
                               onClick={(ev) => {
                                 ev.stopPropagation();
                                 const base = g.lotes[0];
                                 setForm({
                                   ...formVazio,
                                   medicacao: g.medicacao,
                                   apresentacao: g.apresentacao,
                                   estoqueMinimo: String(g.estoqueMinimo || ""),
                                   consumoDiario: String(g.consumoDiario || ""),
                                   origem: base?.origem || "SUS/UBS",
                                   local: base?.local || "",
                                   tipoUso: (g.tipoUso as Form["tipoUso"]) || "continua",
                                   lancadoEm: new Date().toISOString().slice(0, 10),
                                 });
                                 setAbrirManual(true);
                               }}
                             >
                               <Plus className="mr-1 h-3 w-3" /> Novo lote
                             </Button>
                           </div>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Lote</TableHead>
                                <TableHead>Validade</TableHead>
                                <TableHead>Lançado em</TableHead>
                                <TableHead className="text-right">Quantidade</TableHead>
                                <TableHead>Quem usa este lote</TableHead>
                                <TableHead>Uso previsto</TableHead>
                                <TableHead>Local</TableHead>
                                <TableHead>Origem</TableHead>
                                <TableHead></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {lotesOrdenados.map((e) => (
                                <TableRow key={e.id}>
                                  <TableCell>{e.lote || "—"}</TableCell>
                                  <TableCell>{e.validade ? fmtIsoBR(e.validade) : "—"}</TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-1">
                                      <Input
                                        type="date"
                                        className="h-8 w-[150px]"
                                        value={edicaoLancado[e.id] ?? (e.lancadoEm || "")}
                                        onClick={(ev) => ev.stopPropagation()}
                                        onChange={(ev) =>
                                          setEdicaoLancado({ ...edicaoLancado, [e.id]: ev.target.value })
                                        }
                                      />
                                      {edicaoLancado[e.id] !== undefined &&
                                        edicaoLancado[e.id] !== (e.lancadoEm || "") && (
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            title="Salvar data"
                                            onClick={async (ev) => {
                                              ev.stopPropagation();
                                              await atualizarItem(e.id, { lancadoEm: edicaoLancado[e.id] });
                                              setEdicaoLancado((prev) => {
                                                const cp = { ...prev };
                                                delete cp[e.id];
                                                return cp;
                                              });
                                              toast.success("Data de lançamento atualizada.");
                                            }}
                                          >
                                            <Check className="h-4 w-4" />
                                          </Button>
                                        )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex items-center gap-1 justify-end">
                                      <Input
                                        type="number"
                                        className="h-8 w-20 text-right"
                                        value={edicaoQtd[e.id] ?? String(e.quantidade)}
                                        onClick={(ev) => ev.stopPropagation()}
                                        onChange={(ev) =>
                                          setEdicaoQtd({ ...edicaoQtd, [e.id]: ev.target.value })
                                        }
                                      />
                                      {ehSolucaoGotas(e) && (
                                        <span className="text-[10px] text-muted-foreground">ml</span>
                                      )}
                                      {edicaoQtd[e.id] !== undefined &&
                                        Number(edicaoQtd[e.id]) !== e.quantidade && (
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            title="Salvar quantidade"
                                            onClick={async (ev) => {
                                              ev.stopPropagation();
                                              await atualizarItem(e.id, {
                                                quantidade: Number(edicaoQtd[e.id]) || 0,
                                              });
                                              setEdicaoQtd((prev) => {
                                                const cp = { ...prev };
                                                delete cp[e.id];
                                                return cp;
                                              });
                                              toast.success("Quantidade atualizada.");
                                            }}
                                          >
                                            <Check className="h-4 w-4" />
                                          </Button>
                                        )}
                                    </div>
                                    {saldoLote(e as EstoqueRow) !== (Number(e.quantidade) || 0) && (
                                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                                        saldo hoje: <strong>{saldoLote(e as EstoqueRow)}</strong>
                                      </p>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {(e.pacientesUso ?? []).length > 0 ? (
                                      <div className="flex flex-col gap-1">
                                        <div className="flex flex-wrap gap-1">
                                          {(e.pacientesUso ?? []).map((p, i) => (
                                            <Badge
                                              key={`${e.id}-${p.residenteId}-${i}`}
                                              variant="secondary"
                                              className="text-[10px] font-normal"
                                            >
                                              {nomePor(p.residenteId).split(" ")[0]} ·{" "}
                                              {p.seNecessario
                                                ? "se necessário"
                                                : ehSolucaoGotas(e)
                                                  ? `${Math.round(mlParaGotas(p.qtdDia, e))} gotas/dia`
                                                  : `${p.qtdDia}/dia`}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    ) : (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 text-xs"
                                        onClick={(ev) => {
                                          ev.stopPropagation();
                                          setEditando(e as EstoqueRow);
                                        }}
                                      >
                                        Definir residentes
                                      </Button>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {(() => {
                                      const s = seq.get(e.id);
                                      if (s?.acabou) {
                                        return (
                                          <div className="flex flex-col gap-0.5">
                                            <Badge variant="destructive" className="w-fit text-[10px] font-normal">
                                              Acabou · saldo 0
                                            </Badge>
                                            <span className="text-[10px] text-muted-foreground">
                                              {e.quantidade} lançados em {fmtIsoBR(e.ultimaBaixa || e.lancadoEm || "")} · {s.consumo}/dia
                                            </span>
                                          </div>
                                        );
                                      }
                                      if (!s || s.consumo <= 0) {
                                        const sos = (e.pacientesUso ?? []).some(
                                          (p) => p.seNecessario,
                                        );
                                        return (
                                          <span className="text-[11px] text-muted-foreground">
                                            {sos ? "uso se necessário" : "sem consumo definido"}
                                          </span>
                                        );
                                      }
                                      return (
                                        <div className="flex flex-col gap-0.5">
                                          {s.emUso ? (
                                            <Badge className="w-fit bg-[color:var(--success)]/15 text-[color:var(--success)] text-[10px] font-normal">
                                              1º · em uso agora
                                            </Badge>
                                          ) : (
                                            <Badge variant="outline" className="w-fit text-[10px] font-normal">
                                              {s.ordem}º · começa em {s.inicioDias} dias
                                            </Badge>
                                          )}
                                          <span className="text-[10px] text-muted-foreground">
                                            dura {s.duracaoDias} dias
                                            {(() => {
                                              const usam = (e.pacientesUso ?? []).filter(
                                                (p) => p.residenteId && !p.seNecessario,
                                              );
                                              return usam.length > 0
                                                ? ` para ${usam
                                                    .map((p) => nomePor(p.residenteId).split(" ")[0])
                                                    .join(" e ")}`
                                                : "";
                                            })()}{" "}
                                            · acaba em {fmtIsoBR(s.fimData)}
                                          </span>
                                        </div>
                                      );
                                    })()}
                                  </TableCell>
                                  <TableCell>{e.local}</TableCell>
                                  <TableCell>{e.origem}</TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-1 justify-end">
                                      <Button size="sm" variant="ghost" onClick={(ev) => { ev.stopPropagation(); setEditando(e as EstoqueRow); }} title="Editar">
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={async (ev) => {
                                          ev.stopPropagation();
                                          if (confirm(`Remover lote ${e.lote || ""} de ${e.medicacao}?`)) {
                                            await removerItem(e.id);
                                            toast.success("Lote removido.");
                                          }
                                        }}
                                        title="Remover"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <EditarEstoqueDialog
        item={editando}
        residentes={residentes}
        nomePor={nomePor}
        onClose={() => setEditando(null)}
        onSalvar={async (id, patch) => {
          await atualizarItem(id, patch);
          setEditando(null);
          toast.success("Item atualizado.");
        }}
      />

      <Dialog open={abrirManual} onOpenChange={setAbrirManual}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Lançar entrada de medicação</DialogTitle>
            <DialogDescription>Preencha os dados do lote recebido.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <Label>Medicação</Label>
              <Input
                value={form.medicacao}
                onChange={(e) => setForm({ ...form, medicacao: e.target.value })}
                placeholder="Ex.: Risperidona 2mg"
              />
            </div>
            <div>
              <Label>Tipo de uso</Label>
              <Select
                value={form.tipoUso}
                onValueChange={(v) => setForm({ ...form, tipoUso: v as Form["tipoUso"] })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS_USO_MED.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Data de lançamento no estoque</Label>
              <Input
                type="date"
                value={form.lancadoEm}
                onChange={(e) => setForm({ ...form, lancadoEm: e.target.value })}
              />
            </div>
            <div>
              <Label>Apresentação</Label>
              <Input
                value={form.apresentacao}
                onChange={(e) => setForm({ ...form, apresentacao: e.target.value })}
              />
            </div>
            <div>
              <Label>Como conta este estoque</Label>
              <Select
                value={form.unidade}
                onValueChange={(v) => setForm({ ...form, unidade: v as Form["unidade"] })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unidade">Comprimido / ampola / unidade</SelectItem>
                  <SelectItem value="ml">Solução em ml (dose em gotas)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Lote</Label>
              <Input value={form.lote} onChange={(e) => setForm({ ...form, lote: e.target.value })} />
            </div>
            <div>
              <Label>Validade</Label>
              <Input
                type="date"
                value={form.validade}
                onChange={(e) => setForm({ ...form, validade: e.target.value })}
              />
            </div>
            <div>
              <Label>
                {form.unidade === "ml" ? "Quantidade total (ml)" : "Quantidade"}
              </Label>
              <Input
                type="number"
                value={form.quantidade}
                onChange={(e) => setForm({ ...form, quantidade: e.target.value })}
              />
              {form.unidade === "ml" && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Some os ml de todos os frascos deste lote (ex.: 2 frascos de 20 ml = 40).
                </p>
              )}
            </div>
            {form.unidade === "ml" && (
              <div>
                <Label>Gotas por ml</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.gotasPorMl}
                  onChange={(e) => setForm({ ...form, gotasPorMl: e.target.value })}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Padrão: 20 gotas = 1 ml.
                </p>
              </div>
            )}
            <div>
              <Label>Estoque mínimo</Label>
              <Input
                type="number"
                value={form.estoqueMinimo}
                onChange={(e) => setForm({ ...form, estoqueMinimo: e.target.value })}
              />
            </div>
            {isHaldolDecanoato(form.medicacao) ? (
              <>
                <div>
                  <Label>Ampolas por dose</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.5"
                    value={form.ampolas}
                    onChange={(e) => setForm({ ...form, ampolas: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Intervalo entre doses (dias)</Label>
                  <Select
                    value={form.intervaloDias}
                    onValueChange={(v) => setForm({ ...form, intervaloDias: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="21">a cada 21 dias</SelectItem>
                      <SelectItem value="30">a cada 30 dias</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Injetável de depósito: não é uso diário. O sistema calcula a
                    média de{" "}
                    {consumoDiaHaldol(
                      Number(form.ampolas) || 0,
                      Number(form.intervaloDias) || 0,
                    ).toFixed(2)}{" "}
                    ampola/dia só para estimar a duração do estoque.
                  </p>
                </div>
              </>
            ) : (
              <div>
                <Label>
                  {form.unidade === "ml" ? "Consumo por dia (gotas)" : "Consumo por dia"}
                </Label>
                <Input
                  type="number"
                  value={form.consumoDiario}
                  onChange={(e) => setForm({ ...form, consumoDiario: e.target.value })}
                />
                {form.unidade === "ml" && Number(form.consumoDiario) > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Equivale a{" "}
                    {(
                      Number(form.consumoDiario) / (Number(form.gotasPorMl) || 20)
                    ).toFixed(2)}{" "}
                    ml por dia.
                  </p>
                )}
              </div>
            )}
            <div>
              <Label>Origem</Label>
              <Select value={form.origem} onValueChange={(v) => setForm({ ...form, origem: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ORIGENS_ESTOQUE.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Local de armazenamento</Label>
              <Input value={form.local} onChange={(e) => setForm({ ...form, local: e.target.value })} />
            </div>
          </div>

          <div className="mt-2 rounded-md border p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium">Quem usa este lote</p>
                <p className="text-xs text-muted-foreground">
                  {isHaldolDecanoato(form.medicacao)
                    ? "Informe ampolas por dose e o intervalo (21 ou 30 dias) de cada residente."
                    : form.unidade === "ml"
                      ? "Informe quantas gotas por dia cada residente usa deste lote."
                      : "Informe quantos por dia cada residente usa deste lote."}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setPacientesNovo([
                    ...pacientesNovo,
                    isHaldolDecanoato(form.medicacao)
                      ? {
                          residenteId: "",
                          qtdDia: consumoDiaHaldol(1, 30),
                          ampolas: 1,
                          intervaloDias: 30,
                        }
                      : { residenteId: "", qtdDia: 1 },
                  ])
                }
              >
                <Plus className="mr-1 h-3 w-3" /> Adicionar residente
              </Button>
            </div>

            {pacientesNovo.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Opcional. Se marcar, o consumo por dia é calculado sozinho.
              </p>
            )}

            {pacientesNovo.map((p, i) => {
              const haldol = isHaldolDecanoato(form.medicacao);
              const atualizar = (patch: Partial<Paciente>) =>
                setPacientesNovo(
                  pacientesNovo.map((x, idx) => {
                    if (idx !== i) return x;
                    const m = { ...x, ...patch };
                    if (haldol) {
                      m.qtdDia = consumoDiaHaldol(
                        Number(m.ampolas) || 0,
                        Number(m.intervaloDias) || 0,
                      );
                    }
                    return m;
                  }),
                );
              return (
                <div
                  key={i}
                  className={
                    haldol
                      ? "grid grid-cols-[1fr_100px_110px_auto] gap-2 items-end"
                      : "grid grid-cols-[1fr_120px_130px_auto] gap-2 items-end"
                  }
                >
                  <div>
                    <Label className="text-xs">Residente</Label>
                    <Select
                      value={p.residenteId}
                      onValueChange={(v) => atualizar({ residenteId: v })}
                    >
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {residentes.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {formatNome(r.nome)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {haldol ? (
                    <>
                      <div>
                        <Label className="text-xs">Ampolas/dose</Label>
                        <Input
                          type="number"
                          min={0}
                          step="0.5"
                          value={p.ampolas ?? 1}
                          onChange={(e) => atualizar({ ampolas: Number(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Intervalo (dias)</Label>
                        <Input
                          type="number"
                          min={1}
                          value={p.intervaloDias ?? 30}
                          onChange={(e) => atualizar({ intervaloDias: Number(e.target.value) })}
                        />
                      </div>
                    </>
                  ) : (
                    <div>
                      <Label className="text-xs">
                        {form.unidade === "ml" ? "Gotas/dia" : "Qtd/dia"}
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        step="0.5"
                        value={p.qtdDia}
                        onChange={(e) => atualizar({ qtdDia: Number(e.target.value) })}
                      />
                    </div>
                  )}
                  {!haldol && (
                    <label className="flex items-center gap-2 pb-2 text-xs text-muted-foreground">
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={!!p.seNecessario}
                        onChange={(e) => atualizar({ seNecessario: e.target.checked })}
                      />
                      Se necessário
                    </label>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      setPacientesNovo(pacientesNovo.filter((_, idx) => idx !== i))
                    }
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAbrirManual(false)}>
              Cancelar
            </Button>
            <Button onClick={salvarManual}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={abrirPlanilha} onOpenChange={setAbrirPlanilha}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importar estoque por planilha</DialogTitle>
            <DialogDescription>
              Envie um arquivo .xlsx ou .csv. Use as colunas: medicacao, apresentacao, lote, validade, quantidade,
              estoqueMinimo, consumoDiario, origem, local.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Button variant="outline" size="sm" onClick={baixarModelo}>
              <Download className="mr-2 h-4 w-4" /> Baixar modelo
            </Button>
            <Input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
            />
            {arquivo && <p className="text-sm text-muted-foreground">Selecionado: {arquivo.name}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAbrirPlanilha(false)} disabled={importando}>
              Cancelar
            </Button>
            <Button onClick={importarPlanilha} disabled={importando || !arquivo}>
              {importando ? "Importando..." : "Importar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type Paciente = {
  residenteId: string;
  qtdDia: number;
  seNecessario?: boolean;
  ampolas?: number;
  intervaloDias?: number;
  proximaAplicacao?: string;
};

function EditarEstoqueDialog({
  item,
  residentes,
  nomePor,
  onClose,
  onSalvar,
}: {
  item: EstoqueRow | null;
  residentes: { id: string; nome: string }[];
  nomePor: (id: string) => string;
  onClose: () => void;
  onSalvar: (id: string, patch: Partial<EstoqueItem>) => void;
}) {
  const [medicacao, setMedicacao] = useState("");
  const [apresentacao, setApresentacao] = useState("");
  const [lote, setLote] = useState("");
  const [validade, setValidade] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [estoqueMinimo, setEstoqueMinimo] = useState("");
  const [origem, setOrigem] = useState<string>("UBS");
  const [local, setLocal] = useState("");
  const [proximaCompra, setProximaCompra] = useState("");
  const [obs, setObs] = useState("");
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [tipoUso, setTipoUso] = useState<"continua" | "nao_continua" | "queixa_simples">("continua");
  const [lancadoEm, setLancadoEm] = useState("");
  const [unidade, setUnidade] = useState<"unidade" | "ml">("unidade");
  const [gotasPorMl, setGotasPorMl] = useState("20");

  useEffect(() => {
    if (item) {
      setMedicacao(item.medicacao);
      setApresentacao(item.apresentacao);
      setLote(item.lote);
      setValidade(item.validade);
      setQuantidade(String(item.quantidade));
      setEstoqueMinimo(String(item.estoqueMinimo));
      setOrigem(item.origem || "UBS");
      setLocal(item.local);
      setProximaCompra(item.proximaCompra || "");
      setObs(item.observacao || "");
      setPacientes(item.pacientesUso ?? []);
      setTipoUso((item.tipoUso as typeof tipoUso) || "continua");
      setLancadoEm(item.lancadoEm || "");
      setUnidade((item.unidade as "unidade" | "ml") || "unidade");
      setGotasPorMl(String(item.gotasPorMl || 20));
    }
  }, [item]);

  if (!item) return null;

  const totalDia = pacientes.reduce(
    (a, p) => a + (p.seNecessario ? 0 : Number(p.qtdDia) || 0),
    0,
  );

  function addPaciente() {
    const haldol = isHaldolDecanoato(medicacao);
    setPacientes([
      ...pacientes,
      haldol
        ? { residenteId: residentes[0]?.id ?? "", qtdDia: consumoDiaHaldol(1, 30), ampolas: 1, intervaloDias: 30 }
        : { residenteId: residentes[0]?.id ?? "", qtdDia: 1 },
    ]);
  }
  function removerPaciente(i: number) {
    setPacientes(pacientes.filter((_, idx) => idx !== i));
  }
  function atualizarPaciente(i: number, patch: Partial<Paciente>) {
    setPacientes(
      pacientes.map((p, idx) => {
        if (idx !== i) return p;
        const merged = { ...p, ...patch };
        // Se for Haldol Decanoato, recalcula qtdDia a partir de ampolas / intervalo
        if (isHaldolDecanoato(medicacao)) {
          merged.qtdDia = consumoDiaHaldol(
            Number(merged.ampolas) || 0,
            Number(merged.intervaloDias) || 0,
          );
        }
        return merged;
      }),
    );
  }

  function salvar() {
    if (!medicacao.trim()) return toast.error("Informe a medicação.");
    onSalvar(item!.id, {
      medicacao: medicacao.trim(),
      apresentacao: apresentacao.trim(),
      lote: lote.trim(),
      validade,
      quantidade: Number(quantidade) || 0,
      estoqueMinimo: Number(estoqueMinimo) || 0,
      origem,
      local: local.trim(),
      proximaCompra: proximaCompra || undefined,
      observacao: obs.trim() || undefined,
      pacientesUso: pacientes.filter(
        (p) => p.residenteId && (p.qtdDia > 0 || p.seNecessario),
      ),
      tipoUso,
      lancadoEm: lancadoEm || undefined,
      unidade,
      gotasPorMl: unidade === "ml" ? Number(gotasPorMl) || 20 : undefined,
    });
  }

  return (
    <Dialog open={!!item} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar item do estoque</DialogTitle>
          <DialogDescription>
            Edite tudo, defina quais residentes usam essa medicação (e quantos
            comprimidos por dia cada um) e a próxima data de compra/retirada.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <Label>Medicação</Label>
            <Input value={medicacao} onChange={(e) => setMedicacao(e.target.value)} />
          </div>
          <div>
            <Label>Tipo de uso</Label>
            <Select value={tipoUso} onValueChange={(v) => setTipoUso(v as typeof tipoUso)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIPOS_USO_MED.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">Aplica a todos os lotes desta medicação.</p>
          </div>
          <div>
            <Label>Data de lançamento no estoque</Label>
            <Input type="date" value={lancadoEm} onChange={(e) => setLancadoEm(e.target.value)} />
          </div>
          <div>
            <Label>Apresentação</Label>
            <Input value={apresentacao} onChange={(e) => setApresentacao(e.target.value)} />
          </div>
          <div>
            <Label>Como conta este estoque</Label>
            <Select value={unidade} onValueChange={(v) => setUnidade(v as "unidade" | "ml")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="unidade">Comprimido / ampola / unidade</SelectItem>
                <SelectItem value="ml">Solução em ml (dose em gotas)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {unidade === "ml" && (
            <div>
              <Label>Gotas por ml</Label>
              <Input
                type="number"
                min={1}
                value={gotasPorMl}
                onChange={(e) => setGotasPorMl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">Padrão: 20 gotas = 1 ml.</p>
            </div>
          )}
          <div>
            <Label>Lote</Label>
            <Input value={lote} onChange={(e) => setLote(e.target.value)} />
          </div>
          <div>
            <Label>Validade</Label>
            <Input type="date" value={validade} onChange={(e) => setValidade(e.target.value)} />
          </div>
          <div>
            <Label>{unidade === "ml" ? "Quantidade total (ml)" : "Quantidade"}</Label>
            <Input type="number" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} />
          </div>
          <div>
            <Label>Estoque mínimo</Label>
            <Input type="number" value={estoqueMinimo} onChange={(e) => setEstoqueMinimo(e.target.value)} />
            <p className="text-xs text-muted-foreground mt-1">Único para a medicação (sincroniza todos os lotes).</p>
          </div>
          <div>
            <Label>Origem (onde pegar/comprar)</Label>
            <Select value={origem} onValueChange={setOrigem}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ORIGENS_ESTOQUE.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Local de armazenamento</Label>
            <Input value={local} onChange={(e) => setLocal(e.target.value)} />
          </div>
          <div>
            <Label>Próxima compra/retirada</Label>
            <Input type="date" value={proximaCompra} onChange={(e) => setProximaCompra(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Label>Observação</Label>
            <Input value={obs} onChange={(e) => setObs(e.target.value)} />
          </div>
        </div>

        <div className="mt-2 rounded-md border p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">
                {isHaldolDecanoato(medicacao)
                  ? "Pacientes em uso de Haldol Decanoato (IM)"
                  : "Pacientes que usam esta medicação"}
              </p>
              <p className="text-xs text-muted-foreground">
                {isHaldolDecanoato(medicacao) ? (
                  <>Informe ampolas por dose e intervalo (21 ou 30 dias). O consumo/dia é calculado automaticamente.</>
                ) : (
                  <>Consumo/dia total: <strong>{totalDia}</strong> (preenchido automaticamente)</>
                )}
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={addPaciente}>
              <Plus className="mr-1 h-3 w-3" /> Adicionar paciente
            </Button>
          </div>
          {pacientes.length === 0 && (
            <p className="text-xs text-muted-foreground">Nenhum paciente associado ainda.</p>
          )}
          {pacientes.map((p, i) => (
            <div
              key={i}
              className={
                isHaldolDecanoato(medicacao)
                  ? "grid grid-cols-[1fr_100px_100px_150px_auto] gap-2 items-end"
                  : "grid grid-cols-[1fr_120px_130px_auto] gap-2 items-end"
              }
            >
              <div>
                <Label className="text-xs">Residente</Label>
                <Select
                  value={p.residenteId}
                  onValueChange={(v) => atualizarPaciente(i, { residenteId: v })}
                >
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {residentes.map((r) => (
                      <SelectItem key={r.id} value={r.id}>{formatNome(r.nome)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {isHaldolDecanoato(medicacao) ? (
                <>
                  <div>
                    <Label className="text-xs">Ampolas/dose</Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.5"
                      value={p.ampolas ?? 1}
                      onChange={(e) => atualizarPaciente(i, { ampolas: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Intervalo (dias)</Label>
                    <Input
                      type="number"
                      min={1}
                      value={p.intervaloDias ?? 30}
                      onChange={(e) => atualizarPaciente(i, { intervaloDias: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Próxima aplicação</Label>
                    <Input
                      type="date"
                      value={p.proximaAplicacao ?? ""}
                      onChange={(e) => atualizarPaciente(i, { proximaAplicacao: e.target.value })}
                    />
                  </div>
                </>
              ) : (
                <div>
                  <Label className="text-xs">
                    {unidade === "ml" ? "Gotas/dia" : "Qtd/dia"}
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    step={unidade === "ml" ? "1" : "0.5"}
                    value={
                      unidade === "ml"
                        ? Math.round(
                            mlParaGotas(p.qtdDia, { gotasPorMl: Number(gotasPorMl) || 20 }),
                          )
                        : p.qtdDia
                    }
                    onChange={(e) =>
                      atualizarPaciente(i, {
                        qtdDia:
                          unidade === "ml"
                            ? gotasParaMl(Number(e.target.value), {
                                gotasPorMl: Number(gotasPorMl) || 20,
                              })
                            : Number(e.target.value),
                      })
                    }
                  />
                </div>
              )}
              {!isHaldolDecanoato(medicacao) && (
                <label className="flex items-center gap-2 pb-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={!!p.seNecessario}
                    onChange={(e) =>
                      atualizarPaciente(i, { seNecessario: e.target.checked })
                    }
                  />
                  Se necessário
                </label>
              )}
              <Button size="icon" variant="ghost" onClick={() => removerPaciente(i)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {isHaldolDecanoato(medicacao) && pacientes.length > 0 && (
            <p className="text-xs text-muted-foreground pt-1">
              Ampolas necessárias por mês (30 dias):{" "}
              <strong>
                {pacientes
                  .reduce((acc, p) => {
                    const amp = Number(p.ampolas) || 0;
                    const iv = Number(p.intervaloDias) || 0;
                    if (!amp || !iv) return acc;
                    return acc + (amp * 30) / iv;
                  }, 0)
                  .toFixed(1)}
              </strong>
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={salvar}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

