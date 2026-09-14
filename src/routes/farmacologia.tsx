import { useReceitas } from "@/lib/receitas-cloud";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocalStorage } from "@/hooks/use-local-storage";
import {
  RECEITAS_STORAGE_KEY,
  type ReceitaSalva,
} from "@/lib/receitas-store";
import { useAllResidentes } from "@/lib/residentes-store";
import { diasAte } from "@/lib/mock-data";
import { buscarFicha, chaveFarmaco } from "@/lib/farmacologia-db";
import { formatMedNome } from "@/lib/format-med";
import { AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/farmacologia")({
  component: Page,
});

function Page() {
  const [salvas] = useReceitas(RECEITAS_STORAGE_KEY, []);
  const { nomePor } = useAllResidentes();

  // Agrupa receitas ATIVAS por medicação (chave normalizada)
  const ativas = salvas.filter((r) => diasAte(r.vencimento) >= 0);
  const grupos = new Map<string, { nomeExibido: string; pacientes: { nome: string; dosagem: string }[] }>();
  for (const r of ativas) {
    const k = chaveFarmaco(r.medicacao);
    if (!k) continue;
    const g = grupos.get(k) ?? { nomeExibido: r.medicacao, pacientes: [] };
    g.pacientes.push({ nome: nomePor(r.residenteId), dosagem: r.dosagem });
    grupos.set(k, g);
  }

  const itens = Array.from(grupos.entries())
    .map(([k, g]) => ({ chave: k, ...g, ficha: buscarFicha(g.nomeExibido) }))
    .sort((a, b) => a.nomeExibido.localeCompare(b.nomeExibido));

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Farmacologia das Medicações em Uso"
        description="Fichas das medicações ativas das residentes — intercorrências e condutas de enfermagem."
      />

      {itens.length === 0 && (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Nenhuma receita ativa encontrada. Cadastre receitas em "Receitas" para
            que as fichas das medicações em uso apareçam aqui.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {itens.map((it) => (
          <Card key={it.chave}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span>{formatMedNome(it.nomeExibido)}</span>
                {it.ficha && <Badge variant="outline">{it.ficha.classe}</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">
                  Em uso por {it.pacientes.length}{" "}
                  {it.pacientes.length === 1 ? "residente" : "residentes"}:
                </p>
                <ul className="space-y-0.5 pl-3 list-disc">
                  {it.pacientes.map((p, i) => (
                    <li key={i}>
                      {p.nome}
                      {p.dosagem ? ` — ${p.dosagem}` : ""}
                    </li>
                  ))}
                </ul>
              </div>

              {it.ficha ? (
                <>
                  <p><span className="text-muted-foreground">Indicação: </span>{it.ficha.indicacao}</p>
                  <p>
                    <span className="text-muted-foreground">Efeitos comuns: </span>
                    {it.ficha.efeitosComuns.map((e) => (
                      <Badge key={e} variant="secondary" className="mr-1">{e}</Badge>
                    ))}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Efeitos graves: </span>
                    {it.ficha.efeitosGraves.map((e) => (
                      <Badge key={e} variant="destructive" className="mr-1">{e}</Badge>
                    ))}
                  </p>
                  <p><span className="text-muted-foreground">Cuidados de enfermagem: </span>{it.ficha.cuidados}</p>
                  {it.ficha.interacoes && (
                    <p><span className="text-muted-foreground">Interações: </span>{it.ficha.interacoes}</p>
                  )}
                  <div className="rounded-md border bg-muted/40 p-3 space-y-2">
                    <div className="flex items-center gap-1 text-xs font-semibold uppercase text-muted-foreground">
                      <AlertTriangle className="h-3.5 w-3.5" /> Intercorrências e condutas
                    </div>
                    <ul className="space-y-1.5">
                      {it.ficha.intercorrencias.map((ic, i) => (
                        <li key={i} className="text-xs">
                          <span className="font-medium">{ic.sinal}</span>
                          <span className="text-muted-foreground"> → {ic.conduta}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  Ficha farmacológica ainda não cadastrada para esta medicação. Posso
                  adicioná-la se você me passar o nome correto.
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}