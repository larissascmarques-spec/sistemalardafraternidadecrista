import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { residentes } from "@/lib/mock-data";
import { formatNome } from "@/lib/format-nome";

export const Route = createFileRoute("/sinais-vitais")({
  component: Page,
});

function Page() {
  const hoje = new Date().toLocaleDateString("pt-BR");
  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Sinais Vitais" description={`Aferições do dia — ${hoje}`} />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Residente</TableHead>
                <TableHead>PA</TableHead>
                <TableHead>FC</TableHead>
                <TableHead>FR</TableHead>
                <TableHead>Tax</TableHead>
                <TableHead>SatO₂</TableHead>
                <TableHead>Glicemia</TableHead>
                <TableHead>Peso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {residentes.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{formatNome(r.nome)}</TableCell>
                  <TableCell className="text-muted-foreground">—</TableCell>
                  <TableCell className="text-muted-foreground">—</TableCell>
                  <TableCell className="text-muted-foreground">—</TableCell>
                  <TableCell className="text-muted-foreground">—</TableCell>
                  <TableCell className="text-muted-foreground">—</TableCell>
                  <TableCell className="text-muted-foreground">—</TableCell>
                  <TableCell className="text-muted-foreground">—</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}