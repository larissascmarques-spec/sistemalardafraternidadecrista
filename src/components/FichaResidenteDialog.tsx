import { useEffect, useRef, useState } from "react";
import jsPDF from "jspdf";
import { toast } from "sonner";
import { Download, FileText, Save } from "lucide-react";
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
import { formatNome } from "@/lib/format-nome";
import type { Residente } from "@/lib/mock-data";
import type { MedEmUso } from "@/lib/meds-em-uso";
import { isHaldolDecanoato } from "@/lib/haldol";

type Esquema = {
  nome: string;
  manha: string;
  tarde: string;
  noite: string;
};

type Props = {
  residente: Residente;
  medsEmUso: MedEmUso[];
  /**
   * Se informado, ao salvar a ficha o cadastro da residente também é
   * atualizado com estes campos: nome, dataNascimento,
   * dataInstitucionalizacao, cpf, sanitas, diagnosticos, alergias.
   * Assim ficha e prontuário compartilham os mesmos dados.
   */
  onSaveResidente?: (patch: {
    nome?: string;
    dataNascimento?: string;
    dataInstitucionalizacao?: string;
    cpf?: string;
    sanitas?: string;
    diagnosticos?: string[];
    alergias?: string[];
     medicacoesUso?: string[];
     esquemaMedicacoes?: Esquema[];
     atualizadoEm?: string;
  }) => void;
};

type FichaSalva = {
  nome: string;
  nascimento: string;
  idade: string;
  institucionalizacao: string;
  sanitas: string;
  cpf: string;
  diagnosticoPrincipal: string;
  comorbidades: string;
  alergias: string;
  esquema: Esquema[];
  atualizadoEm?: string;
};

function fmtBR(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso.includes("T") ? iso : iso + "T12:00:00");
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("pt-BR");
}

/** Converte "dd/mm/aaaa" para "aaaa-mm-dd". Retorna string vazia se inválido. */
function brParaIso(br: string): string {
  const s = (br || "").trim();
  if (!s) return "";
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return "";
  const dd = m[1].padStart(2, "0");
  const mm = m[2].padStart(2, "0");
  return `${m[3]}-${mm}-${dd}`;
}

function calcularIdade(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso.includes("T") ? iso : iso + "T12:00:00");
  if (Number.isNaN(d.getTime())) return "";
  const hoje = new Date();
  let anos = hoje.getFullYear() - d.getFullYear();
  const m = hoje.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < d.getDate())) anos--;
  return `${anos} anos`;
}

function lerFichaSalva(storageKey: string): Partial<FichaSalva> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as Partial<FichaSalva>) : {};
  } catch {
    return {};
  }
}

function normalizarLista(texto: string): string[] {
  return texto
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function esquemaDasMedicacoes(medsEmUso: MedEmUso[], salvoObj: Partial<FichaSalva>): Esquema[] {
  if (Array.isArray(salvoObj.esquema)) return salvoObj.esquema;
  return medsEmUso.map((m) => ({ nome: m.nome, manha: "", tarde: "", noite: "" }));
}

function esquemaInicial(
  residente: Residente,
  medsEmUso: MedEmUso[],
  salvoObj: Partial<FichaSalva>,
): Esquema[] {
  if (Array.isArray(residente.esquemaMedicacoes) && residente.esquemaMedicacoes.length > 0) {
    return residente.esquemaMedicacoes;
  }
  return esquemaDasMedicacoes(medsEmUso, salvoObj);
}

export function sincronizarFichaResidenteLocal(residente: Residente) {
  if (typeof window === "undefined") return;
  const storageKey = `ficha:${residente.id}`;
  const salvoObj = lerFichaSalva(storageKey);
  const diagnosticoPrincipal = residente.diagnosticos?.[0] ?? "";
  const comorbidades = (residente.diagnosticos ?? []).slice(1).join(", ");
  const esquemaSalvo = Array.isArray(residente.esquemaMedicacoes)
    ? residente.esquemaMedicacoes
    : Array.isArray(salvoObj.esquema)
    ? salvoObj.esquema
    : (residente.medicacoesUso ?? []).map((m) => ({ nome: m, manha: "", tarde: "", noite: "" }));

  const payload: Partial<FichaSalva> = {
    ...salvoObj,
    nome: formatNome(residente.nome),
    nascimento: fmtBR(residente.dataNascimento),
    idade: calcularIdade(residente.dataNascimento),
    institucionalizacao: fmtBR(residente.dataInstitucionalizacao),
    sanitas: residente.sanitas ?? "",
    cpf: residente.cpf ?? "",
    diagnosticoPrincipal,
    comorbidades,
    alergias: (residente.alergias ?? []).join(", "),
    esquema: esquemaSalvo,
    atualizadoEm: new Date().toISOString(),
  };
  window.localStorage.setItem(storageKey, JSON.stringify(payload));
}

export function FichaResidenteDialog({ residente, medsEmUso, onSaveResidente }: Props) {
  const [open, setOpen] = useState(false);
  const storageKey = `ficha:${residente.id}`;
  const salvoObj = lerFichaSalva(storageKey);

  const [nome, setNome] = useState(salvoObj.nome ?? formatNome(residente.nome));
  const [nascimento, setNascimento] = useState(
    salvoObj.nascimento ?? fmtBR(residente.dataNascimento),
  );
  const [idade, setIdade] = useState(
    salvoObj.idade ?? calcularIdade(residente.dataNascimento),
  );
  const [institucionalizacao, setInstitucionalizacao] = useState(
    salvoObj.institucionalizacao ?? fmtBR(residente.dataInstitucionalizacao),
  );
  const [sanitas, setSanitas] = useState(salvoObj.sanitas ?? residente.sanitas ?? "");
  const [cpf, setCpf] = useState(salvoObj.cpf ?? residente.cpf ?? "");
  const [diagnosticoPrincipal, setDiagnosticoPrincipal] = useState(
    salvoObj.diagnosticoPrincipal ?? residente.diagnosticos?.[0] ?? "",
  );
  const [comorbidades, setComorbidades] = useState(
    salvoObj.comorbidades ?? (residente.diagnosticos ?? []).slice(1).join(", "),
  );
  const [alergias, setAlergias] = useState(
    salvoObj.alergias ?? (residente.alergias ?? []).join(", "),
  );
  const [esquema, setEsquema] = useState<Esquema[]>(esquemaInicial(residente, medsEmUso, salvoObj));
  const [sujo, setSujo] = useState(false);
  const carregandoDadosRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    const atual = lerFichaSalva(storageKey);
    setNome(atual.nome ?? formatNome(residente.nome));
    setNascimento(atual.nascimento ?? fmtBR(residente.dataNascimento));
    setIdade(atual.idade ?? calcularIdade(residente.dataNascimento));
    setInstitucionalizacao(
      atual.institucionalizacao ?? fmtBR(residente.dataInstitucionalizacao),
    );
    setSanitas(atual.sanitas ?? residente.sanitas ?? "");
    setCpf(atual.cpf ?? residente.cpf ?? "");
    setDiagnosticoPrincipal(
      atual.diagnosticoPrincipal ?? residente.diagnosticos?.[0] ?? "",
    );
    setComorbidades(
      atual.comorbidades ?? (residente.diagnosticos ?? []).slice(1).join(", "),
    );
    setAlergias(atual.alergias ?? (residente.alergias ?? []).join(", "));
    setEsquema(esquemaInicial(residente, medsEmUso, atual));
    carregandoDadosRef.current = true;
    setSujo(false);
  }, [open, storageKey, residente, medsEmUso]);

  // Marca como "não salvo" quando qualquer campo muda após aberto.
  useEffect(() => {
    if (!open) return;
    if (carregandoDadosRef.current) {
      carregandoDadosRef.current = false;
      return;
    }
    setSujo(true);
  }, [nome, nascimento, idade, institucionalizacao, sanitas, cpf, diagnosticoPrincipal, comorbidades, alergias, esquema, open]);

  function salvarFicha() {
    const payload = {
      nome,
      nascimento,
      idade,
      institucionalizacao,
      sanitas,
      cpf,
      diagnosticoPrincipal,
      comorbidades,
      alergias,
      esquema,
      atualizadoEm: new Date().toISOString(),
    };
    window.localStorage.setItem(storageKey, JSON.stringify(payload));
    // Sincroniza com o cadastro da residente (prontuário), para que
    // nome, datas, documentos, diagnósticos e alergias fiquem iguais
    // nos dois lugares e a usuária não precise editar duas vezes.
    if (onSaveResidente) {
      const diagnosticos = [
        diagnosticoPrincipal.trim(),
        ...comorbidades
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      ].filter(Boolean);
      const alergiasArr = normalizarLista(alergias);
      const medicacoesUso = esquema
        .map((row) => row.nome.trim())
        .filter(Boolean);
      onSaveResidente({
        nome: nome.trim() || undefined,
        dataNascimento: brParaIso(nascimento) || residente.dataNascimento,
        dataInstitucionalizacao:
          brParaIso(institucionalizacao) || residente.dataInstitucionalizacao,
        cpf: cpf.trim(),
        sanitas: sanitas.trim(),
        diagnosticos,
        alergias: alergiasArr,
        medicacoesUso,
        esquemaMedicacoes: esquema,
        atualizadoEm: payload.atualizadoEm,
      });
    }
    setSujo(false);
    toast.success("Ficha salva.");
  }

  function fechar() {
    if (sujo) {
      const ok = window.confirm(
        "Você tem alterações não salvas. Fechar mesmo assim?",
      );
      if (!ok) return;
    }
    setOpen(false);
  }

  function atualizarEsquema(i: number, campo: keyof Esquema, valor: string) {
    setEsquema((prev) =>
      prev.map((row, idx) => (idx === i ? { ...row, [campo]: valor } : row)),
    );
  }

  function adicionarLinha() {
    setEsquema((prev) => [...prev, { nome: "", manha: "", tarde: "", noite: "" }]);
  }

  function removerLinha(i: number) {
    setEsquema((prev) => prev.filter((_, idx) => idx !== i));
  }

  function baixarPDF() {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 32;
    let y = margin;

    // Paleta
    const AZUL: [number, number, number] = [30, 64, 124]; // azul hospitalar
    const AZUL_CLARO: [number, number, number] = [235, 242, 251];
    const CINZA_TXT: [number, number, number] = [60, 66, 78];
    const CINZA_LABEL: [number, number, number] = [40, 55, 85];
    const CINZA_DIV: [number, number, number] = [225, 229, 236];

    // Cabeçalho compacto
    doc.setFillColor(...AZUL);
    doc.rect(0, 0, pageW, 62, "F");
    doc.setFillColor(...AZUL_CLARO);
    doc.rect(0, 62, pageW, 4, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);
    doc.text("Ficha da Residente", margin, 30);
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

    y = 84;
    doc.setTextColor(...CINZA_TXT);

    const linhaCampo = (rotulo: string, valor: string) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(...CINZA_LABEL);
      doc.text(rotulo.toUpperCase(), margin, y, { charSpace: 0.6 });
      y += 15;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(...CINZA_TXT);
      const linhas = doc.splitTextToSize(valor || "—", pageW - margin * 2);
      doc.text(linhas, margin, y);
      y += linhas.length * 14 + 8;
      doc.setDrawColor(...CINZA_DIV);
      doc.line(margin, y, pageW - margin, y);
      y += 11;
    };

    // Card de identificação com fundo claro
    const cardX = margin;
    const cardW = pageW - margin * 2;
    const cardPadding = 10;
    const cardTop = y;

    // Grid 2 colunas dentro do card
    const colGap = 20;
    const colW = (cardW - cardPadding * 2 - colGap) / 2;
    const colLX = cardX + cardPadding;
    const colRX = colLX + colW + colGap;

    const colCampo = (x: number, largura: number, yLocal: number, rotulo: string, valor: string) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(...CINZA_LABEL);
      doc.text(rotulo.toUpperCase(), x, yLocal, { charSpace: 0.6 });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(...CINZA_TXT);
      const linhas = doc.splitTextToSize(valor || "—", largura);
      doc.text(linhas, x, yLocal + 16);
      return linhas.length * 14 + 19;
    };

    const pares: Array<[string, string, string, string]> = [
      ["Nome", nome, "Data de nascimento", nascimento],
      ["Idade", idade, "Data de institucionalização", institucionalizacao],
      ["Nº SANITAS", sanitas, "CPF", cpf],
    ];

    // pré-calcula altura
    let yTmp = cardTop + cardPadding + 4;
    const alturas: number[] = [];
    for (const [lL, vL, lR, vR] of pares) {
      const hL = colCampo(-9999, colW, yTmp, lL, vL);
      const hR = colCampo(-9999, colW, yTmp, lR, vR);
      const h = Math.max(hL, hR);
      alturas.push(h);
      yTmp += h + 5;
    }
    const cardH = yTmp - cardTop + cardPadding - 4;

    // fundo do card
    doc.setFillColor(...AZUL_CLARO);
    doc.roundedRect(cardX, cardTop, cardW, cardH, 8, 8, "F");
    // borda lateral azul
    doc.setFillColor(...AZUL);
    doc.rect(cardX, cardTop, 4, cardH, "F");

    // desenha campos
    let yCur = cardTop + cardPadding + 4;
    pares.forEach(([lL, vL, lR, vR], i) => {
      colCampo(colLX, colW, yCur, lL, vL);
      colCampo(colRX, colW, yCur, lR, vR);
      yCur += alturas[i] + 5;
      if (i < pares.length - 1) {
        doc.setDrawColor(210, 220, 235);
        doc.line(cardX + cardPadding, yCur - 3, cardX + cardW - cardPadding, yCur - 3);
      }
    });

    y = cardTop + cardH + 12;

    linhaCampo("Diagnóstico principal", diagnosticoPrincipal);
    linhaCampo("Comorbidades", comorbidades);
    const alergiasTxt = alergias.trim() || "Desconhece alergia medicamentosa";
    linhaCampo("Alergia a medicação", alergiasTxt);

    // Medicações em uso — título com barra
    y += 2;
    doc.setFillColor(...AZUL);
    doc.rect(margin, y - 8, 4, 13, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...AZUL);
    doc.text("Medicações em uso", margin + 10, y + 2);
    y += 16;

    // Cabeçalho da tabela
    const larguraTabela = pageW - margin * 2;
    const colMedW = Math.round(larguraTabela * 0.46);
    const colTurnoW = Math.round((larguraTabela - colMedW) / 3);
    const colX = {
      med: margin,
      manha: margin + colMedW,
      tarde: margin + colMedW + colTurnoW,
      noite: margin + colMedW + colTurnoW * 2,
    };

    // Tabela com divisórias
    const colsX = [colX.med, colX.manha, colX.tarde, colX.noite, margin + larguraTabela];
    const padX = 5;

    // Escala dinâmica: quanto mais medicações, menor a fonte, para caber em 1 página.
    const linhasValidasPreview = esquema
      .filter((e) => e.nome.trim());
    const totalMeds = linhasValidasPreview.length;
    const espacoRestante = pageH - 60 - y - 24; // desconta rodapé e header da tabela
    const linhasNecessarias = totalMeds + 1; // + cabeçalho
    const altIdeal = Math.max(14, Math.min(22, Math.floor(espacoRestante / Math.max(1, linhasNecessarias))));
    const padY = Math.max(2, Math.floor((altIdeal - 10) / 2));
    const fonteCel = altIdeal >= 20 ? 10 : altIdeal >= 17 ? 9 : altIdeal >= 15 ? 8.2 : 7.5;

    const desenharLinha = (
      valores: [string, string, string, string],
      opts: { header?: boolean; mergeTime?: boolean } = {},
    ) => {
      const larguras = [
        colsX[1] - colsX[0] - padX * 2,
        colsX[2] - colsX[1] - padX * 2,
        colsX[3] - colsX[2] - padX * 2,
        colsX[4] - colsX[3] - padX * 2,
      ];
      const mergedTimeWidth =
        colsX[4] - colsX[1] - padX * 2;
      const wrapped = opts.mergeTime
        ? [
            doc.splitTextToSize(valores[0] || "—", larguras[0]),
            doc.splitTextToSize(valores[1] || "—", mergedTimeWidth),
          ]
        : valores.map((v, i) =>
            doc.splitTextToSize(v || "—", larguras[i]),
          );
      const maxLinhas = Math.max(...wrapped.map((l) => l.length));
      const linhaAlt = fonteCel + 2;
      const alt = Math.max(altIdeal, maxLinhas * linhaAlt + padY * 2);

      if (opts.header) {
        doc.setFillColor(...AZUL_CLARO);
        doc.rect(margin, y, larguraTabela, alt, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(Math.max(8, fonteCel));
        doc.setTextColor(...AZUL);
      } else {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(fonteCel);
        doc.setTextColor(...CINZA_TXT);
      }

      const baseline = y + padY + fonteCel;
      // Texto das células
      if (opts.mergeTime) {
        doc.text(wrapped[0], colsX[0] + padX, baseline);
        doc.text(wrapped[1], colsX[1] + padX, baseline);
      } else {
        wrapped.forEach((linhas, i) => {
          doc.text(linhas, colsX[i] + padX, baseline);
        });
      }

      // Bordas
      doc.setDrawColor(...CINZA_DIV);
      doc.setLineWidth(0.5);
      // horizontal inferior
      doc.line(margin, y + alt, margin + larguraTabela, y + alt);
      // verticais (pula divisórias entre Manhã/Tarde/Noite quando mesclado)
      colsX.forEach((x, idx) => {
        if (opts.mergeTime && (idx === 2 || idx === 3)) return;
        doc.line(x, y, x, y + alt);
      });

      y += alt;
    };

    // Borda superior da tabela
    doc.setDrawColor(...CINZA_DIV);
    doc.setLineWidth(0.5);
    doc.line(margin, y, margin + larguraTabela, y);

    desenharLinha(["Medicação", "Manhã", "Tarde", "Noite"], { header: true });

    const linhasValidas = esquema
      .filter((e) => e.nome.trim())
      .slice()
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" }));
    if (linhasValidas.length === 0) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      const alt = 20;
      doc.rect(margin, y, larguraTabela, alt);
      doc.text("Nenhuma medicação cadastrada.", margin + padX, y + 13);
      y += alt;
    } else {
      linhasValidas.forEach((row) => {
        if (isHaldolDecanoato(row.nome)) {
          desenharLinha(
            [row.nome, row.manha || "—", "", ""],
            { mergeTime: true },
          );
        } else {
          desenharLinha([row.nome, row.manha, row.tarde, row.noite]);
        }
      });
    }
    y += 4;

    // Rodapé
    const totalPag = doc.getNumberOfPages();
    for (let p = 1; p <= totalPag; p++) {
      doc.setPage(p);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(150, 158, 172);
      doc.setDrawColor(...CINZA_DIV);
      doc.line(margin, pageH - 28, pageW - margin, pageH - 28);
      doc.text("Lar da Fraternidade Cristã — Ficha da Residente", margin, pageH - 14);
      doc.text(
        `Página ${p} de ${totalPag}`,
        pageW - margin,
        pageH - 14,
        { align: "right" },
      );
    }

    const slug = (nome || "ficha")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    doc.save(`ficha-${slug}.pdf`);
    toast.success("Ficha baixada em PDF.");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileText className="mr-2 h-4 w-4" /> Ficha da residente
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ficha da residente</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label>Nome</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Data de nascimento</Label>
              <Input
                value={nascimento}
                onChange={(e) => setNascimento(e.target.value)}
                placeholder="dd/mm/aaaa"
              />
            </div>
            <div className="space-y-1">
              <Label>Idade</Label>
              <Input
                value={idade}
                onChange={(e) => setIdade(e.target.value)}
                placeholder="Ex.: 54 anos"
              />
            </div>
            <div className="space-y-1">
              <Label>Data de institucionalização</Label>
              <Input
                value={institucionalizacao}
                onChange={(e) => setInstitucionalizacao(e.target.value)}
                placeholder="dd/mm/aaaa"
              />
            </div>
            <div className="space-y-1">
              <Label>Nº SANITAS</Label>
              <Input value={sanitas} onChange={(e) => setSanitas(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>CPF</Label>
              <Input value={cpf} onChange={(e) => setCpf(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Diagnóstico principal</Label>
            <Input
              value={diagnosticoPrincipal}
              onChange={(e) => setDiagnosticoPrincipal(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label>Comorbidades</Label>
            <Textarea
              value={comorbidades}
              onChange={(e) => setComorbidades(e.target.value)}
              rows={2}
              placeholder="Separe por vírgula"
            />
          </div>

          <div className="space-y-1">
            <Label>Alergia a medicação</Label>
            <Textarea
              value={alergias}
              onChange={(e) => setAlergias(e.target.value)}
              rows={2}
              placeholder="Separe por vírgula. Deixe em branco se não houver."
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-base">Medicações em uso e esquema</Label>
              <Button type="button" variant="outline" size="sm" onClick={adicionarLinha}>
                + Adicionar
              </Button>
            </div>
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="p-2 text-left">Medicação</th>
                    <th className="p-2 text-left">Manhã</th>
                    <th className="p-2 text-left">Tarde</th>
                    <th className="p-2 text-left">Noite</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {esquema.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-3 text-center text-muted-foreground">
                        Nenhuma medicação. Clique em "Adicionar".
                      </td>
                    </tr>
                  )}
                  {esquema.map((row, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-1">
                        <Input
                          value={row.nome}
                          onChange={(e) => atualizarEsquema(i, "nome", e.target.value)}
                          placeholder="Ex.: Risperidona 3mg"
                          className="h-8"
                        />
                      </td>
                      {isHaldolDecanoato(row.nome) ? (
                        <td className="p-1" colSpan={3}>
                          <Input
                            value={row.manha}
                            onChange={(e) =>
                              atualizarEsquema(i, "manha", e.target.value)
                            }
                            placeholder="Ex.: 3 ampolas IM a cada 30 dias"
                            className="h-8"
                          />
                        </td>
                      ) : (
                        <>
                          <td className="p-1">
                            <Input
                              value={row.manha}
                              onChange={(e) => atualizarEsquema(i, "manha", e.target.value)}
                              placeholder="Ex.: 1 cp"
                              className="h-8"
                            />
                          </td>
                          <td className="p-1">
                            <Input
                              value={row.tarde}
                              onChange={(e) => atualizarEsquema(i, "tarde", e.target.value)}
                              placeholder="Ex.: —"
                              className="h-8"
                            />
                          </td>
                          <td className="p-1">
                            <Input
                              value={row.noite}
                              onChange={(e) => atualizarEsquema(i, "noite", e.target.value)}
                              placeholder="Ex.: 1 cp"
                              className="h-8"
                            />
                          </td>
                        </>
                      )}
                      <td className="p-1 text-center">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => removerLinha(i)}
                          className="h-8 px-2 text-muted-foreground"
                        >
                          ×
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={fechar}>
            Fechar
          </Button>
          <Button
            variant={sujo ? "default" : "outline"}
            onClick={salvarFicha}
          >
            <Save className="mr-2 h-4 w-4" />
            {sujo ? "Salvar ficha" : "Salvo"}
          </Button>
          <Button
            onClick={() => {
              salvarFicha();
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