/** Formata o nome de uma medicação para exibição compacta.
 *  Ex.: "RISPERIDONA 3 MG COMPRIMIDO" -> "Risperidona 3mg".
 *  Remove formas farmacêuticas e normaliza unidades. */
export function formatMedNome(raw: string): string {
  if (!raw) return "";
  let t = raw
    .toLowerCase()
    .replace(
      /\b(comprimido|comprimidos|revestido|revestidos|cp|cpr|cps|capsula|capsulas|drágea|dragea|drageas|solucao|solução|gotas|xarope|ampola|ampolas|frasco|frascos|sache|sachê|suspensao|suspensão|injetavel|injetável|oral|sublingual|liberacao|liberação|prolongada|generico|genérico)\b/g,
      " ",
    )
    .replace(/(\d+(?:[.,]\d+)?)\s*(mg|mcg|g|ml|ui)\b/gi, "$1$2")
    .replace(/\s*,\s*/g, ", ")
    .replace(/\s+/g, " ")
    .trim();
  return t
    .split(" ")
    .map((w) => (/\d/.test(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

/** Formata uma lista de medicações (separadas por ; , quebra de linha ou "+")
 *  aplicando formatMedNome em cada item e devolvendo separado por ", ". */
export function formatMedLista(raw: string): string {
  if (!raw) return "";
  return raw
    .split(/\s*(?:;|\n|\r|\s\+\s|,(?=\s*[A-Za-zÀ-ÿ]))\s*/)
    .map((p) => formatMedNome(p))
    .filter(Boolean)
    .join(", ");
}