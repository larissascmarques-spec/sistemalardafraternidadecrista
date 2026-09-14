import { useEffect, useMemo, useRef, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";
import { CalendarCheck, Download, Plus, Save, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { formatNome } from "@/lib/format-nome";
import { formatMedNome } from "@/lib/format-med";
import type { Residente } from "@/lib/mock-data";
import prefill from "@/lib/checagem-prefill.json";

type Item = {
  horario: string;
  medicacao: string;
  dose: string;
  quantidade?: string; // ex: "2 comprimidos", "10 gotas"
  controlado?: boolean;
  programada?: boolean; // medicação eventual / de intervalo (ex.: haldol IM a cada 21 dias)
  frequencia?: string;
  dataPrevista?: string;
  observacao?: string;
};

type ChecagemSalva = {
  quarto: string;
  mes: number; // 1-12
  ano: number;
  itens: Item[];
  equipe: string[]; // nomes dos cuidadores/técnicos
  semAlteracao?: boolean;
  dataAlteracao?: string;
  assinaturaEnfermeiro?: string;
  atualizadoEm?: string;
};

const MESES = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];

function slug(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function itensSugeridos(nome: string, medsEmUso?: string[]): Item[] {
  const key = slug(nome);
  const bundled = (prefill as Record<string, { itens: Item[] }>)[key];
  if (bundled?.itens?.length) {
    return bundled.itens.map((i) => ({
      horario: normalizaHorario(i.horario),
      medicacao: formatMedNome(i.medicacao),
      dose: i.dose || "",
      controlado: ehControlado(i.medicacao),
    }));
  }
  if (medsEmUso?.length) {
    return medsEmUso.map((m) => ({
      horario: "08:00",
      medicacao: m,
      dose: "",
      controlado: ehControlado(m),
    }));
  }
  return [];
}

const CONTROLADOS = [
  "clonazepam","haloperidol","haldol","diazepam","alprazolam","bromazepam",
  "lorazepam","midazolam","zolpidem","fenobarbital","gardenal","morfina",
  "codeina","codeína","tramadol","metilfenidato","ritalina","oxazepam",
  "nitrazepam","risperidona","olanzapina","quetiapina","clorpromazina",
  "levomepromazina","periciazina","neozine","carbamazepina","ácido valproico",
  "acido valproico","valproato","lítio","litio","topiramato","gabapentina",
  "pregabalina","fluoxetina","sertralina","escitalopram","amitriptilina",
  "nortriptilina",
];
function ehControlado(nome: string): boolean {
  const n = (nome || "").toLowerCase();
  return CONTROLADOS.some((c) => n.includes(c));
}

function normalizaHorario(h: string): string {
  const s = (h || "").trim().replace(/h$/i, "").replace(",", ":");
  const m = s.match(/^(\d{1,2})(?::?(\d{2}))?$/);
  if (!m) return s;
  const hh = String(Math.min(23, Number(m[1]))).padStart(2, "0");
  const mm = (m[2] ?? "00").padStart(2, "0");
  return `${hh}:${mm}`;
}

function ordenarPorHorario(itens: Item[]): Item[] {
  return [...itens].sort((a, b) => {
    const ha = normalizaHorario(a.horario);
    const hb = normalizaHorario(b.horario);
    if (ha !== hb) return ha.localeCompare(hb);
    return a.medicacao.localeCompare(b.medicacao, "pt-BR");
  });
}

function diasNoMes(mes: number, ano: number): number {
  return new Date(ano, mes, 0).getDate();
}

function lerSalvo(key: string, fallback: ChecagemSalva): ChecagemSalva {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...(JSON.parse(raw) as Partial<ChecagemSalva>) };
  } catch {
    return fallback;
  }
}

type Props = {
  residente: Residente;
  medsEmUso?: string[];
  quartoPadrao?: string;
};

export function FichaChecagemDialog({ residente, medsEmUso, quartoPadrao }: Props) {
  const [open, setOpen] = useState(false);
  const hoje = new Date();
  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const [ano, setAno] = useState(hoje.getFullYear());

  const storageKey = `checagem-mar:${residente.id}:${ano}-${String(mes).padStart(2, "0")}`;
  const iniciais = useMemo<ChecagemSalva>(
    () => ({
      quarto: quartoPadrao ?? "",
      mes,
      ano,
      itens: itensSugeridos(residente.nome, medsEmUso),
      equipe: ["", "", "", "", ""],
      semAlteracao: true,
      dataAlteracao: "",
      assinaturaEnfermeiro: "",
    }),
    [residente.nome, medsEmUso, quartoPadrao, mes, ano],
  );
  const [dados, setDados] = useState<ChecagemSalva>(() => lerSalvo(storageKey, iniciais));
  const [sujo, setSujo] = useState(false);
  const carregandoRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    setDados(lerSalvo(storageKey, iniciais));
    carregandoRef.current = true;
    setSujo(false);
  }, [open, storageKey, iniciais]);

  useEffect(() => {
    if (!open) return;
    if (carregandoRef.current) {
      carregandoRef.current = false;
      return;
    }
    setSujo(true);
  }, [dados, open]);

  function atualizarItem(idx: number, campo: keyof Item, valor: string) {
    setDados((prev) => ({
      ...prev,
      itens: prev.itens.map((it, i) => (i === idx ? { ...it, [campo]: valor } : it)),
    }));
  }

  function adicionarItem() {
    setDados((prev) => ({
      ...prev,
      itens: [
        ...prev.itens,
        { horario: "08:00", medicacao: "", dose: "", quantidade: "", controlado: false, programada: false },
      ],
    }));
  }

  function removerItem(idx: number) {
    setDados((prev) => ({ ...prev, itens: prev.itens.filter((_, i) => i !== idx) }));
  }

  function atualizarEquipe(idx: number, valor: string) {
    setDados((prev) => {
      const eq = [...prev.equipe];
      eq[idx] = valor;
      return { ...prev, equipe: eq };
    });
  }

  function adicionarEquipe() {
    setDados((prev) => ({ ...prev, equipe: [...prev.equipe, ""] }));
  }
  function removerEquipe(idx: number) {
    setDados((prev) => ({ ...prev, equipe: prev.equipe.filter((_, i) => i !== idx) }));
  }

  function salvar() {
    const payload: ChecagemSalva = {
      ...dados,
      mes,
      ano,
      itens: ordenarPorHorario(dados.itens),
      atualizadoEm: new Date().toISOString(),
    };
    window.localStorage.setItem(storageKey, JSON.stringify(payload));
    setDados(payload);
    setSujo(false);
    toast.success("Checagem salva.");
  }

  function fechar() {
    if (sujo) {
      const ok = window.confirm("Você tem alterações não salvas. Fechar mesmo assim?");
      if (!ok) return;
    }
    setOpen(false);
  }

  function baixarPDF() {
    const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "landscape" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 24;

    const AZUL: [number, number, number] = [30, 64, 124];
    const AZUL_CLARO: [number, number, number] = [235, 242, 251];
    const CINZA_TXT: [number, number, number] = [60, 66, 78];
    const CINZA_LABEL: [number, number, number] = [40, 55, 85];
    const CINZA_DIV: [number, number, number] = [225, 229, 236];

    // Cabeçalho
    doc.setFillColor(...AZUL);
    doc.rect(0, 0, pageW, 56, "F");
    doc.setFillColor(...AZUL_CLARO);
    doc.rect(0, 56, pageW, 3, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Ficha de Checagem de Medicação", margin, 26);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(210, 224, 245);
    doc.text("Lar da Fraternidade Cristã", margin, 42);
    doc.text(
      `Emitida em ${new Date().toLocaleDateString("pt-BR")}`,
      pageW - margin,
      42,
      { align: "right" },
    );

    // Faixa de identificação
    let y = 72;
    doc.setFillColor(...AZUL_CLARO);
    doc.roundedRect(margin, y, pageW - margin * 2, 34, 6, 6, "F");
    doc.setFillColor(...AZUL);
    doc.rect(margin, y, 3, 34, "F");

    const camposId = [
      { label: "RESIDENTE", valor: formatNome(residente.nome) || "—" },
      { label: "QUARTO", valor: dados.quarto || "—" },
      { label: "MÊS", valor: MESES[mes - 1] },
      { label: "ANO", valor: String(ano) },
    ];
    const larguraCampo = (pageW - margin * 2 - 8) / camposId.length;
    camposId.forEach((c, i) => {
      const x = margin + 8 + i * larguraCampo;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(...CINZA_LABEL);
      doc.text(c.label, x, y + 13, { charSpace: 0.6 });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(...CINZA_TXT);
      doc.text(c.valor, x, y + 28);
    });
    y += 34 + 10;

    // Faixa "Alteração da prescrição"
    doc.setDrawColor(...CINZA_DIV);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, y, pageW - margin * 2, 22, 4, 4);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...CINZA_LABEL);
    doc.text("ALTERAÇÃO DA PRESCRIÇÃO", margin + 8, y + 9, { charSpace: 0.5 });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...CINZA_TXT);
    const marcSem = dados.semAlteracao ? "☒" : "☐";
    const marcCom = dados.semAlteracao ? "☐" : "☒";
    const dtAlt = dados.dataAlteracao || "___/___/______";
    const assEnf = dados.assinaturaEnfermeiro || "____________________";
    doc.text(`${marcSem} Sem alteração da prescrição`, margin + 8, y + 18);
    doc.text(`${marcCom} Alteração em ${dtAlt}`, margin + 210, y + 18);
    doc.text(`Assinatura do enfermeiro: ${assEnf}`, pageW - margin - 8, y + 18, { align: "right" });
    y += 22 + 10;

    // Separa medicações fixas (por horário) e programadas (haldol IM, etc.)
    const nDias = diasNoMes(mes, ano);
    const ordenados = ordenarPorHorario(dados.itens.filter((i) => !i.programada));
    const programadas = dados.itens.filter((i) => !!i.programada);

    type Row = (string | { content: string; rowSpan?: number; styles?: Record<string, unknown> })[];
    const body: Row[] = [];
    const gruposHorario = new Map<string, Item[]>();
    for (const it of ordenados) {
      const h = normalizaHorario(it.horario);
      const arr = gruposHorario.get(h) ?? [];
      arr.push(it);
      gruposHorario.set(h, arr);
    }
    for (const [horario, meds] of gruposHorario) {
      meds.forEach((it, idx) => {
        const nome = formatMedNome(it.medicacao) || "—";
        const dose = it.dose ? ` ${it.dose}` : "";
        const qtd = it.quantidade ? ` — ${it.quantidade}` : "";
        const medTxt = `☐ ${nome}${dose}${qtd}`;
        const row: Row = [];
        if (idx === 0) {
          row.push({
            content: horario,
            rowSpan: meds.length,
            styles: { valign: "middle", halign: "center", fontStyle: "bold", fillColor: AZUL_CLARO, textColor: AZUL, fontSize: 8 },
          });
        }
        row.push({
          content: medTxt,
          styles: it.controlado
            ? { fontStyle: "bold", textColor: [176, 32, 32] as [number, number, number] }
            : {},
        });
        row.push({ content: "", styles: {} }); // Hora real
        for (let d = 1; d <= nDias; d++) row.push("");
        row.push(it.observacao || "");
        body.push(row);
      });
    }

    if (body.length === 0) {
      body.push([
        { content: "—", styles: { halign: "center" } },
        "Sem medicações cadastradas",
        "",
        ...Array.from({ length: nDias }, () => ""),
        "",
      ]);
    }

    const head: Row[] = [[
      { content: "Horário", styles: { halign: "center" } },
      { content: "Medicação / Dose", styles: { halign: "left" } },
      { content: "Hora real", styles: { halign: "center" } },
      ...Array.from({ length: nDias }, (_, i) => ({
        content: String(i + 1),
        styles: { halign: "center" },
      })),
      { content: "Obs.", styles: { halign: "center" } },
    ]];

    autoTable(doc, {
      startY: y,
      head: head as never,
      body: body as never,
      margin: { left: margin, right: margin },
      styles: {
        font: "helvetica",
        fontSize: 6.8,
        cellPadding: 2,
        lineColor: CINZA_DIV,
        lineWidth: 0.4,
        textColor: CINZA_TXT,
        overflow: "linebreak",
        minCellHeight: 18, // quadrinho maior para rubrica + horário
      },
      headStyles: {
        fillColor: AZUL,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 7,
        lineColor: AZUL,
      },
      columnStyles: {
        0: { cellWidth: 34 },
        1: { cellWidth: 150 },
        2: { cellWidth: 34 },
        [3 + nDias]: { cellWidth: 56 },
      },
      theme: "grid",
    });

    // Rodapé — legenda + assinaturas
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const finalY = (doc as any).lastAutoTable?.finalY ?? y;
    let yr = finalY + 14;

    // Medicações programadas / eventuais (haldol IM etc.)
    if (programadas.length) {
      if (yr > pageH - 140) { doc.addPage(); yr = margin; }
      doc.setFillColor(...AZUL);
      doc.rect(margin, yr - 8, 3, 12, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...AZUL);
      doc.text("Medicações Eventuais / Programadas", margin + 8, yr);
      yr += 6;
      const rowsProg: Row[] = programadas.map((it) => [
        formatMedNome(it.medicacao) || "—",
        it.dose || "—",
        it.frequencia || it.observacao || "—",
        it.dataPrevista || "—",
        "",
      ]);
      autoTable(doc, {
        startY: yr,
        head: [[
          { content: "Medicamento", styles: { halign: "left" } },
          { content: "Dose", styles: { halign: "center" } },
          { content: "Frequência", styles: { halign: "center" } },
          { content: "Data prevista", styles: { halign: "center" } },
          { content: "Rubrica", styles: { halign: "center" } },
        ]] as never,
        body: rowsProg as never,
        margin: { left: margin, right: margin },
        styles: { font: "helvetica", fontSize: 8, cellPadding: 4, lineColor: CINZA_DIV, lineWidth: 0.4, textColor: CINZA_TXT },
        headStyles: { fillColor: AZUL, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
        theme: "grid",
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      yr = (doc as any).lastAutoTable?.finalY + 14;
    }

    if (yr > pageH - 110) {
      doc.addPage();
      yr = margin;
    }

    doc.setFillColor(...AZUL);
    doc.rect(margin, yr - 8, 3, 12, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...AZUL);
    doc.text("Legenda de rubricas — identificação da equipe", margin + 8, yr);
    yr += 6;

    const nEq = Math.max(dados.equipe.length, 5);
    const colsEq = Math.min(nEq, 6);
    const linhasEq = Math.ceil(nEq / colsEq);
    const colW = (pageW - margin * 2) / colsEq;
    for (let i = 0; i < nEq; i++) {
      const linha = Math.floor(i / colsEq);
      const col = i % colsEq;
      const x = margin + col * colW;
      const yLine = yr + linha * 48;
      doc.setDrawColor(...CINZA_DIV);
      doc.setLineWidth(0.4);
      doc.rect(x + 2, yLine, colW - 4, 44);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(...CINZA_LABEL);
      doc.text(`CUIDADOR(A) ${i + 1}`, x + 6, yLine + 10, { charSpace: 0.4 });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...CINZA_TXT);
      const nome = dados.equipe[i] || "";
      doc.text(nome || "Nome:", x + 6, yLine + 24);
      doc.setFontSize(7);
      doc.setTextColor(...CINZA_LABEL);
      doc.text("Rubrica:", x + 6, yLine + 38);
    }
    yr += linhasEq * 48 + 10;

    // Conferência do plantão
    if (yr > pageH - 90) { doc.addPage(); yr = margin; }
    doc.setFillColor(...AZUL);
    doc.rect(margin, yr - 8, 3, 12, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...AZUL);
    doc.text("Conferência do plantão (assinatura do responsável)", margin + 8, yr);
    yr += 6;
    const turnos = ["Manhã", "Tarde", "Noite"];
    const colT = (pageW - margin * 2) / 3;
    turnos.forEach((t, i) => {
      const x = margin + i * colT;
      doc.setDrawColor(...CINZA_DIV);
      doc.rect(x + 2, yr, colT - 4, 34);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(...CINZA_LABEL);
      doc.text(t.toUpperCase(), x + 6, yr + 10, { charSpace: 0.4 });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...CINZA_TXT);
      doc.text("Assinatura: ______________________________", x + 6, yr + 24);
    });
    yr += 34 + 10;

    // Observações gerais
    if (yr > pageH - 60) {
      doc.addPage();
      yr = margin;
    }
    doc.setFillColor(...AZUL);
    doc.rect(margin, yr - 8, 3, 12, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...AZUL);
    doc.text(
      "Observações — recusas, atrasos, vômitos, suspensão temporária, eventos adversos",
      margin + 8,
      yr,
    );
    yr += 6;
    doc.setDrawColor(...CINZA_DIV);
    for (let i = 0; i < 3; i++) {
      yr += 14;
      doc.line(margin, yr, pageW - margin, yr);
    }

    // Rodapé em todas as páginas
    const totalPag = doc.getNumberOfPages();
    for (let p = 1; p <= totalPag; p++) {
      doc.setPage(p);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(150, 158, 172);
      doc.setDrawColor(...CINZA_DIV);
      doc.line(margin, pageH - 22, pageW - margin, pageH - 22);
      doc.text(
        `Lar da Fraternidade Cristã — Ficha de Checagem de Medicação · ${MESES[mes - 1]}/${ano}`,
        margin,
        pageH - 10,
      );
      doc.text(`Página ${p} de ${totalPag}`, pageW - margin, pageH - 10, {
        align: "right",
      });
    }

    const arq = `checagem-${slug(residente.nome)}-${ano}-${String(mes).padStart(2, "0")}.pdf`;
    doc.save(arq);
    toast.success("Ficha baixada em PDF.");
  }

  const anos = [ano - 1, ano, ano + 1];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <CalendarCheck className="mr-2 h-4 w-4" /> Checagem mensal
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ficha de checagem de medicação</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="space-y-1">
              <Label>Residente</Label>
              <Input value={formatNome(residente.nome)} readOnly />
            </div>
            <div className="space-y-1">
              <Label>Quarto</Label>
              <Input
                value={dados.quarto}
                onChange={(e) => setDados((p) => ({ ...p, quarto: e.target.value }))}
                placeholder="Ex.: 03"
              />
            </div>
            <div className="space-y-1">
              <Label>Mês</Label>
              <Select value={String(mes)} onValueChange={(v) => setMes(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MESES.map((m, i) => (
                    <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Ano</Label>
              <Select value={String(ano)} onValueChange={(v) => setAno(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {anos.map((a) => (
                    <SelectItem key={a} value={String(a)}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border p-3 space-y-2">
            <Label className="text-sm">Alteração da prescrição</Label>
            <div className="grid gap-2 sm:grid-cols-3 items-center">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!!dados.semAlteracao}
                  onChange={(e) => setDados((p) => ({ ...p, semAlteracao: e.target.checked }))}
                />
                Sem alteração
              </label>
              <div className="space-y-1">
                <Label className="text-xs">Data da alteração</Label>
                <Input
                  value={dados.dataAlteracao ?? ""}
                  onChange={(e) => setDados((p) => ({ ...p, dataAlteracao: e.target.value, semAlteracao: false }))}
                  placeholder="dd/mm/aaaa"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Enfermeiro(a) responsável</Label>
                <Input
                  value={dados.assinaturaEnfermeiro ?? ""}
                  onChange={(e) => setDados((p) => ({ ...p, assinaturaEnfermeiro: e.target.value }))}
                  placeholder="Nome"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Medicações e horários</Label>
              <Button variant="outline" size="sm" onClick={adicionarItem}>
                <Plus className="mr-1 h-4 w-4" /> Adicionar
              </Button>
            </div>
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-2 py-2 text-left">Horário</th>
                    <th className="px-2 py-2 text-left">Medicação</th>
                    <th className="px-2 py-2 text-left">Dose</th>
                    <th className="px-2 py-2 text-left">Qtde/apres.</th>
                    <th className="px-2 py-2 text-center" title="Controlado">Ctrl</th>
                    <th className="px-2 py-2 text-center" title="Programada/eventual">Prog</th>
                    <th className="px-2 py-2 text-left">Observação</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {ordenarPorHorario(dados.itens).map((it) => {
                    const idx = dados.itens.indexOf(it);
                    return (
                      <tr key={idx} className="border-t">
                        <td className="px-2 py-1">
                          <Input
                            className="h-8 w-20"
                            value={it.horario}
                            onChange={(e) => atualizarItem(idx, "horario", e.target.value)}
                            placeholder="08:00"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <Input
                            className="h-8"
                            value={it.medicacao}
                            onChange={(e) => atualizarItem(idx, "medicacao", e.target.value)}
                          />
                        </td>
                        <td className="px-2 py-1">
                          <Input
                            className="h-8 w-32"
                            value={it.dose}
                            onChange={(e) => atualizarItem(idx, "dose", e.target.value)}
                            placeholder="Ex.: 3 mg"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <Input
                            className="h-8 w-36"
                            value={it.quantidade ?? ""}
                            onChange={(e) => atualizarItem(idx, "quantidade", e.target.value)}
                            placeholder="Ex.: 2 comprimidos"
                          />
                        </td>
                        <td className="px-2 py-1 text-center">
                          <input
                            type="checkbox"
                            checked={!!it.controlado}
                            onChange={(e) =>
                              setDados((prev) => ({
                                ...prev,
                                itens: prev.itens.map((x, i) => (i === idx ? { ...x, controlado: e.target.checked } : x)),
                              }))
                            }
                          />
                        </td>
                        <td className="px-2 py-1 text-center">
                          <input
                            type="checkbox"
                            checked={!!it.programada}
                            onChange={(e) =>
                              setDados((prev) => ({
                                ...prev,
                                itens: prev.itens.map((x, i) => (i === idx ? { ...x, programada: e.target.checked } : x)),
                              }))
                            }
                          />
                        </td>
                        <td className="px-2 py-1">
                          <Input
                            className="h-8"
                            value={it.observacao ?? ""}
                            onChange={(e) => atualizarItem(idx, "observacao", e.target.value)}
                            placeholder="Opcional"
                          />
                        </td>
                        <td className="px-1 py-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removerItem(idx)}
                            aria-label="Remover"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                  {dados.itens.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-3 py-6 text-center text-sm text-muted-foreground">
                        Nenhuma medicação cadastrada. Clique em “Adicionar”.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground">
              Marque <strong>Ctrl</strong> para medicações de controle especial (destacadas em vermelho no PDF) e
              <strong> Prog</strong> para medicações eventuais/de intervalo (ex.: Haldol IM a cada 21 dias) — elas saem em tabela separada.
              Para itens programados, preencha <em>Observação</em> com a frequência (ex.: “a cada 21 dias”) e a próxima data prevista.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Equipe (legenda de rubricas)</Label>
              <Button variant="outline" size="sm" onClick={adicionarEquipe}>
                <Plus className="mr-1 h-4 w-4" /> Adicionar
              </Button>
            </div>
            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {dados.equipe.map((n, i) => (
                <div key={i} className="flex items-center gap-1">
                  <Input
                    value={n}
                    onChange={(e) => atualizarEquipe(i, e.target.value)}
                    placeholder={`Cuidador(a) ${i + 1}`}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removerEquipe(i)}
                    aria-label="Remover"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              Dica: o PDF sai em A4 paisagem, com colunas para os {diasNoMes(mes, ano)} dias do mês
              e espaço para rubrica em cada dose administrada.
            </Label>
            <Textarea readOnly value="Modelo alinhado a boas práticas de ILPI/hospital: registro por horário, rubrica diária, campo de observações para recusas, atrasos, vômitos ou suspensão, e identificação da equipe responsável." rows={2} className="text-xs" />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={fechar}>Fechar</Button>
          <Button variant={sujo ? "default" : "outline"} onClick={salvar}>
            <Save className="mr-2 h-4 w-4" />
            {sujo ? "Salvar" : "Salvo"}
          </Button>
          <Button
            onClick={() => {
              salvar();
              baixarPDF();
            }}
          >
            <Download className="mr-2 h-4 w-4" /> Salvar e baixar PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}