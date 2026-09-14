import type { Receita } from "./mock-data";
import {
  buscarResidentePorNome,
  criarResidenteRascunho,
  type ResidenteSalvo,
} from "./residentes-store";
import {
  calcVencimento,
  chaveReceita,
  chaveBaixaMedicacao,
  medicacoesDaReceita,
  novoIdReceita,
  prazoRetiradaPadrao,
  type ReceitaSalva,
} from "./receitas-store";

const tipos: Receita["tipo"][] = [
  "Branca simples",
  "Controle especial",
  "Azul",
  "Amarela",
  "LME",
  "Alto custo",
  "Receita contínua",
];

const origens: Receita["origem"][] = [
  "Farmácia Popular",
  "GRS/Policlínica",
  "Compra própria",
  "SUS/UBS",
  "Alto custo",
];

export function normalizaTipo(t?: string | null): Receita["tipo"] {
  return tipos.find((x) => x.toLowerCase() === (t ?? "").toLowerCase()) ?? "Branca simples";
}

export function normalizaOrigem(o?: string | null): Receita["origem"] {
  return origens.find((x) => x.toLowerCase() === (o ?? "").toLowerCase()) ?? "SUS/UBS";
}

export type DadosLidos = {
  residenteNome?: string | null;
  medico?: string | null;
  medicacao?: string | null;
  dosagem?: string | null;
  dataEmissao?: string | null;
  tipo?: string | null;
  origem?: string | null;
  duracaoTratamentoDias?: number | null;
};

export type SalvarEntrada = {
  dados: DadosLidos;
  arquivo?: string;
  arquivoUrl?: string;
  validadeDias?: number;
  /** Se já souber o residenteId (ex.: usuário escolheu manual), passa aqui. */
  residenteIdManual?: string;
};

export type SalvarResultado = {
  ok: boolean;
  motivo?: string;
  residenteId?: string;
  residenteCriado?: boolean;
  receitaId?: string;
  arquivouAntiga?: boolean;
};

/**
 * Lógica única de salvar uma receita lida do PDF:
 * 1. Acha (ou cria como rascunho "a revisar") o residente pelo nome.
 * 2. Se já existir uma receita ativa com mesma chave (residente+medicação+médico),
 *    move a antiga pro arquivo.
 * 3. Insere a nova receita ativa.
 */
/** Validade padrão por tipo, quando o PDF não informa a duração do tratamento. */
export function validadePadraoPorTipo(tipo: Receita["tipo"]): number {
  switch (tipo) {
    case "Controle especial":
    case "Azul":
    case "Amarela":
      return 30;
    case "LME":
    case "Alto custo":
      return 90;
    case "Branca simples":
    case "Receita contínua":
    default:
      return 180;
  }
}

export function salvarReceitaLida(
  entrada: SalvarEntrada,
  state: {
    residentes: ResidenteSalvo[];
    setResidentes: (r: ResidenteSalvo[]) => void;
    receitas: ReceitaSalva[];
    setReceitas: (r: ReceitaSalva[]) => void;
    arquivo: ReceitaSalva[];
    setArquivo: (r: ReceitaSalva[]) => void;
  },
): SalvarResultado {
  const d = entrada.dados;
  if (!d.medicacao || !d.dataEmissao) {
    return { ok: false, motivo: "PDF sem medicação ou data de emissão." };
  }

  // 1. Residente
  let residentes = state.residentes;
  let residenteId = entrada.residenteIdManual;
  let residenteCriado = false;
  if (!residenteId) {
    const nome = d.residenteNome?.trim();
    if (!nome) {
      return { ok: false, motivo: "PDF sem nome do residente." };
    }
    const achado = buscarResidentePorNome(nome, residentes);
    if (achado) {
      residenteId = achado.id;
    } else {
      const novo = criarResidenteRascunho(nome, d.medico, residentes);
      residentes = [...residentes, novo];
      state.setResidentes(residentes);
      residenteId = novo.id;
      residenteCriado = true;
    }
  }

  // 2. Monta a nova receita
  const tipo = normalizaTipo(d.tipo);
  const origem = normalizaOrigem(d.origem);
  const duracaoLida =
    typeof d.duracaoTratamentoDias === "number" && d.duracaoTratamentoDias > 0
      ? Math.round(d.duracaoTratamentoDias)
      : undefined;
  const validadeDias =
    entrada.validadeDias ?? duracaoLida ?? validadePadraoPorTipo(tipo);
  const medico = d.medico?.trim() || "—";
  const medicacao = d.medicacao.trim();
  const residenteNome =
    d.residenteNome?.trim() || residentes.find((r) => r.id === residenteId)?.nome || "";

  const chave = chaveReceita({ residenteId, medicacao });

  // 3. Decide quem fica ativa comparando data de emissão.
  //    "Mesma receita" agora é comparada por medicação: qualquer receita
  //    ativa da mesma residente cuja(s) medicação(ões) estejam TODAS
  //    cobertas pela nova receita é considerada substituída e vai pro
  //    arquivo. Assim uma receita nova com "Haldol + Levomepromazina +
  //    Quetiapina" arquiva uma antiga só de Haldol, sem precisar do texto
  //    exato bater.
  const ativasAntigas = state.receitas;
  const medsNovas = new Set(
    medicacoesDaReceita(medicacao).map((m) => chaveBaixaMedicacao(m)),
  );
  const cobreTodas = (r: ReceitaSalva) => {
    if (r.residenteId !== residenteId) return false;
    const meds = medicacoesDaReceita(r.medicacao);
    if (meds.length === 0) return false;
    return meds.every((m) => medsNovas.has(chaveBaixaMedicacao(m)));
  };
  const mesmasChave = ativasAntigas.filter(
    (r) => chaveReceita(r) === chave || cobreTodas(r),
  );
  const ativasMantidas = ativasAntigas.filter(
    (r) => !(chaveReceita(r) === chave || cobreTodas(r)),
  );

  // Timestamp seguro: se a data vier inválida, vira 0 (mais antiga possível).
  const ts = (iso?: string) => {
    if (!iso) return 0;
    const t = new Date(iso).getTime();
    return Number.isFinite(t) ? t : 0;
  };
  const tsNova = ts(d.dataEmissao);

  // Nova é mais antiga (ou empatada) do que alguma já ativa? Então ela é
  // que deve ir pro arquivo, e a atual permanece.
  const novaEhMaisAntiga = mesmasChave.some((r) => ts(r.dataEmissao) > tsNova);

  // Considera TODAS as receitas conhecidas (ativas + arquivo) ao gerar id
  // novo. Antes usávamos só `ativasMantidas`, o que abria brecha para colisão
  // de id quando a antiga era arquivada logo em seguida — e id duplicado em
  // localStorage pode fazer parecer que uma receita "sumiu" (na verdade duas
  // linhas passam a compartilhar a mesma chave).
  const novoIdBase = novoIdReceita([...ativasAntigas, ...state.arquivo]);
  const nova: ReceitaSalva = {
    id: novoIdBase,
    residenteId,
    residenteNome,
    medicacao,
    dosagem: d.dosagem?.trim() ?? "",
    tipo,
    dataEmissao: d.dataEmissao,
    validadeDias,
    vencimento: calcVencimento(d.dataEmissao, validadeDias),
    prazoRetiradaDias: prazoRetiradaPadrao(validadeDias),
    medico,
    origem,
    criadaEm: new Date().toISOString(),
    arquivo: entrada.arquivo,
    arquivoUrl: entrada.arquivoUrl,
  };

  if (novaEhMaisAntiga) {
    // Mantém a(s) ativa(s) existente(s); a nova entra direto no arquivo.
    const maisRecente = mesmasChave.reduce((a, b) =>
      ts(a.dataEmissao) >= ts(b.dataEmissao) ? a : b,
    );
    const novaArquivada: ReceitaSalva = {
      ...nova,
      arquivadaEm: new Date().toISOString(),
      substituidaPor: maisRecente.id,
    };
    state.setReceitas(ativasAntigas);
    state.setArquivo([...state.arquivo, novaArquivada]);
    return {
      ok: true,
      residenteId,
      residenteCriado,
      receitaId: nova.id,
      arquivouAntiga: true,
    };
  }

  // Caso normal: nova é a mais recente. Arquiva as antigas com mesma chave.
  const arquivadas = mesmasChave.map((r) => ({
    ...r,
    arquivadaEm: new Date().toISOString(),
    substituidaPor: nova.id,
  }));

  // Além do match direto, arquiva também qualquer receita antiga da mesma
  // residente cujas medicações estejam TODAS cobertas por receitas ativas
  // mais recentes (a nova + as outras já ativas). Assim, se antes havia uma
  // receita combinada (ex.: "Risperidona + Haldol") e chegam receitas novas
  // individuais para cada princípio ativo, a antiga é arquivada quando o
  // conjunto de novas cobrir tudo — só permanece se sobrar alguma medicação
  // sem substituta mais recente.
  const ativasFinaisCandidatas = [...ativasMantidas, nova];
  const arquivadasExtras: ReceitaSalva[] = [];
  const ativasSobreviventes: ReceitaSalva[] = [];
  for (const r of ativasMantidas) {
    if (r.residenteId !== residenteId) {
      ativasSobreviventes.push(r);
      continue;
    }
    const meds = medicacoesDaReceita(r.medicacao);
    if (meds.length === 0) {
      ativasSobreviventes.push(r);
      continue;
    }
    const tsR = ts(r.dataEmissao);
    const todasCobertas = meds.every((m) => {
      const chaveMed = chaveBaixaMedicacao(m);
      return ativasFinaisCandidatas.some((outra) => {
        if (outra.id === r.id) return false;
        if (outra.residenteId !== r.residenteId) return false;
        if (ts(outra.dataEmissao) <= tsR) return false;
        return medicacoesDaReceita(outra.medicacao).some(
          (mm) => chaveBaixaMedicacao(mm) === chaveMed,
        );
      });
    });
    if (todasCobertas) {
      arquivadasExtras.push({
        ...r,
        arquivadaEm: new Date().toISOString(),
        substituidaPor: nova.id,
      });
    } else {
      ativasSobreviventes.push(r);
    }
  }

  state.setReceitas([...ativasSobreviventes, nova]);
  const todasArquivadas = [...arquivadas, ...arquivadasExtras];
  if (todasArquivadas.length > 0) {
    state.setArquivo([...state.arquivo, ...todasArquivadas]);
  }

  return {
    ok: true,
    residenteId,
    residenteCriado,
    receitaId: nova.id,
    arquivouAntiga: arquivadas.length + arquivadasExtras.length > 0,
  };
}