import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/page-header";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { diasAte } from "@/lib/mock-data";
import {
  useInsumos,
  adicionarInsumo,
  adicionarVariosInsumos,
  removerInsumo,
  diasRestantesInsumo,
  CATEGORIAS_INSUMOS,
  type InsumoItem,
} from "@/lib/insumos-store";
import { PackagePlus, FileSpreadsheet, Download, Trash2 } from "lucide-react";

export const Route = createFileRoute("/insumos")({
  component: Page,
});

type Form = {
  nome: string;
  categoria: string;
  apresentacao: string;
  lote: string;
  validade: string;
  quantidade: string;
  estoqueMinimo: string;
  consumoDiario: string;
  origem: string;
  local: string;
};

const formVazio: Form = {
  nome: "",
  categoria: "Fralda",
  apresentacao: "Unidade",
  lote: "",
  validade: "",
  quantidade: "",
  estoqueMinimo: "",
  consumoDiario: "",
  origem: "Compra própria",
  local: "Almoxarifado",
};

function Page() {
  const { itens } = useInsumos();
  const [abrirManual, setAbrirManual] = useState(false);
  const [abrirPlanilha, setAbrirPlanilha] = useState(false);
  const [form, setForm] = useState<Form>(formVazio);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [importando, setImportando] = useState(false);
  const [filtroCat, setFiltroCat] = useState<string>("Todas");

  const lista = itens
    .filter((i) => filtroCat === "Todas" || i.categoria === filtroCat)
    .map((e) => ({
      ...e,
      dias: diasRestantesInsumo(e),
      validadeDias: e.validade ? diasAte(e.validade) : 9999,
    }))
    .sort((a, b) => a.dias - b.dias);

  async function salvarManual() {
    if (!form.nome.trim() || !form.quantidade) {
      toast.error("Preencha pelo menos nome e quantidade.");
      return;
    }
    await adicionarInsumo({
      nome: form.nome.trim(),
      categoria: form.categoria || "Outros",
      apresentacao: form.apresentacao.trim() || "Unidade",
      lote: form.lote.trim(),
      validade: form.validade,
      quantidade: Number(form.quantidade) || 0,
      estoqueMinimo: Number(form.estoqueMinimo) || 0,
      consumoDiario: Number(form.consumoDiario) || 0,
      origem: form.origem || "Compra própria",
      local: form.local.trim() || "Almoxarifado",
    });
    toast.success("Insumo lançado.");
    setForm(formVazio);
    setAbrirManual(false);
  }

  async function excluir(id: string) {
    if (!confirm("Remover este insumo do estoque?")) return;
    await removerInsumo(id);
    toast.success("Removido.");
  }

  async function baixarModelo() {
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      [
        "nome",
        "categoria",
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
        "Fralda G",
        "Fralda",
        "Pacote 8un",
        "",
        "",
        40,
        20,
        4,
        "Compra própria",
        "Almoxarifado",
      ],
    ]);
    XLSX.utils.book_append_sheet(wb, ws, "Insumos");
    XLSX.writeFile(wb, "modelo-insumos.xlsx");
  }

  async function normalizarData(v: unknown): Promise<string> {
    if (!v) return "";
    if (v instanceof Date) return v.toISOString().slice(0, 10);
    if (typeof v === "number") {
      const XLSX = await import("xlsx");
      const d = XLSX.SSF.parse_date_code(v);
      if (d) return new Date(Date.UTC(d.y, d.m - 1, d.d)).toISOString().slice(0, 10);
    }
    const s = String(v).trim();
    const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (m) return `${m[3]}-${m[2]}-${m[1]}`;
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
      const novos: Array<Omit<InsumoItem, "id" | "codigo">> = [];
      const erros: string[] = [];
      for (let i = 0; i < linhas.length; i++) {
        const linha = linhas[i];
        const nome = String(linha["nome"] || linha["Nome"] || "").trim();
        const qtd = Number(linha["quantidade"] || linha["Qtd"] || 0);
        if (!nome || !qtd) {
          erros.push(`Linha ${i + 2}: dados incompletos`);
          continue;
        }
        novos.push({
          nome,
          categoria: String(linha["categoria"] || linha["Categoria"] || "Outros"),
          apresentacao: String(linha["apresentacao"] || linha["Apresentação"] || "Unidade"),
          lote: String(linha["lote"] || linha["Lote"] || ""),
          validade: await normalizarData(linha["validade"] || linha["Validade"]),
          quantidade: qtd,
          estoqueMinimo: Number(linha["estoqueMinimo"] || linha["Mínimo"] || 0),
          consumoDiario: Number(linha["consumoDiario"] || linha["Consumo/dia"] || 0),
          origem: String(linha["origem"] || linha["Origem"] || "Compra própria"),
          local: String(linha["local"] || linha["Local"] || "Almoxarifado"),
        });
      }
      if (novos.length === 0) {
        toast.error("Nenhuma linha válida encontrada.");
        return;
      }
      const { inseridos, atualizados } = await adicionarVariosInsumos(novos);
      toast.success(
        `${inseridos} novos, ${atualizados} atualizados${erros.length ? `, ${erros.length} com erro` : ""}.`,
      );
      setArquivo(null);
      setAbrirPlanilha(false);
    } catch (e) {
      console.error(e);
      toast.error("Não consegui ler a planilha.");
    } finally {
      setImportando(false);
    }
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Controle de Insumos"
        description="Fraldas, luvas, gaze, seringa, dieta, álcool e outros."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setAbrirPlanilha(true)}>
              <FileSpreadsheet className="mr-2 h-4 w-4" /> Importar planilha
            </Button>
            <Button onClick={() => setAbrirManual(true)}>
              <PackagePlus className="mr-2 h-4 w-4" /> Lançar entrada
            </Button>
          </div>
        }
      />

      <div className="flex items-center gap-2">
        <Label className="text-sm">Categoria:</Label>
        <Select value={filtroCat} onValueChange={setFiltroCat}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todas">Todas</SelectItem>
            {CATEGORIAS_INSUMOS.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Insumo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Apresentação</TableHead>
                <TableHead>Lote</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead className="text-right">Qtd</TableHead>
                <TableHead className="text-right">Mínimo</TableHead>
                <TableHead className="text-right">Consumo/dia</TableHead>
                <TableHead>Dias restantes</TableHead>
                <TableHead>Local</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lista.length === 0 && (
                <TableRow>
                  <TableCell colSpan={12} className="text-center text-sm text-muted-foreground py-8">
                    Nenhum insumo cadastrado. Use "Lançar entrada" ou "Importar planilha".
                  </TableCell>
                </TableRow>
              )}
              {lista.map((e) => {
                const precisa = e.dias < 30 || (e.estoqueMinimo > 0 && e.quantidade <= e.estoqueMinimo);
                return (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.nome}</TableCell>
                    <TableCell>{e.categoria}</TableCell>
                    <TableCell>{e.apresentacao}</TableCell>
                    <TableCell>{e.lote || "—"}</TableCell>
                    <TableCell>
                      {e.validade ? (
                        <>
                          {new Date(e.validade).toLocaleDateString("pt-BR")}
                          {e.validadeDias < 90 && (
                            <Badge variant="destructive" className="ml-2">
                              Vence em {e.validadeDias}d
                            </Badge>
                          )}
                        </>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-right">{e.quantidade}</TableCell>
                    <TableCell className="text-right">{e.estoqueMinimo}</TableCell>
                    <TableCell className="text-right">{e.consumoDiario}</TableCell>
                    <TableCell>{e.consumoDiario > 0 ? `${e.dias} dias` : "—"}</TableCell>
                    <TableCell>{e.local}</TableCell>
                    <TableCell>
                      {precisa ? (
                        <Badge variant="destructive">Comprar</Badge>
                      ) : (
                        <Badge className="bg-[color:var(--success)]/15 text-[color:var(--success)]">OK</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => excluir(e.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={abrirManual} onOpenChange={setAbrirManual}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Lançar entrada de insumo</DialogTitle>
            <DialogDescription>Preencha os dados do insumo recebido.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <Label>Nome</Label>
              <Input
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Ex.: Fralda Geriátrica G"
              />
            </div>
            <div>
              <Label>Categoria</Label>
              <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS_INSUMOS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Apresentação</Label>
              <Input
                value={form.apresentacao}
                onChange={(e) => setForm({ ...form, apresentacao: e.target.value })}
                placeholder="Ex.: Pacote 8un"
              />
            </div>
            <div>
              <Label>Lote (opcional)</Label>
              <Input value={form.lote} onChange={(e) => setForm({ ...form, lote: e.target.value })} />
            </div>
            <div>
              <Label>Validade (opcional)</Label>
              <Input
                type="date"
                value={form.validade}
                onChange={(e) => setForm({ ...form, validade: e.target.value })}
              />
            </div>
            <div>
              <Label>Quantidade</Label>
              <Input
                type="number"
                value={form.quantidade}
                onChange={(e) => setForm({ ...form, quantidade: e.target.value })}
              />
            </div>
            <div>
              <Label>Estoque mínimo</Label>
              <Input
                type="number"
                value={form.estoqueMinimo}
                onChange={(e) => setForm({ ...form, estoqueMinimo: e.target.value })}
              />
            </div>
            <div>
              <Label>Consumo por dia</Label>
              <Input
                type="number"
                value={form.consumoDiario}
                onChange={(e) => setForm({ ...form, consumoDiario: e.target.value })}
              />
            </div>
            <div>
              <Label>Origem</Label>
              <Input value={form.origem} onChange={(e) => setForm({ ...form, origem: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label>Local de armazenamento</Label>
              <Input value={form.local} onChange={(e) => setForm({ ...form, local: e.target.value })} />
            </div>
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
            <DialogTitle>Importar insumos por planilha</DialogTitle>
            <DialogDescription>
              Envie um arquivo .xlsx ou .csv. Colunas: nome, categoria, apresentacao, lote, validade, quantidade,
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