import { createFileRoute } from "@tanstack/react-router";
import { PrimeirosSocorrosSlides } from "@/components/PrimeirosSocorrosSlides";

export const Route = createFileRoute("/primeiros-socorros")({
  component: PrimeirosSocorrosPage,
});

function PrimeirosSocorrosPage() {
  return <PrimeirosSocorrosSlides />;
}
