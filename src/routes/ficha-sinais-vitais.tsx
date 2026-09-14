import { createFileRoute } from "@tanstack/react-router";
import { FichaSinaisVitaisDialog } from "@/components/FichaSinaisVitaisDialog";

export const Route = createFileRoute("/ficha-sinais-vitais")({
  component: Page,
  head: () => ({
    meta: [
      { title: "Ficha de Coleta de Sinais Vitais — Lar da Fraternidade Cristã" },
      { name: "description", content: "Ficha de coleta de sinais vitais para impressão." },
    ],
  }),
});

function Page() {
  return <FichaSinaisVitaisDialog standalone />;
}
