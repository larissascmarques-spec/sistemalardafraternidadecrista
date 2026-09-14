import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { residentes, receitas } from "@/lib/mock-data";
import { formatNome } from "@/lib/format-nome";
import { Sun, Sunset, Moon } from "lucide-react";

export const Route = createFileRoute("/dispensacao")({
  component: Page,
});

const turnos = [
  { nome: "Manhã (08h)", icon: Sun },
  { nome: "Tarde (14h)", icon: Sunset },
  { nome: "Noite (20h)", icon: Moon },
];

function Page() {
  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Dispensação Fracionada"
        description="Separação por residente e turno — cada envelope identificado com nome, dose, horário."
      />
      <div className="grid gap-4 md:grid-cols-3">
        {turnos.map(({ nome, icon: Icon }) => (
          <Card key={nome}>
            <CardHeader className="flex flex-row items-center gap-2">
              <Icon className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">{nome}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {residentes.slice(0, 5).map((r) => {
                const meds = receitas.filter((rx) => rx.residenteId === r.id);
                return (
                  <div key={r.id} className="rounded-md border p-2 text-sm">
                    <p className="font-medium">{formatNome(r.nome)}</p>
                    <p className="text-xs text-muted-foreground">
                      {meds[0]?.medicacao ?? "Sem medicação"}
                    </p>
                  </div>
                );
              })}
              <Badge variant="outline" className="w-full justify-center">+5 residentes</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Regra de ouro:</p>
          <p>Nunca deixar cartelas soltas, comprimidos sem identificação ou potes compartilhados. Cada envelope só sai do armário trancado já identificado com <strong>nome, medicação, dose e horário</strong>.</p>
        </CardContent>
      </Card>
    </div>
  );
}