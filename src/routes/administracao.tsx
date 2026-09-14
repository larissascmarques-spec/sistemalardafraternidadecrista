import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { residentes, receitas } from "@/lib/mock-data";

export const Route = createFileRoute("/administracao")({
  component: Page,
});

function Page() {
  const exemplos = residentes.slice(0, 6).map((r, i) => {
    const med = receitas.find((rx) => rx.residenteId === r.id);
    return {
      hora: ["08:00", "08:00", "08:00", "12:00", "12:00", "20:00"][i],
      residente: r.nome,
      medicacao: med?.medicacao ?? "—",
      dose: med?.dosagem ?? "—",
      administrado: i < 3,
    };
  });

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Administração de Medicações (MAR)"
        description="Registro do que foi dado, por quem e quando — rastreabilidade total."
      />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Horário</TableHead>
                <TableHead>Residente</TableHead>
                <TableHead>Medicação</TableHead>
                <TableHead>Dose</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Responsável</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exemplos.map((e, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{e.hora}</TableCell>
                  <TableCell>{e.residente}</TableCell>
                  <TableCell>{e.medicacao}</TableCell>
                  <TableCell>{e.dose}</TableCell>
                  <TableCell>
                    {e.administrado ? (
                      <Badge className="bg-[color:var(--success)]/15 text-[color:var(--success)]">Administrado</Badge>
                    ) : (
                      <Badge variant="outline">Pendente</Badge>
                    )}
                  </TableCell>
                  <TableCell>{e.administrado ? "Enfermeira" : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}