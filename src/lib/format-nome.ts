// Formata nome próprio em Title Case (mantém preposições em minúsculas).
// Ex.: "VITORIA CAROLINE OLIVEIRA SILVA" -> "Vitoria Caroline Oliveira Silva"
const MINUSC = new Set(["da", "de", "do", "das", "dos", "e"]);

export function formatNome(nome: string | null | undefined): string {
  if (!nome) return "";
  return nome
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((p, i) => {
      if (i > 0 && MINUSC.has(p)) return p;
      return p.charAt(0).toUpperCase() + p.slice(1);
    })
    .join(" ");
}