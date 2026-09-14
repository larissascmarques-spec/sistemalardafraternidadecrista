export type Residente = {
  id: string;
  nome: string;
  dataNascimento: string;
  /** Data (ISO YYYY-MM-DD) em que a residente foi institucionalizada / entrou na casa. */
  dataInstitucionalizacao?: string;
  /** CPF (apenas dígitos ou formatado). */
  cpf?: string;
  /** Número do cartão SANITAS / cartão SUS. */
  sanitas?: string;
  diagnosticos: string[];
  alergias: string[];
  responsavel: string;
  medico: string;
  ubs: string;
  observacoes?: string;
  /** Medicações em uso registradas manualmente (além das derivadas das receitas). */
  medicacoesUso?: string[];
  /** Horários e doses preenchidos na Ficha da Residente. */
  esquemaMedicacoes?: Array<{
    nome: string;
    manha: string;
    tarde: string;
    noite: string;
  }>;
  /** independente | parcial | total */
  dependencia?: "independente" | "parcial" | "total";
  /** deambula | cadeirante | acamada */
  mobilidade?: "deambula" | "cadeirante" | "acamada";
  /** Ex.: pastosa, hipossódica, diabética, sem lactose. */
  dieta?: string;
  /** Alertas visíveis. Ex.: ["risco de queda", "fuga", "agressividade"]. */
  alertas?: string[];
  /** Controle de Haldol Decanoato injetável (IM de depósito). */
  haldolInjetavel?: {
    /** Intervalo entre doses, em dias. Ex.: 21 ou 30. */
    periodicidadeDias: number;
    /** Data ISO (YYYY-MM-DD) da próxima dose prevista. */
    proximaDose: string;
    /** Histórico de aplicações (datas ISO). */
    historico?: string[];
  };
  /** Acompanhamento psiquiátrico (residentes de saúde mental). */
  acompanhamentoPsiquiatrico?: {
    /** Nome do médico psiquiatra. */
    medico?: string;
    /** Local de atendimento (CAPS, clínica, policlínica, consultório...). */
    local?: string;
    /** Observações gerais sobre o acompanhamento. */
    observacoes?: string;
    /** Data da última consulta com o psiquiatra (ISO YYYY-MM-DD). */
    ultimaConsulta?: string;
    /** Data da próxima consulta agendada com o psiquiatra (ISO YYYY-MM-DD). */
    proximaConsulta?: string;
  };
};

export const residentes: Residente[] = [];

const hoje = new Date();
const diasFromNow = (d: number) => {
  const dt = new Date(hoje);
  dt.setDate(dt.getDate() + d);
  return dt.toISOString().slice(0, 10);
};

export type Receita = {
  id: string;
  residenteId: string;
  medicacao: string;
  dosagem: string;
  tipo: "Branca simples" | "Controle especial" | "Azul" | "Amarela" | "LME" | "Alto custo" | "Receita contínua";
  dataEmissao: string;
  validadeDias: number;
  vencimento: string;
  medico: string;
  origem: "Farmácia Popular" | "GRS/Policlínica" | "Compra própria" | "SUS/UBS" | "Alto custo";
};

export const receitas: Receita[] = [];

export type EstoqueItem = {
  codigo: string;
  medicacao: string;
  apresentacao: string;
  lote: string;
  validade: string;
  quantidade: number;
  estoqueMinimo: number;
  consumoDiario: number;
  origem: string;
  local: string;
  /** Unidade em que a quantidade é contada: "unidade" (comprimido/ampola) ou "ml" (solução em gotas). */
  unidade?: "unidade" | "ml";
  /** Para soluções em gotas: quantas gotas equivalem a 1 ml (padrão 20). */
  gotasPorMl?: number;
  /** continua | nao_continua | queixa_simples */
  tipoUso?: "continua" | "nao_continua" | "queixa_simples";
  /** Data (YYYY-MM-DD) em que o lote foi lançado no estoque. */
  lancadoEm?: string;
  /** Data (YYYY-MM-DD) até a qual o sistema já descontou o consumo diário. */
  ultimaBaixa?: string;
  /** Lista de pacientes que usam essa medicação e a quantidade por dia. */
  pacientesUso?: Array<{
    residenteId: string;
    qtdDia: number;
    /** Uso "se necessário" (SOS): não conta no consumo diário do lote. */
    seNecessario?: boolean;
    /** Para Haldol Decanoato: ampolas por dose. */
    ampolas?: number;
    /** Para Haldol Decanoato: intervalo entre doses em dias (21 ou 30). */
    intervaloDias?: number;
    /** Para Haldol Decanoato: data (ISO) da próxima aplicação prevista. */
    proximaAplicacao?: string;
  }>;
  /** Próxima data prevista de compra/retirada (ISO YYYY-MM-DD). */
  proximaCompra?: string;
  /** Data (YYYY-MM-DD) da última vez que a medicação foi retirada/comprada. */
  ultimaRetirada?: string;
  /** Data (YYYY-MM-DD) prevista para a próxima retirada — usada para alerta no painel. */
  proximaRetirada?: string;
  observacao?: string;
};

export const TIPOS_USO_MED = [
  { value: "continua", label: "Contínua" },
  { value: "nao_continua", label: "Não-contínua" },
  { value: "queixa_simples", label: "Queixa simples" },
] as const;

export function rotuloTipoUso(t?: string): string {
  return TIPOS_USO_MED.find((x) => x.value === t)?.label ?? "Contínua";
}

/** Origens possíveis para compra/retirada de medicação. */
export const ORIGENS_ESTOQUE = [
  "Farmácia (compra)",
  "Farmácia Popular",
  "Policlínica",
  "UBS",
  "Alto custo",
  "Doação",
] as const;

export const estoque: EstoqueItem[] = [];

export function diasAte(dataIso: string): number {
  const alvo = new Date(dataIso);
  const diff = Math.ceil((alvo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

export function diasRestantesEstoque(item: EstoqueItem): number {
  if (item.consumoDiario <= 0) return 999;
  // Se o lote ainda nem foi lançado (data futura), considera quantidade integral.
  let qtd = item.quantidade;
  if (item.lancadoEm) {
    const inicio = new Date(item.lancadoEm);
    const diasDesdeLancamento = Math.floor(
      (hoje.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diasDesdeLancamento > 0) {
      qtd = Math.max(0, item.quantidade - diasDesdeLancamento * item.consumoDiario);
    }
  }
  return Math.floor(qtd / item.consumoDiario);
}

export function nomeResidente(id: string): string {
  return residentes.find((r) => r.id === id)?.nome ?? id;
}