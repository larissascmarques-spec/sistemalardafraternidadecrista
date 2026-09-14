import { useReceitas } from "@/lib/receitas-cloud";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  FileWarning,
  PackageX,
  Users,
  CalendarClock,
  PackagePlus,
  Syringe,
  CheckCircle2,
  ChevronRight,
  FlaskConical,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { diasAte } from "@/lib/mock-data";
import { fmtIsoBR } from "@/lib/date-utils";
import { useLocalStorage } from "@/hooks/use-local-storage";
import {
  RECEITAS_STORAGE_KEY,
  dataLimiteRetirada,
  medicacaoEstaRetirada,
  chaveBaixaMedicacao,
  proximaRetiradaAtiva,
  type ReceitaSalva,
} from "@/lib/receitas-store";
import { formatMedNome } from "@/lib/format-med";
import { formatNome } from "@/lib/format-nome";
import { useAllResidentes } from "@/lib/residentes-store";
import type { ResidenteSalvo } from "@/lib/residentes-store";
import { toast } from "sonner";
import { receitasVigentes, receitasVigentesPorMedicacao } from "@/lib/meds-em-uso";
import { useEstoque } from "@/lib/estoque-store";
import { useInsumos, diasRestantesInsumo } from "@/lib/insumos-store";
import { useAgendamentos } from "@/lib/agendamentos-store";
import { addDaysIso } from "@/lib/date-utils";
import { consumoGrupoLotes, saldoGrupo, situacaoPorResidente } from "@/lib/lotes";
import { textoQuantidade } from "@/lib/unidades";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Painel de pendências | Lar da Fraternidade Cristã" },
      {
        name: "description",
        content:
          "Painel diário com receitas a renovar, retiradas, estoque baixo, consultas e Haldol de cada residente.",
      },
      { property: "og:title", content: "Painel de pendências | Lar da Fraternidade Cristã" },
      {
        property: "og:description",
        content: "Acompanhe receitas, estoque, consultas e Haldol por residente em uma tela só.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function verboRetirada(origem: string | undefined): string {
  const o = (origem || "").toLowerCase();
  if (o.includes("farm") || o.includes("particular") || o.includes("compra")) return "Comprar";
  return "Retirar";
}

type Nivel = "critico" | "alerta" | "programado";

type Pendencia = {
  id: string;
  residenteId: string;
  categoria: "receita" | "retirada" | "estoque" | "agenda" | "haldol";
  titulo: string;
  detalhe: string;
  dias: number;
  nivel: Nivel;
  acao?: { label: string; onClick: () => void };
};

function nivelPorDias(dias: number, limiteAlerta = 3): Nivel {
  if (dias <= 1) return "critico";
  if (dias <= limiteAlerta) return "alerta";
  return "programado";
}

function textoPrazo(dias: number, data: string): string {
  if (dias < 0) return `atrasado há ${Math.abs(dias)} ${Math.abs(dias) === 1 ? "dia" : "dias"} (${fmtIsoBR(data)})`;
  if (dias === 0) return `hoje (${fmtIsoBR(data)})`;
  if (dias === 1) return `amanhã (${fmtIsoBR(data)})`;
  return `em ${dias} dias (${fmtIsoBR(data)})`;
}

function Index() {
  const [salvasAll] = useReceitas(RECEITAS_STORAGE_KEY, []);
  const salvas = receitasVigentes(salvasAll);
  const salvasPorMedicacao = receitasVigentesPorMedicacao(salvasAll);
  const { nomePor, todos, salvos, setSalvos } = useAllResidentes();
  const { itens: estoqueItens } = useEstoque();
  const { itens: insumoItens } = useInsumos();
  const { itens: agendamentos } = useAgendamentos();

  function marcarHaldolFeito(id: string) {
    const r = salvos.find((x) => x.id === id);
    if (!r?.haldolInjetavel) {
      toast.error("Só é possível marcar pelo cadastro salvo da residente.");
      return;
    }
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
    setSalvos(salvos.map((x) => (x.id === id ? atualizado : x)));
    toast.success(`Aplicação registrada. Próxima dose: ${fmtIsoBR(proxima)}`);
  }

  const pendencias: Pendencia[] = [];

  // 1) Receitas a renovar / vencidas (10 dias) — mesmo já retiradas, a receita
  // precisa ser renovada antes de vencer.
  for (const r of salvas) {
    const dias = diasAte(r.vencimento);
    if (dias > 10) continue;
    pendencias.push({
      id: `rec-${r.id}`,
      residenteId: r.residenteId,
      categoria: "receita",
      titulo: `Renovar receita — ${formatMedNome(r.medicacao)}`,
      detalhe: dias < 0 ? `Vencida ${textoPrazo(dias, r.vencimento)}` : `Vence ${textoPrazo(dias, r.vencimento)}`,
      dias,
      nivel: nivelPorDias(dias),
    });
  }

  // 2) Retirar / comprar medicação (10 dias)
  for (const { receita: r, medicacao: m } of salvasPorMedicacao) {
    let data: string | undefined;
    let exigeNovaReceita = false;
    if (!medicacaoEstaRetirada(r, m)) {
      data = dataLimiteRetirada(r);
    } else {
      const baixa = proximaRetiradaAtiva(r, m);
      if (!baixa) continue;
      data = baixa.proximaRetirada;
      exigeNovaReceita = !!baixa.proximaRetiradaExigeNovaReceita;
    }
    if (!data) continue;
    const dias = diasAte(data);
    if (dias > 10) continue;
    pendencias.push({
      id: `ret-${r.id}-${chaveBaixaMedicacao(m)}`,
      residenteId: r.residenteId,
      categoria: "retirada",
      titulo: `${verboRetirada(r.origem)} ${formatMedNome(m)}`,
      detalhe: `${textoPrazo(dias, data)}${r.origem ? ` • ${r.origem}` : ""}${exigeNovaReceita ? " • precisa de nova receita" : ""}`,
      dias,
      nivel: nivelPorDias(dias),
    });
  }

  // 3) Estoque baixo por medicação — saldo REAL de hoje (já descontado o
  //    consumo diário desde o lançamento), calculado para cada residente.
  const gruposEstoque = (() => {
    const grupos = new Map<string, typeof estoqueItens>();
    for (const it of estoqueItens) {
      const k = (it.medicacao || "").trim().toLowerCase();
      if (!grupos.has(k)) grupos.set(k, []);
      grupos.get(k)!.push(it);
    }
    const out: Array<{
      chave: string;
      medicacao: string;
      quantidade: number;
      dias: number;
      residenteId: string;
      amostra: (typeof estoqueItens)[number];
    }> = [];
    for (const lotes of grupos.values()) {
      const chave = (lotes[0].medicacao || "").toLowerCase();
      const porResidente = situacaoPorResidente(lotes);
      if (porResidente.length > 0) {
        for (const s of porResidente) {
          out.push({
            chave,
            medicacao: lotes[0].medicacao,
            quantidade: s.saldo,
            dias: s.dias,
            residenteId: s.residenteId,
            amostra: lotes[0],
          });
        }
      } else {
        const consumo = consumoGrupoLotes(lotes);
        const saldo = saldoGrupo(lotes);
        const residentes = Array.from(
          new Set(
            lotes.flatMap((l) => (l.pacientesUso ?? []).map((p) => p.residenteId).filter(Boolean)),
          ),
        );
        for (const rid of residentes) {
          out.push({
            chave,
            medicacao: lotes[0].medicacao,
            quantidade: saldo,
            dias: consumo > 0 ? Math.floor(saldo / consumo) : 999,
            residenteId: rid,
            amostra: lotes[0],
          });
        }
      }
    }
    return out;
  })();
  for (const g of gruposEstoque) {
    if (g.dias > 10) continue;
    const acabou = g.quantidade <= 0;
    pendencias.push({
      id: `est-${g.chave}-${g.residenteId}`,
      residenteId: g.residenteId,
      categoria: "estoque",
      titulo: acabou
        ? `Medicação acabou — ${formatMedNome(g.medicacao)}`
        : `Estoque baixo — ${formatMedNome(g.medicacao)}`,
      detalhe: acabou
        ? "Saldo zerado pela contagem diária. Comprar/retirar hoje."
        : `Restam ${textoQuantidade(g.quantidade, g.amostra)} (~${g.dias} dias)`,
      dias: g.dias,
      nivel: nivelPorDias(g.dias),
    });
  }

  // 4) Consultas / exames (2 dias) e resultados a retirar
  for (const a of agendamentos) {
    if (!a.realizado && a.status !== "Aguardando vaga") {
      const dias = diasAte(a.data);
      if (dias <= 2) {
        pendencias.push({
          id: `ag-${a.id}`,
          residenteId: a.residenteId,
          categoria: "agenda",
          titulo: `${a.tipo}: ${a.descricao}`,
          detalhe: `${textoPrazo(dias, a.data)}${a.hora ? ` às ${a.hora}` : ""}${a.local ? ` • ${a.local}` : ""}`,
          dias,
          nivel: nivelPorDias(dias, 2),
        });
      }
    }
    if (a.realizado && a.resultadoData && !a.resultadoRetirado) {
      const dias = diasAte(a.resultadoData);
      if (dias <= 2) {
        pendencias.push({
          id: `res-${a.id}`,
          residenteId: a.residenteId,
          categoria: "agenda",
          titulo: `Buscar resultado — ${a.descricao}`,
          detalhe: textoPrazo(dias, a.resultadoData),
          dias,
          nivel: nivelPorDias(dias, 2),
        });
      }
    }
  }

  // 5) Haldol injetável (7 dias)
  for (const r of todos as ResidenteSalvo[]) {
    const h = r.haldolInjetavel;
    if (!h?.proximaDose) continue;
    const dias = diasAte(h.proximaDose);
    if (dias > 7) continue;
    pendencias.push({
      id: `hal-${r.id}`,
      residenteId: r.id,
      categoria: "haldol",
      titulo: "Haldol injetável — aplicar dose",
      detalhe: `${textoPrazo(dias, h.proximaDose)} • a cada ${h.periodicidadeDias} dias`,
      dias,
      nivel: nivelPorDias(dias, 3),
      acao: { label: "Marcar feita", onClick: () => marcarHaldolFeito(r.id) },
    });
  }

  // Agrupa por residente
  const porResidente = new Map<string, Pendencia[]>();
  for (const p of pendencias) {
    if (!porResidente.has(p.residenteId)) porResidente.set(p.residenteId, []);
    porResidente.get(p.residenteId)!.push(p);
  }
  const grupos = Array.from(porResidente.entries())
    .map(([rid, itens]) => ({
      residenteId: rid,
      nome: nomePor(rid),
      itens: itens.sort((a, b) => a.dias - b.dias),
      pior: Math.min(...itens.map((i) => i.dias)),
    }))
    .sort((a, b) => a.pior - b.pior);

  // Itens da casa (insumos) e rotinas
  const insumosBaixo = insumoItens
    .map((i) => ({ ...i, dias: diasRestantesInsumo(i) }))
    .filter((i) => i.dias <= 10 || i.quantidade <= i.estoqueMinimo)
    .sort((a, b) => a.dias - b.dias);

  const [ultimaBuscaSAD, setUltimaBuscaSAD] = useLocalStorage<string>(
    "farmalar.sad.rosilda.ultima",
    "2026-07-08",
  );
  const proximaBuscaSAD = addDaysIso(ultimaBuscaSAD, 15);
  const diasSAD = diasAte(proximaBuscaSAD);

  const [ultimaFarmPop, setUltimaFarmPop] = useLocalStorage<string>(
    "farmalar.farmaciapopular.ultima",
    new Date().toISOString().slice(0, 10),
  );
  const proximaFarmPop = addDaysIso(ultimaFarmPop, 30);
  const diasFarmPop = diasAte(proximaFarmPop);

  const urgentes = pendencias.filter((p) => p.nivel === "critico").length;

  const saudacao = (() => {
    const h = new Date().getHours();
    return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
  })();

  return (
    <div className="space-y-8 p-6">
      <header className="flex flex-col gap-1 border-b pb-5">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-primary" />
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Painel da residência
          </p>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">{saudacao}, equipe.</h1>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
          {" — "}
          {pendencias.length === 0
            ? "nenhuma pendência nos próximos dias."
            : `${pendencias.length} pendência${pendencias.length > 1 ? "s" : ""} em ${grupos.length} residente${grupos.length > 1 ? "s" : ""}${urgentes ? `, ${urgentes} para hoje` : ""}.`}
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Users className="h-5 w-5" />} label="Residentes" value={todos.length} tone="primary" />
        <StatCard
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Para hoje"
          value={urgentes}
          tone={urgentes > 0 ? "destructive" : "success"}
        />
        <StatCard
          icon={<CalendarClock className="h-5 w-5" />}
          label="Próximos 10 dias"
          value={pendencias.length}
          tone={pendencias.length ? "warning" : "muted"}
        />
        <StatCard
          icon={<PackagePlus className="h-5 w-5" />}
          label="Insumos baixos"
          value={insumosBaixo.length}
          tone={insumosBaixo.length ? "warning" : "muted"}
        />
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="h-6 w-1.5 rounded bg-primary" />
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Pendências por residente</h2>
            <p className="text-xs text-muted-foreground">
              Em ordem de urgência. Clique no nome para abrir o perfil.
            </p>
          </div>
        </div>

        {grupos.length === 0 ? (
          <div className="flex items-center gap-2 rounded-lg border border-dashed bg-muted/30 p-6 text-sm text-muted-foreground">
            <CheckCircle2 className="h-5 w-5 text-[color:var(--success)]" />
            Nenhuma pendência de receita, estoque, consulta ou Haldol nos próximos dias.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {grupos.map((g) => (
              <ResidenteCard key={g.residenteId} grupo={g} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="h-6 w-1.5 rounded bg-[color:var(--warning)]" />
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Rotinas da casa</h2>
            <p className="text-xs text-muted-foreground">Buscas periódicas e insumos gerais.</p>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <RotinaCard
            titulo="Insumos SAD — Rosilda"
            subtitulo="A cada 15 dias"
            ultima={ultimaBuscaSAD}
            proxima={proximaBuscaSAD}
            dias={diasSAD}
            onMarcar={() => setUltimaBuscaSAD(new Date().toISOString().slice(0, 10))}
          />
          <RotinaCard
            titulo="Farmácia Popular"
            subtitulo="Fraldas, metformina e losartana — a cada 30 dias"
            ultima={ultimaFarmPop}
            proxima={proximaFarmPop}
            dias={diasFarmPop}
            onMarcar={() => setUltimaFarmPop(new Date().toISOString().slice(0, 10))}
          />
          <Card>
            <CardContent className="space-y-2 p-4">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <PackagePlus className="h-4 w-4 text-[color:var(--warning)]" />
                  Insumos acabando
                </p>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/insumos">Ver</Link>
                </Button>
              </div>
              {insumosBaixo.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhum insumo acabando.</p>
              ) : (
                insumosBaixo.slice(0, 5).map((i) => (
                  <p key={i.codigo} className="text-xs">
                    <span className="font-medium">{i.nome}</span>{" "}
                    <span className="text-muted-foreground">
                      — restam {i.quantidade} un. (~{i.dias} dias)
                    </span>
                  </p>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

function iconeCategoria(c: Pendencia["categoria"]) {
  const cls = "h-4 w-4 shrink-0";
  if (c === "receita") return <FileWarning className={cls} />;
  if (c === "retirada") return <PackagePlus className={cls} />;
  if (c === "estoque") return <PackageX className={cls} />;
  if (c === "haldol") return <Syringe className={cls} />;
  return <FlaskConical className={cls} />;
}

function ResidenteCard({
  grupo,
}: {
  grupo: { residenteId: string; nome: string; itens: Pendencia[]; pior: number };
}) {
  const pior = grupo.itens[0]?.nivel ?? "programado";
  const borda =
    pior === "critico"
      ? "border-l-destructive"
      : pior === "alerta"
        ? "border-l-[color:var(--warning)]"
        : "border-l-primary/40";
  return (
    <Card className={`border-l-4 ${borda}`}>
      <CardContent className="p-4">
        <Link
          to="/residentes/$id"
          params={{ id: grupo.residenteId }}
          className="mb-3 flex items-center justify-between gap-2 hover:underline"
        >
          <span className="truncate text-base font-semibold">{formatNome(grupo.nome)}</span>
          <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
            {grupo.itens.length} pendência{grupo.itens.length > 1 ? "s" : ""}
            <ChevronRight className="h-4 w-4" />
          </span>
        </Link>
        <ul className="space-y-2">
          {grupo.itens.map((p) => (
            <li key={p.id} className="flex items-start justify-between gap-3 rounded-md bg-muted/40 p-2.5">
              <div className="flex min-w-0 items-start gap-2">
                <span
                  className={
                    p.nivel === "critico"
                      ? "text-destructive"
                      : p.nivel === "alerta"
                        ? "text-[color:var(--warning)]"
                        : "text-muted-foreground"
                  }
                >
                  {iconeCategoria(p.categoria)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{p.titulo}</p>
                  <p className="text-xs text-muted-foreground">{p.detalhe}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {p.acao && (
                  <Button size="sm" className="h-7 text-xs" onClick={p.acao.onClick}>
                    {p.acao.label}
                  </Button>
                )}
                <Badge
                  variant={p.nivel === "critico" ? "destructive" : "secondary"}
                  className={
                    p.nivel === "alerta"
                      ? "bg-[color:var(--warning)]/20 text-[color:var(--warning-foreground)]"
                      : ""
                  }
                >
                  {p.dias < 0 ? `${Math.abs(p.dias)}d atraso` : p.dias === 0 ? "hoje" : `${p.dias}d`}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function RotinaCard({
  titulo,
  subtitulo,
  ultima,
  proxima,
  dias,
  onMarcar,
}: {
  titulo: string;
  subtitulo: string;
  ultima: string;
  proxima: string;
  dias: number;
  onMarcar: () => void;
}) {
  return (
    <Card>
      <CardContent className="space-y-1 p-4">
        <p className="text-sm font-semibold">{titulo}</p>
        <p className="text-xs text-muted-foreground">{subtitulo}</p>
        <p className="pt-1 text-xs text-muted-foreground">Última: {fmtIsoBR(ultima)}</p>
        <p className="text-sm">
          Próxima: <span className="font-medium">{fmtIsoBR(proxima)}</span>{" "}
          {dias < 0 ? (
            <Badge variant="destructive" className="ml-1">Atrasada {Math.abs(dias)}d</Badge>
          ) : dias === 0 ? (
            <Badge variant="destructive" className="ml-1">Hoje</Badge>
          ) : dias <= 3 ? (
            <Badge className="ml-1 bg-[color:var(--warning)]/20 text-[color:var(--warning-foreground)]">
              Em {dias}d
            </Badge>
          ) : (
            <Badge className="ml-1 bg-[color:var(--success)]/20 text-[color:var(--success)]">
              Em {dias}d
            </Badge>
          )}
        </p>
        <Button size="sm" variant="outline" className="mt-2" onClick={onMarcar}>
          Marquei hoje
        </Button>
      </CardContent>
    </Card>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "primary" | "destructive" | "warning" | "success" | "muted";
}) {
  const toneClass =
    tone === "destructive"
      ? "bg-destructive/10 text-destructive"
      : tone === "warning"
        ? "bg-[color:var(--warning)]/15 text-[color:var(--warning-foreground)]"
        : tone === "success"
          ? "bg-[color:var(--success)]/15 text-[color:var(--success)]"
          : tone === "muted"
            ? "bg-muted text-muted-foreground"
            : "bg-primary/10 text-primary";
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${toneClass}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold leading-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
