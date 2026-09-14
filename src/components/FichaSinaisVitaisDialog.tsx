import { useEffect, useRef, useState } from "react";
import jsPDF from "jspdf";
import { toast } from "sonner";
import { Download, Plus, Save, Trash2 } from "lucide-react";
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
import { formatNome } from "@/lib/format-nome";
import type { Residente } from "@/lib/mock-data";

type Linha = {
  data: string; // dd/mm/aaaa
  hora: string; // hh:mm
  pa: string;
  fc: string;
  fr: string;
  tax: string;
  sat: string;
  assinatura: string;
};

type FichaSalva = {
  residenteNome: string;
  linhas: Linha[];
  atualizadoEm?: string;
};

const VAZIA: FichaSalva = {
  residenteNome: "",
  linhas: [],
};

function lerSalvo(key: string): FichaSalva {
  if (typeof window === "undefined") return VAZIA;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return VAZIA;
    return { ...VAZIA, ...(JSON.parse(raw) as Partial<FichaSalva>) };
  } catch {
    return VAZIA;
  }
}

function dataHojeBR(): string {
  return new Date().toLocaleDateString("pt-BR");
}

function horaAgora(): string {
  return new Date().toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

type Props = {
  residente?: Residente;
  standalone?: boolean;
};

export function FichaSinaisVitaisDialog({ residente, standalone }: Props) {
  const [open, setOpen] = useState(false);
  const storageKey = residente
    ? `sinais-vitais:${residente.id}`
    : "sinais-vitais:avulso";

  const [dados, setDados] = useState<FichaSalva>(() => lerSalvo(storageKey));
  const [sujo, setSujo] = useState(false);
  const carregandoRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    const salvo = lerSalvo(storageKey);
    setDados({
      ...salvo,
      residenteNome:
        salvo.residenteNome || (residente ? formatNome(residente.nome) : ""),
    });
    carregandoRef.current = true;
    setSujo(false);
  }, [open, storageKey, residente]);

  useEffect(() => {
    if (!open) return;
    if (carregandoRef.current) {
      carregandoRef.current = false;
      return;
    }
    setSujo(true);
  }, [dados, open]);

  function atualizar(campo: keyof FichaSalva, valor: string | Linha[]) {
    setDados((prev) => ({ ...prev, [campo]: valor }));
  }

  function atualizarLinha(idx: number, campo: keyof Linha, valor: string) {
    setDados((prev) => ({
      ...prev,
      linhas: prev.linhas.map((l, i) => (i === idx ? { ...l, [campo]: valor } : l)),
    }));
  }

  function adicionarLinha() {
    setDados((prev) => ({
      ...prev,
      linhas: [
        ...prev.linhas,
        {
          data: dataHojeBR(),
          hora: "",
          pa: "",
          fc: "",
          fr: "",
          tax: "",
          sat: "",
          assinatura: "",
        },
      ],
    }));
  }

  function removerLinha(idx: number) {
    setDados((prev) => ({
      ...prev,
      linhas: prev.linhas.filter((_, i) => i !== idx),
    }));
  }

  function salvar() {
    const payload: FichaSalva = {
      ...dados,
      atualizadoEm: new Date().toISOString(),
    };
    window.localStorage.setItem(storageKey, JSON.stringify(payload));
    setDados(payload);
    setSujo(false);
    toast.success("Ficha de sinais vitais salva.");
  }

  function fechar() {
    if (sujo) {
      const ok = window.confirm("Você tem alterações não salvas. Fechar mesmo assim?");
      if (!ok) return;
    }
    setOpen(false);
  }

  function baixarPDF() {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 32;

    const AZUL: [number, number, number] = [30, 64, 124];
    const AZUL_CLARO: [number, number, number] = [235, 242, 251];
    const CINZA_TXT: [number, number, number] = [60, 66, 78];
    const CINZA_LABEL: [number, number, number] = [40, 55, 85];
    const CINZA_DIV: [number, number, number] = [225, 229, 236];

    // Cabeçalho
    doc.setFillColor(...AZUL);
    doc.rect(0, 0, pageW, 62, "F");
    doc.setFillColor(...AZUL_CLARO);
    doc.rect(0, 62, pageW, 4, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);
    doc.text("Ficha de Coleta de Sinais Vitais", margin, 30);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(210, 224, 245);
    doc.text("Lar da Fraternidade Cristã", margin, 48);
    doc.text(
      `Emitida em ${new Date().toLocaleDateString("pt-BR")}`,
      pageW - margin,
      48,
      { align: "right" },
    );

    let y = 84;

    // Card de identificação
    doc.setFillColor(...AZUL_CLARO);
    doc.roundedRect(margin, y, pageW - margin * 2, 40, 8, 8, "F");
    doc.setFillColor(...AZUL);
    doc.rect(margin, y, 4, 40, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...CINZA_LABEL);
    doc.text("RESIDENTE", margin + 14, y + 15, { charSpace: 0.6 });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(13);
    doc.setTextColor(...CINZA_TXT);
    doc.text(dados.residenteNome.trim() || "—", margin + 14, y + 32);
    y += 40 + 18;

    // Título da tabela
    doc.setFillColor(...AZUL);
    doc.rect(margin, y - 8, 4, 13, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...AZUL);
    doc.text("Registros de sinais vitais", margin + 10, y + 2);
    y += 16;

    // Tabela
    const colunas = [
      { label: "Data", w: 64 },
      { label: "Hora", w: 52 },
      { label: "PA", w: 72 },
      { label: "FC", w: 56 },
      { label: "FR", w: 56 },
      { label: "Tax", w: 60 },
      { label: "SatO₂", w: 60 },
      { label: "Assinatura do profissional", w: 0 },
    ];

    const totalFixo = colunas.reduce((a, c) => a + c.w, 0);
    const larguraTabela = pageW - margin * 2;
    colunas[colunas.length - 1].w = larguraTabela - totalFixo;

    const colsX: number[] = [];
    let xAcc = margin;
    for (const c of colunas) {
      colsX.push(xAcc);
      xAcc += c.w;
    }
    colsX.push(margin + larguraTabela);

    const linhas = dados.linhas.length ? dados.linhas : [];
    const alturaLinha = 34;
    const fonteCel = 9;
    const padY = 7;

    // Cabeçalho da tabela
    doc.setFillColor(...AZUL_CLARO);
    doc.rect(margin, y, larguraTabela, alturaLinha, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...AZUL);
    colunas.forEach((c, i) => {
      doc.text(
        c.label,
        colsX[i] + 4,
        y + padY + fonteCel,
      );
    });
    y += alturaLinha;

    // Linhas
    doc.setFont("helvetica", "normal");
    doc.setFontSize(fonteCel);
    doc.setTextColor(...CINZA_TXT);

    if (linhas.length === 0) {
      doc.setDrawColor(...CINZA_DIV);
      doc.rect(margin, y, larguraTabela, alturaLinha);
      doc.text(
        "Nenhum registro lançado.",
        margin + 6,
        y + padY + fonteCel,
      );
      y += alturaLinha;
    }

    linhas.forEach((linha, rowIdx) => {
      if (y + alturaLinha > pageH - 50) {
        doc.addPage();
        y = margin;
        // Repete cabeçalho na nova página
        doc.setFillColor(...AZUL_CLARO);
        doc.rect(margin, y, larguraTabela, alturaLinha, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(...AZUL);
        colunas.forEach((c, i) => {
          doc.text(c.label, colsX[i] + 4, y + padY + fonteCel);
        });
        y += alturaLinha;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(fonteCel);
        doc.setTextColor(...CINZA_TXT);
      }

      const valores = [
        linha.data,
        linha.hora,
        linha.pa,
        linha.fc,
        linha.fr,
        linha.tax,
        linha.sat,
        linha.assinatura,
      ];

      // fundo zebrado
      if (rowIdx % 2 === 1) {
        doc.setFillColor(250, 251, 253);
        doc.rect(margin, y, larguraTabela, alturaLinha, "F");
      }

      valores.forEach((v, i) => {
        const txt = v.trim();
        if (!txt) return;
        const wrap = doc.splitTextToSize(txt, colunas[i].w - 8);
        doc.text(wrap, colsX[i] + 4, y + padY + fonteCel);
      });

      // Bordas
      doc.setDrawColor(...CINZA_DIV);
      doc.setLineWidth(0.4);
      doc.rect(margin, y, larguraTabela, alturaLinha);
      colsX.forEach((x) => doc.line(x, y, x, y + alturaLinha));

      y += alturaLinha;
    });

    // Rodapé
    const totalPag = doc.getNumberOfPages();
    for (let p = 1; p <= totalPag; p++) {
      doc.setPage(p);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(150, 158, 172);
      doc.setDrawColor(...CINZA_DIV);
      doc.line(margin, pageH - 28, pageW - margin, pageH - 28);
      doc.text(
        "Lar da Fraternidade Cristã — Ficha de Coleta de Sinais Vitais",
        margin,
        pageH - 14,
      );
      doc.text(`Página ${p} de ${totalPag}`, pageW - margin, pageH - 14, {
        align: "right",
      });
    }

    const slug = (dados.residenteNome || "residente")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    doc.save(`sinais-vitais-${slug}.pdf`);
    toast.success("Ficha baixada em PDF.");
  }

  const conteudo = (
    <div className="space-y-4 py-2">
      <div className="space-y-1">
        <Label>Nome da residente</Label>
        <Input
          value={dados.residenteNome}
          onChange={(e) => atualizar("residenteNome", e.target.value)}
          placeholder="Nome completo"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Registros</Label>
          <Button type="button" size="sm" variant="outline" onClick={adicionarLinha}>
            <Plus className="mr-1 h-4 w-4" /> Adicionar linha
          </Button>
        </div>

        <div className="max-h-[50vh] overflow-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted sticky top-0 z-10">
              <tr>
                <th className="px-2 py-2 text-left font-medium">Data</th>
                <th className="px-2 py-2 text-left font-medium">Hora</th>
                <th className="px-2 py-2 text-left font-medium">PA</th>
                <th className="px-2 py-2 text-left font-medium">FC</th>
                <th className="px-2 py-2 text-left font-medium">FR</th>
                <th className="px-2 py-2 text-left font-medium">Tax</th>
                <th className="px-2 py-2 text-left font-medium">SatO₂</th>
                <th className="px-2 py-2 text-left font-medium">Assinatura do profissional</th>
                <th className="px-2 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {dados.linhas.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-2 py-4 text-center text-muted-foreground">
                    Nenhum registro. Clique em "Adicionar linha".
                  </td>
                </tr>
              )}
              {dados.linhas.map((linha, idx) => (
                <tr key={idx} className="border-t">
                  <td className="p-1">
                    <Input
                      value={linha.data}
                      onChange={(e) => atualizarLinha(idx, "data", e.target.value)}
                      placeholder="dd/mm/aaaa"
                      className="h-8 min-w-[90px]"
                    />
                  </td>
                  <td className="p-1">
                    <Input
                      value={linha.hora}
                      onChange={(e) => atualizarLinha(idx, "hora", e.target.value)}
                      placeholder="hh:mm"
                      className="h-8 min-w-[60px]"
                    />
                  </td>
                  <td className="p-1">
                    <Input
                      value={linha.pa}
                      onChange={(e) => atualizarLinha(idx, "pa", e.target.value)}
                      placeholder="120x80"
                      className="h-8 min-w-[60px]"
                    />
                  </td>
                  <td className="p-1">
                    <Input
                      value={linha.fc}
                      onChange={(e) => atualizarLinha(idx, "fc", e.target.value)}
                      placeholder="bpm"
                      className="h-8 min-w-[50px]"
                    />
                  </td>
                  <td className="p-1">
                    <Input
                      value={linha.fr}
                      onChange={(e) => atualizarLinha(idx, "fr", e.target.value)}
                      placeholder="irpm"
                      className="h-8 min-w-[50px]"
                    />
                  </td>
                  <td className="p-1">
                    <Input
                      value={linha.tax}
                      onChange={(e) => atualizarLinha(idx, "tax", e.target.value)}
                      placeholder="°C"
                      className="h-8 min-w-[50px]"
                    />
                  </td>
                  <td className="p-1">
                    <Input
                      value={linha.sat}
                      onChange={(e) => atualizarLinha(idx, "sat", e.target.value)}
                      placeholder="%"
                      className="h-8 min-w-[50px]"
                    />
                  </td>
                  <td className="p-1">
                    <Input
                      value={linha.assinatura}
                      onChange={(e) => atualizarLinha(idx, "assinatura", e.target.value)}
                      placeholder="Nome / COREN"
                      className="h-8 min-w-[160px]"
                    />
                  </td>
                  <td className="p-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => removerLinha(idx)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  if (standalone) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Ficha de Coleta de Sinais Vitais</h1>
            <p className="text-muted-foreground">Edite os registros e baixe em PDF.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={adicionarLinha}>
              <Plus className="mr-2 h-4 w-4" /> Adicionar linha
            </Button>
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
          </div>
        </div>
        {conteudo}
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Sinais vitais</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ficha de coleta de sinais vitais</DialogTitle>
        </DialogHeader>
        {conteudo}
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={fechar}>
            Fechar
          </Button>
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
