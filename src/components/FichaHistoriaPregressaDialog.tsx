import { useEffect, useRef, useState } from "react";
import jsPDF from "jspdf";
import { toast } from "sonner";
import { Download, History, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatNome } from "@/lib/format-nome";
import type { Residente } from "@/lib/mock-data";

type Props = {
  residente: Residente;
};

type HistoriaSalva = {
  antecedentesPessoais: string;
  antecedentesFamiliares: string;
  cirurgias: string;
  internacoes: string;
  doencasInfancia: string;
  vacinacao: string;
  habitos: string;
  medicacoesPrevias: string;
  ginecoObstetrica: string;
  historiaSaudeMental: string;
  observacoes: string;
  atualizadoEm?: string;
};

const VAZIA: HistoriaSalva = {
  antecedentesPessoais: "",
  antecedentesFamiliares: "",
  cirurgias: "",
  internacoes: "",
  doencasInfancia: "",
  vacinacao: "",
  habitos: "",
  medicacoesPrevias: "",
  ginecoObstetrica: "",
  historiaSaudeMental: "",
  observacoes: "",
};

function lerSalvo(key: string): HistoriaSalva {
  if (typeof window === "undefined") return VAZIA;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return VAZIA;
    return { ...VAZIA, ...(JSON.parse(raw) as Partial<HistoriaSalva>) };
  } catch {
    return VAZIA;
  }
}

export function FichaHistoriaPregressaDialog({ residente }: Props) {
  const [open, setOpen] = useState(false);
  const storageKey = `historia-pregressa:${residente.id}`;
  const [dados, setDados] = useState<HistoriaSalva>(() => lerSalvo(storageKey));
  const [sujo, setSujo] = useState(false);
  const carregandoRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    setDados(lerSalvo(storageKey));
    carregandoRef.current = true;
    setSujo(false);
  }, [open, storageKey]);

  useEffect(() => {
    if (!open) return;
    if (carregandoRef.current) {
      carregandoRef.current = false;
      return;
    }
    setSujo(true);
  }, [dados, open]);

  function atualizar<K extends keyof HistoriaSalva>(campo: K, valor: HistoriaSalva[K]) {
    setDados((prev) => ({ ...prev, [campo]: valor }));
  }

  function salvar() {
    const payload: HistoriaSalva = { ...dados, atualizadoEm: new Date().toISOString() };
    window.localStorage.setItem(storageKey, JSON.stringify(payload));
    setDados(payload);
    setSujo(false);
    toast.success("História pregressa salva.");
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

    // Paleta — idêntica à Ficha da residente
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
    doc.text("Ficha de História Pregressa", margin, 30);
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

    // Nome da residente em destaque
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
    doc.text(formatNome(residente.nome) || "—", margin + 14, y + 32);
    y += 40 + 14;

    // Seção de texto (título com barra + corpo)
    const secao = (titulo: string, texto: string) => {
      const conteudo = (texto || "").trim() || "—";
      // Título
      const alturaTitulo = 20;
      // Verificar espaço; se pouco, nova página
      if (y + alturaTitulo + 30 > pageH - 40) {
        doc.addPage();
        y = margin;
      }
      doc.setFillColor(...AZUL);
      doc.rect(margin, y - 8, 4, 13, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...AZUL);
      doc.text(titulo, margin + 10, y + 2);
      y += 14;

      // Corpo
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      doc.setTextColor(...CINZA_TXT);
      const linhas = doc.splitTextToSize(conteudo, pageW - margin * 2);
      const linhaAlt = 14;
      for (const linha of linhas) {
        if (y + linhaAlt > pageH - 40) {
          doc.addPage();
          y = margin;
        }
        doc.text(linha, margin, y + 10);
        y += linhaAlt;
      }
      y += 6;
      doc.setDrawColor(...CINZA_DIV);
      doc.line(margin, y, pageW - margin, y);
      y += 12;
    };

    secao("Antecedentes pessoais", dados.antecedentesPessoais);
    secao("Antecedentes familiares", dados.antecedentesFamiliares);
    secao("Cirurgias prévias", dados.cirurgias);
    secao("Internações prévias", dados.internacoes);
    secao("Doenças da infância", dados.doencasInfancia);
    secao("Vacinação", dados.vacinacao);
    secao("Hábitos (tabagismo, etilismo, atividade física)", dados.habitos);
    secao("Medicações prévias", dados.medicacoesPrevias);
    secao("História gineco-obstétrica", dados.ginecoObstetrica);
    secao("História de saúde mental", dados.historiaSaudeMental);
    secao("Observações", dados.observacoes);

    // Rodapé em todas as páginas
    const totalPag = doc.getNumberOfPages();
    for (let p = 1; p <= totalPag; p++) {
      doc.setPage(p);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(150, 158, 172);
      doc.setDrawColor(...CINZA_DIV);
      doc.line(margin, pageH - 28, pageW - margin, pageH - 28);
      doc.text(
        "Lar da Fraternidade Cristã — Ficha de História Pregressa",
        margin,
        pageH - 14,
      );
      doc.text(`Página ${p} de ${totalPag}`, pageW - margin, pageH - 14, {
        align: "right",
      });
    }

    const slug = (formatNome(residente.nome) || "residente")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    doc.save(`historia-pregressa-${slug}.pdf`);
    toast.success("Ficha baixada em PDF.");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <History className="mr-2 h-4 w-4" /> História pregressa
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ficha de história pregressa</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="space-y-1">
            <Label>Antecedentes pessoais</Label>
            <Textarea
              value={dados.antecedentesPessoais}
              onChange={(e) => atualizar("antecedentesPessoais", e.target.value)}
              rows={3}
              placeholder="Doenças crônicas, condições prévias..."
            />
          </div>
          <div className="space-y-1">
            <Label>Antecedentes familiares</Label>
            <Textarea
              value={dados.antecedentesFamiliares}
              onChange={(e) => atualizar("antecedentesFamiliares", e.target.value)}
              rows={2}
              placeholder="Ex.: mãe com hipertensão, pai com diabetes..."
            />
          </div>
          <div className="space-y-1">
            <Label>Cirurgias prévias</Label>
            <Textarea
              value={dados.cirurgias}
              onChange={(e) => atualizar("cirurgias", e.target.value)}
              rows={2}
              placeholder="Tipo e ano da cirurgia."
            />
          </div>
          <div className="space-y-1">
            <Label>Internações prévias</Label>
            <Textarea
              value={dados.internacoes}
              onChange={(e) => atualizar("internacoes", e.target.value)}
              rows={2}
              placeholder="Motivo e data."
            />
          </div>
          <div className="space-y-1">
            <Label>Doenças da infância</Label>
            <Textarea
              value={dados.doencasInfancia}
              onChange={(e) => atualizar("doencasInfancia", e.target.value)}
              rows={2}
              placeholder="Sarampo, catapora, caxumba..."
            />
          </div>
          <div className="space-y-1">
            <Label>Vacinação</Label>
            <Textarea
              value={dados.vacinacao}
              onChange={(e) => atualizar("vacinacao", e.target.value)}
              rows={2}
              placeholder="Ex.: influenza 2026, COVID em dia..."
            />
          </div>
          <div className="space-y-1">
            <Label>Hábitos (tabagismo, etilismo, atividade física)</Label>
            <Textarea
              value={dados.habitos}
              onChange={(e) => atualizar("habitos", e.target.value)}
              rows={2}
            />
          </div>
          <div className="space-y-1">
            <Label>Medicações prévias</Label>
            <Textarea
              value={dados.medicacoesPrevias}
              onChange={(e) => atualizar("medicacoesPrevias", e.target.value)}
              rows={2}
              placeholder="Medicamentos usados anteriormente e motivo da suspensão."
            />
          </div>
          <div className="space-y-1">
            <Label>História gineco-obstétrica</Label>
            <Textarea
              value={dados.ginecoObstetrica}
              onChange={(e) => atualizar("ginecoObstetrica", e.target.value)}
              rows={2}
              placeholder="Gestações, partos, menopausa..."
            />
          </div>
          <div className="space-y-1">
            <Label>História de saúde mental</Label>
            <Textarea
              value={dados.historiaSaudeMental}
              onChange={(e) => atualizar("historiaSaudeMental", e.target.value)}
              rows={3}
              placeholder="Início dos sintomas, diagnósticos anteriores, internações psiquiátricas..."
            />
          </div>
          <div className="space-y-1">
            <Label>Observações</Label>
            <Textarea
              value={dados.observacoes}
              onChange={(e) => atualizar("observacoes", e.target.value)}
              rows={3}
            />
          </div>
        </div>

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