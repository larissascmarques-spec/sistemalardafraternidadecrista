export type FichaFarmaco = {
  classe: string;
  indicacao: string;
  efeitosComuns: string[];
  efeitosGraves: string[];
  cuidados: string;
  intercorrencias: { sinal: string; conduta: string }[];
  interacoes?: string;
};

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.,;:/()\-+]/g, " ")
    .replace(/\b(comprimido|comprimidos|revestido|revestidos|cp|cpr|cps|capsula|capsulas|drágea|dragea|drageas|solucao|solução|gotas|xarope|ampola|ampolas|frasco|frascos|sache|sachê|suspensao|suspensão|injetavel|injetável|oral|sublingual|liberacao|liberação|prolongada|generico|genérico)\b/g, " ")
    .replace(/\d+\s*(mg|mcg|g|ml|ui)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Banco de fichas. Chave = primeiro princípio ativo normalizado. */
const DB: Record<string, FichaFarmaco> = {
  risperidona: {
    classe: "Antipsicótico atípico",
    indicacao: "Esquizofrenia, agressividade, sintomas psicóticos.",
    efeitosComuns: ["Sonolência", "Ganho de peso", "Hipotensão postural"],
    efeitosGraves: ["Síndrome neuroléptica maligna", "Distonia aguda", "Discinesia tardia"],
    cuidados: "Monitorar PA (deitada e em pé), peso, glicemia. Atenção a rigidez muscular, hipersalivação e tremor.",
    intercorrencias: [
      { sinal: "Febre alta + rigidez muscular + sudorese", conduta: "Suspender, comunicar médico imediatamente, hidratar, encaminhar para emergência (suspeita de SNM)." },
      { sinal: "Movimentos involuntários da face/língua", conduta: "Registrar, comunicar médico (possível discinesia) e não administrar próxima dose sem avaliação." },
      { sinal: "Tontura ao levantar", conduta: "Orientar levantar devagar, medir PA deitada e em pé, comunicar se PAS cair >20mmHg." },
    ],
    interacoes: "Benzodiazepínicos e outros depressores do SNC (potencializa sedação).",
  },
  clozapina: {
    classe: "Antipsicótico atípico",
    indicacao: "Esquizofrenia refratária.",
    efeitosComuns: ["Sialorreia", "Sonolência", "Constipação"],
    efeitosGraves: ["Agranulocitose", "Miocardite", "Íleo paralítico"],
    cuidados: "Hemograma periódico obrigatório. Vigiar febre, dor de garganta, dor torácica e parada de evacuação.",
    intercorrencias: [
      { sinal: "Febre, dor de garganta, infecção", conduta: "Suspender dose, comunicar médico IMEDIATAMENTE e solicitar hemograma de urgência." },
      { sinal: "Dor torácica, dispneia, taquicardia", conduta: "Suspender, ECG, encaminhar para emergência (suspeita de miocardite)." },
      { sinal: "Sem evacuar há >3 dias, distensão abdominal", conduta: "Comunicar médico, oferecer hidratação e laxante prescrito; não administrar próxima dose se suspeita de íleo." },
    ],
    interacoes: "Outros depressores do SNC; evitar associação com carbamazepina.",
  },
  litio: {
    classe: "Estabilizador de humor",
    indicacao: "Transtorno bipolar.",
    efeitosComuns: ["Tremor fino", "Sede", "Poliúria"],
    efeitosGraves: ["Intoxicação por lítio", "Hipotireoidismo", "Nefropatia"],
    cuidados: "Manter hidratação. Cuidado com vômito, diarreia, febre, calor intenso e dieta hipossódica — elevam a litemia.",
    intercorrencias: [
      { sinal: "Tremor grosseiro, ataxia, confusão, vômitos", conduta: "Suspender dose, comunicar médico, hidratar e encaminhar para coleta de litemia urgente." },
      { sinal: "Diarreia/vômito/febre prolongados", conduta: "Reforçar hidratação oral, comunicar médico — risco de intoxicação." },
    ],
    interacoes: "AINEs, diuréticos tiazídicos e IECA elevam a litemia.",
  },
  carbamazepina: {
    classe: "Anticonvulsivante",
    indicacao: "Epilepsia, estabilização de humor, neuralgia.",
    efeitosComuns: ["Tontura", "Sonolência", "Visão turva"],
    efeitosGraves: ["Stevens-Johnson", "Discrasia sanguínea", "Hiponatremia"],
    cuidados: "Observar lesões de pele, febre, sangramentos espontâneos e sinais de confusão por hiponatremia.",
    intercorrencias: [
      { sinal: "Rash cutâneo, bolhas, lesões em mucosas", conduta: "Suspender IMEDIATAMENTE e encaminhar à emergência (suspeita de Stevens-Johnson)." },
      { sinal: "Sangramento gengival, equimoses, febre", conduta: "Comunicar médico e solicitar hemograma." },
    ],
    interacoes: "Reduz eficácia de anticoncepcionais e de muitos psicofármacos.",
  },
  haloperidol: {
    classe: "Antipsicótico típico",
    indicacao: "Psicose, agitação, delirium.",
    efeitosComuns: ["Sedação", "Rigidez", "Tremor"],
    efeitosGraves: ["Síndrome neuroléptica maligna", "Distonia aguda", "Prolongamento de QT"],
    cuidados: "Observar sinais extrapiramidais. Em uso EV, monitorar ECG.",
    intercorrencias: [
      { sinal: "Contratura cervical/ocular súbita (distonia)", conduta: "Comunicar médico, biperideno conforme prescrição." },
      { sinal: "Febre + rigidez + alteração da consciência", conduta: "Suspender e encaminhar à emergência (SNM)." },
    ],
  },
  quetiapina: {
    classe: "Antipsicótico atípico",
    indicacao: "Esquizofrenia, transtorno bipolar, agitação no idoso.",
    efeitosComuns: ["Sonolência", "Hipotensão postural", "Ganho de peso"],
    efeitosGraves: ["Síndrome metabólica", "Prolongamento de QT", "SNM"],
    cuidados: "Monitorar PA postural, glicemia e peso. Administrar à noite quando possível.",
    intercorrencias: [
      { sinal: "Queda ao levantar", conduta: "Avaliar PA deitada/em pé, orientar mudança lenta de decúbito, comunicar médico." },
    ],
  },
  olanzapina: {
    classe: "Antipsicótico atípico",
    indicacao: "Esquizofrenia, transtorno bipolar.",
    efeitosComuns: ["Sonolência", "Aumento de apetite", "Ganho de peso"],
    efeitosGraves: ["Hiperglicemia/diabetes", "SNM"],
    cuidados: "Monitorar glicemia, perfil lipídico e peso periodicamente.",
    intercorrencias: [
      { sinal: "Sede excessiva, poliúria, perda de peso súbita", conduta: "Solicitar glicemia capilar e comunicar médico." },
    ],
  },
  clonazepam: {
    classe: "Benzodiazepínico",
    indicacao: "Ansiedade, convulsões.",
    efeitosComuns: ["Sonolência", "Ataxia", "Tontura"],
    efeitosGraves: ["Depressão respiratória", "Quedas", "Dependência"],
    cuidados: "Risco alto de queda no idoso. Não suspender abruptamente.",
    intercorrencias: [
      { sinal: "Sonolência excessiva, bradipneia (FR<12)", conduta: "Não administrar próxima dose, monitorar saturação, comunicar médico." },
      { sinal: "Queda", conduta: "Avaliar lesões, registrar, comunicar médico e revisar prescrição." },
    ],
  },
  diazepam: {
    classe: "Benzodiazepínico",
    indicacao: "Ansiedade, espasmo, convulsão.",
    efeitosComuns: ["Sonolência", "Fraqueza muscular"],
    efeitosGraves: ["Depressão respiratória", "Quedas"],
    cuidados: "Evitar associação com opioides. Cuidado redobrado com idosos.",
    intercorrencias: [
      { sinal: "Rebaixamento de consciência", conduta: "Suspender, monitorar via aérea e SatO2, comunicar médico." },
    ],
  },
  sertralina: {
    classe: "Antidepressivo ISRS",
    indicacao: "Depressão, ansiedade, TOC.",
    efeitosComuns: ["Náusea", "Insônia", "Cefaleia"],
    efeitosGraves: ["Síndrome serotoninérgica", "Hiponatremia (idoso)", "Sangramento"],
    cuidados: "Atenção em uso com outros serotoninérgicos. Observar humor, ideação suicida no início.",
    intercorrencias: [
      { sinal: "Agitação + tremor + sudorese + diarreia + febre", conduta: "Suspender, comunicar médico (suspeita de sd. serotoninérgica)." },
      { sinal: "Confusão, sonolência, cefaleia (idoso)", conduta: "Solicitar sódio sérico, comunicar médico." },
    ],
  },
  fluoxetina: {
    classe: "Antidepressivo ISRS",
    indicacao: "Depressão, TOC, bulimia.",
    efeitosComuns: ["Insônia", "Náusea", "Inapetência"],
    efeitosGraves: ["Síndrome serotoninérgica", "Hiponatremia"],
    cuidados: "Administrar pela manhã. Meia-vida longa: efeitos podem persistir após suspensão.",
    intercorrencias: [
      { sinal: "Tremor + febre + agitação", conduta: "Suspender e comunicar médico." },
    ],
  },
  amitriptilina: {
    classe: "Antidepressivo tricíclico",
    indicacao: "Depressão, dor neuropática, insônia.",
    efeitosComuns: ["Boca seca", "Constipação", "Retenção urinária", "Sonolência"],
    efeitosGraves: ["Arritmia", "Confusão (idoso)", "Glaucoma agudo"],
    cuidados: "Evitar no idoso quando possível. Monitorar diurese e evacuação.",
    intercorrencias: [
      { sinal: "Confusão, alucinação", conduta: "Comunicar médico, suspender se grave." },
      { sinal: "Retenção urinária", conduta: "Avaliar bexigoma, sondagem se necessário, comunicar." },
    ],
  },
  metformina: {
    classe: "Antidiabético oral",
    indicacao: "Diabetes tipo 2.",
    efeitosComuns: ["Náusea", "Diarreia", "Gosto metálico"],
    efeitosGraves: ["Acidose lática (rara)"],
    cuidados: "Administrar com alimento. Suspender em desidratação, vômito, contraste iodado.",
    intercorrencias: [
      { sinal: "Hipoglicemia (se associada a outros)", conduta: "Glicemia capilar, oferecer carboidrato, comunicar." },
    ],
  },
  losartana: {
    classe: "Anti-hipertensivo (BRA)",
    indicacao: "Hipertensão, proteção renal.",
    efeitosComuns: ["Tontura", "Hipotensão"],
    efeitosGraves: ["Hipercalemia", "Insuficiência renal aguda"],
    cuidados: "Monitorar PA, potássio e creatinina. Cuidado com desidratação.",
    intercorrencias: [
      { sinal: "PA <90/60 + tontura", conduta: "Não administrar, deitar com MMII elevados, comunicar." },
    ],
  },
  enalapril: {
    classe: "Anti-hipertensivo (IECA)",
    indicacao: "Hipertensão, insuficiência cardíaca.",
    efeitosComuns: ["Tosse seca", "Tontura"],
    efeitosGraves: ["Angioedema", "Hipercalemia", "IRA"],
    cuidados: "Observar edema de face/lábios. Monitorar PA e função renal.",
    intercorrencias: [
      { sinal: "Inchaço de lábios/língua, dispneia", conduta: "Suspender, encaminhar à emergência (angioedema)." },
    ],
  },
  hidroclorotiazida: {
    classe: "Diurético tiazídico",
    indicacao: "Hipertensão.",
    efeitosComuns: ["Poliúria", "Tontura"],
    efeitosGraves: ["Hipopotassemia", "Hiponatremia", "Desidratação"],
    cuidados: "Administrar pela manhã. Monitorar K+ e Na+.",
    intercorrencias: [
      { sinal: "Câimbras, fraqueza muscular", conduta: "Suspeitar hipocalemia, solicitar K+, comunicar." },
    ],
  },
  furosemida: {
    classe: "Diurético de alça",
    indicacao: "Edema, insuficiência cardíaca.",
    efeitosComuns: ["Poliúria", "Sede"],
    efeitosGraves: ["Hipocalemia grave", "Desidratação", "Ototoxicidade"],
    cuidados: "Pesar diariamente, controlar diurese, monitorar K+.",
    intercorrencias: [
      { sinal: "Hipotensão, oligúria, mucosas secas", conduta: "Suspender, hidratar, comunicar." },
    ],
  },
  omeprazol: {
    classe: "Inibidor de bomba de prótons",
    indicacao: "DRGE, úlcera, proteção gástrica.",
    efeitosComuns: ["Cefaleia", "Diarreia"],
    efeitosGraves: ["Hipomagnesemia (uso prolongado)", "Fratura óssea", "C. difficile"],
    cuidados: "Administrar em jejum, 30 min antes do desjejum.",
    intercorrencias: [
      { sinal: "Diarreia persistente com sangue/muco", conduta: "Isolar, coletar amostra, comunicar (suspeita de C. difficile)." },
    ],
  },
  levotiroxina: {
    classe: "Hormônio tireoidiano",
    indicacao: "Hipotireoidismo.",
    efeitosComuns: ["Geralmente bem tolerada"],
    efeitosGraves: ["Taquicardia, arritmia (overdose)"],
    cuidados: "Em JEJUM, 30-60 min antes do café. Não administrar junto com cálcio, ferro ou omeprazol.",
    intercorrencias: [
      { sinal: "Taquicardia, sudorese, tremor", conduta: "Verificar dose, comunicar médico (suspeita de hipertireoidismo iatrogênico)." },
    ],
  },
  acidovalproico: {
    classe: "Anticonvulsivante / estabilizador",
    indicacao: "Epilepsia, transtorno bipolar.",
    efeitosComuns: ["Tremor", "Ganho de peso", "Queda de cabelo"],
    efeitosGraves: ["Hepatotoxicidade", "Pancreatite", "Trombocitopenia"],
    cuidados: "Monitorar enzimas hepáticas e plaquetas. Atenção a dor abdominal intensa.",
    intercorrencias: [
      { sinal: "Icterícia, dor em hipocôndrio direito", conduta: "Suspender, comunicar médico, solicitar TGO/TGP." },
      { sinal: "Dor abdominal intensa + vômito", conduta: "Suspender, NPO, comunicar (suspeita de pancreatite)." },
    ],
  },
  acidoacetilsalicilico: {
    classe: "Antiagregante plaquetário",
    indicacao: "Profilaxia cardiovascular.",
    efeitosComuns: ["Dispepsia"],
    efeitosGraves: ["Sangramento digestivo"],
    cuidados: "Administrar após refeição. Observar fezes escuras, equimoses.",
    intercorrencias: [
      { sinal: "Melena, hematêmese", conduta: "Suspender, comunicar médico, monitorar PA e FC." },
    ],
  },
};

const SINONIMOS: Record<string, string> = {
  "lítio": "litio",
  "carbonato de litio": "litio",
  "carbonato litio": "litio",
  "aas": "acidoacetilsalicilico",
  "acido acetil salicilico": "acidoacetilsalicilico",
  "acido acetilsalicilico": "acidoacetilsalicilico",
  "depakene": "acidovalproico",
  "depakote": "acidovalproico",
  "valproato": "acidovalproico",
  "valproato de sodio": "acidovalproico",
  "acido valproico": "acidovalproico",
  "divalproato": "acidovalproico",
  "puran": "levotiroxina",
  "puran t4": "levotiroxina",
  "synthroid": "levotiroxina",
};

export function chaveFarmaco(medicacao: string): string {
  const n = norm(medicacao);
  if (!n) return "";
  if (SINONIMOS[n]) return SINONIMOS[n];
  // tenta cada palavra
  for (const w of n.split(" ")) {
    if (DB[w]) return w;
    if (SINONIMOS[w]) return SINONIMOS[w];
  }
  // tenta primeiro token sem espaço
  const primeiro = n.split(" ")[0];
  return primeiro;
}

export function buscarFicha(medicacao: string): FichaFarmaco | undefined {
  return DB[chaveFarmaco(medicacao)];
}

export function nomeApresentacao(medicacao: string): string {
  return medicacao.trim().split(/\s+/).slice(0, 3).join(" ");
}