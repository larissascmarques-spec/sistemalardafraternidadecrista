import type { Procedimento } from "./procedimentos-store";

export type Indicador = {
  chave: string;
  nome: string;
  valor: string;
  detalhe: string;
  formula: string;
  fonte: string;
  bloco: "estrutura" | "producao" | "resolutividade" | "seguranca" | "cuidado";
};

const pct = (n: number, d: number) => (d > 0 ? `${((n / d) * 100).toFixed(1)}%` : "—");

function contar(itens: Procedimento[], cat: string) {
  return itens.filter((i) => i.categoria === cat).length;
}

/**
 * Calcula os indicadores do mês a partir dos registros lançados.
 * `numResidentes` é o número de residentes ativas (denominador de vários indicadores).
 */
export function calcularIndicadores(
  itens: Procedimento[],
  numResidentes: number,
  diasNoMes: number,
  dependencias: Array<string | undefined> = [],
): Indicador[] {
  const total = itens.length;
  const consultasEnf = contar(itens, "Consulta de enfermagem");
  const consultasUBS = contar(itens, "Consulta médica na UBS");
  const especialista = contar(itens, "Consulta com especialista");
  const curativos = contar(itens, "Curativo / tratamento de ferida");
  const injetaveis = contar(itens, "Administração de injetável");
  const coletas = contar(itens, "Coleta de material (urina/sangue)");
  const sinais = contar(itens, "Aferição de sinais vitais");
  const evacuacoes = contar(itens, "Registro de evacuação");
  const exames = contar(itens, "Exame realizado");
  const vacinas = contar(itens, "Vacinação");
  const intercorrencias = contar(itens, "Intercorrência / urgência");
  const quedas = contar(itens, "Queda");
  const lpp = contar(itens, "Lesão por pressão");
  const errosMed = contar(itens, "Erro / quase-erro de medicação");
  const infeccoes = contar(itens, "Infecção (urinária / respiratória / ferida)");
  const obitos = contar(itens, "Óbito");
  const internacoes = contar(itens, "Internação hospitalar");
  const educacao = contar(itens, "Educação em saúde / orientação");

  const encaminhados = itens.filter((i) => i.desfecho === "encaminhado").length;
  const resolvidos = itens.filter((i) => i.desfecho === "resolvido_local").length;
  const atendimentosClinicos = resolvidos + encaminhados;
  const pacientesDia = numResidentes * diasNoMes;
  const porMil = (n: number) =>
    pacientesDia > 0 ? `${((n / pacientesDia) * 1000).toFixed(2)} /1.000 res.-dia` : "—";

  const grau = (v: string) => dependencias.filter((d) => d === v).length;
  const grauI = grau("independente");
  const grauII = grau("parcial");
  const grauIII = grau("total");
  const semGrau = numResidentes - (grauI + grauII + grauIII);

  const residentesCom = (cat: string) =>
    new Set(itens.filter((i) => i.categoria === cat && i.residenteId).map((i) => i.residenteId))
      .size;
  const comPai = residentesCom("Plano de Atenção Individual (PAI) atualizado");
  const comBraden = residentesCom("Avaliação de risco de lesão por pressão (Braden)");

  return [
    // ---- Estrutura e funcionamento ----
    {
      chave: "grau_dependencia",
      nome: "Residentes por grau de dependência",
      valor: `${grauI} / ${grauII} / ${grauIII}`,
      detalhe:
        `Grau I (independente) ${grauI} · Grau II (parcial) ${grauII} · Grau III (total) ${grauIII}` +
        (semGrau > 0 ? ` · ${semGrau} sem grau informado` : ""),
      formula: "(Nº de residentes em cada grau ÷ total de residentes) × 100",
      fonte: "RDC ANVISA 502/2021 — classificação por grau de dependência",
      bloco: "estrutura",
    },
    {
      chave: "pai",
      nome: "Plano de Atenção Individual (PAI) atualizado",
      valor: pct(comPai, Math.max(1, numResidentes)),
      detalhe: `${comPai} de ${numResidentes} residentes com PAI revisado no mês`,
      formula: "(Residentes com PAI atualizado ÷ total de residentes) × 100",
      fonte: "RDC ANVISA 502/2021 — Plano de Atenção Individual",
      bloco: "estrutura",
    },
    {
      chave: "braden",
      nome: "Avaliação de risco de lesão por pressão (Braden)",
      valor: pct(comBraden, Math.max(1, numResidentes)),
      detalhe: `${comBraden} residente(s) com escala de Braden aplicada`,
      formula: "(Residentes com escala de Braden aplicada ÷ total de residentes) × 100",
      fonte: "Nota Técnica GVIMS/GGTES ANVISA nº 03/2017 — prevenção de LPP",
      bloco: "estrutura",
    },

    // ---- Produção assistencial ----
    {
      chave: "total",
      nome: "Total de atendimentos/procedimentos",
      valor: String(total),
      detalhe: "Todos os registros lançados no mês",
      formula: "Soma de todos os procedimentos registrados na competência",
      fonte: "Produção assistencial — e-SUS APS / SIA-SUS (SIGTAP)",
      bloco: "producao",
    },
    {
      chave: "consultas_enf",
      nome: "Consultas de enfermagem realizadas",
      valor: String(consultasEnf),
      detalhe: `${(consultasEnf / Math.max(1, numResidentes)).toFixed(1)} por residente`,
      formula: "Nº de consultas de enfermagem no mês ÷ nº de residentes",
      fonte: "Resolução COFEN 736/2024 (Processo de Enfermagem/SAE) e Lei 7.498/86",
      bloco: "producao",
    },
    {
      chave: "curativos",
      nome: "Curativos / tratamento de feridas",
      valor: String(curativos),
      detalhe: "Procedimentos de enfermagem executados no Lar",
      formula: "Nº de curativos realizados no mês",
      fonte: "SIGTAP 03.01.10.011-6 — curativo grau I/II",
      bloco: "producao",
    },
    {
      chave: "injetaveis",
      nome: "Administração de medicamento injetável",
      valor: String(injetaveis),
      detalhe: "IM, EV ou SC aplicados por profissional do Lar",
      formula: "Nº de aplicações de injetável no mês",
      fonte: "SIGTAP 03.01.10.014-0 — administração de medicamentos",
      bloco: "producao",
    },
    {
      chave: "coletas",
      nome: "Coletas de material para exame",
      valor: String(coletas),
      detalhe: "Urina, sangue e outros materiais",
      formula: "Nº de coletas realizadas no mês",
      fonte: "SIGTAP 03.01.10.007-8 — coleta de material",
      bloco: "producao",
    },
    {
      chave: "sinais",
      nome: "Aferições de sinais vitais",
      valor: String(sinais),
      detalhe: "Registros de PA, FC, FR, temperatura e saturação",
      formula: "Nº de aferições registradas no mês",
      fonte: "RDC ANVISA 502/2021 — registro de intercorrências e cuidados",
      bloco: "producao",
    },
    {
      chave: "evacuacoes",
      nome: "Controle de eliminações (evacuação)",
      valor: String(evacuacoes),
      detalhe: "Registros de eliminação intestinal",
      formula: "Nº de registros de evacuação no mês",
      fonte: "Boa prática de enfermagem geriátrica (escala de Bristol)",
      bloco: "producao",
    },
    {
      chave: "exames_vacinas",
      nome: "Exames realizados e vacinas aplicadas",
      valor: `${exames} / ${vacinas}`,
      detalhe: "Exames concluídos e doses de vacina",
      formula: "Nº de exames + nº de doses aplicadas no mês",
      fonte: "PNI e PNAB — Portaria GM/MS 2.436/2017",
      bloco: "producao",
    },
    {
      chave: "educacao",
      nome: "Ações de educação em saúde",
      valor: String(educacao),
      detalhe: "Orientações a residentes e equipe",
      formula: "Nº de ações educativas no mês",
      fonte: "PNAB — Portaria GM/MS 2.436/2017",
      bloco: "producao",
    },

    // ---- Resolutividade ----
    {
      chave: "resolutividade",
      nome: "Taxa de resolutividade no Lar",
      valor: pct(resolvidos, atendimentosClinicos),
      detalhe: `${resolvidos} resolvidos de ${atendimentosClinicos} atendimentos`,
      formula: "(Atendimentos resolvidos no Lar ÷ total de atendimentos) × 100",
      fonte: "PNAB — resolutividade da atenção; base para custo evitado ao SUS",
      bloco: "resolutividade",
    },
    {
      chave: "encaminhamento",
      nome: "Taxa de encaminhamento",
      valor: pct(encaminhados, atendimentosClinicos),
      detalhe: `${encaminhados} encaminhamentos para a rede`,
      formula: "(Atendimentos encaminhados ÷ total de atendimentos) × 100",
      fonte: "PNAB — coordenação do cuidado / referência e contrarreferência",
      bloco: "resolutividade",
    },
    {
      chave: "ubs",
      nome: "Consultas na UBS / especialista",
      valor: `${consultasUBS} / ${especialista}`,
      detalhe: "Uso da rede pública pelo Lar",
      formula: "Nº de consultas na UBS + nº de consultas com especialista",
      fonte: "PNAB — vínculo com a Atenção Primária de referência",
      bloco: "resolutividade",
    },
    {
      chave: "internacoes",
      nome: "Taxa de internação hospitalar",
      valor: pct(internacoes, Math.max(1, numResidentes)),
      detalhe: `${internacoes} internação(ões) no mês`,
      formula: "(Nº de internações ÷ nº de residentes) × 100",
      fonte: "Indicador de condições sensíveis à atenção primária (Portaria 221/2008)",
      bloco: "resolutividade",
    },
    {
      chave: "intercorrencias",
      nome: "Intercorrências / urgências atendidas",
      valor: String(intercorrencias),
      detalhe: "Situações agudas manejadas pela equipe",
      formula: "Nº de intercorrências registradas no mês",
      fonte: "RDC ANVISA 502/2021, art. sobre registro de intercorrências",
      bloco: "resolutividade",
    },

    // ---- Segurança do paciente ----
    {
      chave: "quedas",
      nome: "Incidência de quedas",
      valor: porMil(quedas),
      detalhe: `${quedas} queda(s) em ${pacientesDia} residentes-dia`,
      formula: "(Nº de quedas ÷ nº de residentes-dia) × 1.000",
      fonte: "PNSP — Protocolo de Prevenção de Quedas (Portaria GM/MS 529/2013) e RDC ANVISA 36/2013",
      bloco: "seguranca",
    },
    {
      chave: "lpp",
      nome: "Incidência de lesão por pressão",
      valor: porMil(lpp),
      detalhe: `${lpp} lesão(ões) notificada(s)`,
      formula: "(Nº de novas lesões por pressão ÷ nº de residentes-dia) × 1.000",
      fonte: "Nota Técnica GVIMS/GGTES ANVISA nº 03/2017 e protocolo de LPP do PNSP",
      bloco: "seguranca",
    },
    {
      chave: "erros_med",
      nome: "Erros e quase-erros de medicação",
      valor: String(errosMed),
      detalhe: "Notificações no mês (quanto mais notificação, mais segurança)",
      formula: "Nº de incidentes de medicação notificados no mês",
      fonte: "PNSP — protocolo de segurança na prescrição, uso e administração",
      bloco: "seguranca",
    },
    {
      chave: "iras",
      nome: "Infecções relacionadas à assistência",
      valor: porMil(infeccoes),
      detalhe: `${infeccoes} caso(s) — urinária, respiratória ou de ferida`,
      formula: "(Nº de casos novos de infecção ÷ nº de residentes-dia) × 1.000",
      fonte: "RDC ANVISA 36/2013 — Núcleo de Segurança do Paciente",
      bloco: "seguranca",
    },
    {
      chave: "obitos",
      nome: "Taxa de mortalidade",
      valor: pct(obitos, Math.max(1, numResidentes)),
      detalhe: `${obitos} óbito(s) no mês`,
      formula: "(Nº de óbitos ÷ nº médio de residentes) × 100",
      fonte: "Indicador de resultado usual em termos de convênio municipal para ILPI",
      bloco: "seguranca",
    },

    // ---- Cobertura do cuidado ----
    {
      chave: "cobertura_enf",
      nome: "Cobertura de consulta de enfermagem",
      valor: pct(
        new Set(
          itens
            .filter((i) => i.categoria === "Consulta de enfermagem" && i.residenteId)
            .map((i) => i.residenteId),
        ).size,
        Math.max(1, numResidentes),
      ),
      detalhe: "Residentes com pelo menos 1 consulta de enfermagem no mês",
      formula: "(Residentes com consulta de enfermagem ÷ total de residentes) × 100",
      fonte: "Resolução COFEN 736/2024 — Processo de Enfermagem (SAE)",
      bloco: "cuidado",
    },
    {
      chave: "cobertura_vacinal",
      nome: "Cobertura vacinal",
      valor: pct(
        new Set(
          itens.filter((i) => i.categoria === "Vacinação" && i.residenteId).map((i) => i.residenteId),
        ).size,
        Math.max(1, numResidentes),
      ),
      detalhe: `${vacinas} dose(s) aplicada(s) no mês`,
      formula: "(Residentes vacinados ÷ total de residentes elegíveis) × 100",
      fonte: "PNI — Programa Nacional de Imunizações / e-SUS APS",
      bloco: "cuidado",
    },
    {
      chave: "residentes_dia",
      nome: "Residentes-dia no mês",
      valor: String(pacientesDia),
      detalhe: `${numResidentes} residentes × ${diasNoMes} dias`,
      formula: "Nº de residentes × nº de dias do mês",
      fonte: "Denominador padrão de indicadores assistenciais",
      bloco: "cuidado",
    },
  ];
}

export const BLOCOS: Array<{ id: Indicador["bloco"]; titulo: string; descricao: string }> = [
  {
    id: "estrutura",
    titulo: "Estrutura e funcionamento",
    descricao: "Perfil das residentes e planos de cuidado exigidos pela RDC 502/2021.",
  },
  {
    id: "producao",
    titulo: "Produção assistencial",
    descricao: "O que a equipe do Lar executou no mês — base para justificar o repasse.",
  },
  {
    id: "resolutividade",
    titulo: "Resolutividade e uso da rede",
    descricao: "Quanto foi resolvido aqui e quanto precisou da rede pública.",
  },
  {
    id: "seguranca",
    titulo: "Segurança do paciente",
    descricao: "Indicadores exigidos pelo Programa Nacional de Segurança do Paciente.",
  },
  {
    id: "cuidado",
    titulo: "Cobertura do cuidado",
    descricao: "Alcance do cuidado sobre o total de residentes.",
  },
];