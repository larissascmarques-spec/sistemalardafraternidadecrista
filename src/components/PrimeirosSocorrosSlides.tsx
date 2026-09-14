import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Youtube, CheckCircle, XCircle } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type SlideKind =
  | "capa-geral"
  | "titulo-modulo"
  | "conteudo"
  | "video"
  | "quiz"
  | "resposta"
  | "referencias";

interface SlideBase {
  kind: SlideKind;
  modulo?: number;
}

interface CapaGeralSlide extends SlideBase {
  kind: "capa-geral";
}

interface TituloModuloSlide extends SlideBase {
  kind: "titulo-modulo";
  numero: number;
  titulo: string;
  tempo: string;
  cor: string;
}

interface ConteudoSlide extends SlideBase {
  kind: "conteudo";
  titulo: string;
  corpo: React.ReactNode;
  imagemUrl?: string;
  imagemAlt?: string;
  imagemCredit?: string;
  cor: string;
}

interface VideoSlide extends SlideBase {
  kind: "video";
  titulo: string;
  url: string;
  descricao: string;
  cor: string;
}

interface QuizSlide extends SlideBase {
  kind: "quiz";
  situacao: string;
  opcoes: string[];
  cor: string;
}

interface RespostaSlide extends SlideBase {
  kind: "resposta";
  correta: "a" | "b" | "c";
  justificativa: string;
  opcoes: string[];
  cor: string;
}

interface ReferenciaSlide extends SlideBase {
  kind: "referencias";
}

type Slide =
  | CapaGeralSlide
  | TituloModuloSlide
  | ConteudoSlide
  | VideoSlide
  | QuizSlide
  | RespostaSlide
  | ReferenciaSlide;

// ─── Cores por módulo ────────────────────────────────────────────────────────

const CORES: Record<number, { fundo: string; texto: string; destaque: string; borda: string }> = {
  0: { fundo: "from-slate-800 to-slate-900", texto: "text-white", destaque: "bg-red-600", borda: "border-red-500" },
  1: { fundo: "from-blue-700 to-blue-900", texto: "text-white", destaque: "bg-blue-500", borda: "border-blue-400" },
  2: { fundo: "from-orange-600 to-orange-900", texto: "text-white", destaque: "bg-orange-400", borda: "border-orange-400" },
  3: { fundo: "from-red-700 to-red-900", texto: "text-white", destaque: "bg-red-400", borda: "border-red-400" },
  4: { fundo: "from-teal-700 to-teal-900", texto: "text-white", destaque: "bg-teal-400", borda: "border-teal-400" },
  5: { fundo: "from-purple-700 to-purple-900", texto: "text-white", destaque: "bg-purple-400", borda: "border-purple-400" },
  6: { fundo: "from-amber-700 to-amber-900", texto: "text-white", destaque: "bg-amber-400", borda: "border-amber-400" },
  7: { fundo: "from-emerald-700 to-emerald-900", texto: "text-white", destaque: "bg-emerald-400", borda: "border-emerald-400" },
  99: { fundo: "from-slate-700 to-slate-900", texto: "text-white", destaque: "bg-slate-400", borda: "border-slate-400" },
};

// ─── Dados dos slides ─────────────────────────────────────────────────────────

const SLIDES: Slide[] = [
  // ── CAPA GERAL ────────────────────────────────────────────────────────────
  {
    kind: "capa-geral",
    modulo: 0,
  },

  // ══════════════════════════════════════════════════════════════════
  // MÓDULO 1 — Segurança da cena, avaliação inicial e SAMU 192 (5 min)
  // ══════════════════════════════════════════════════════════════════
  {
    kind: "titulo-modulo",
    modulo: 1,
    numero: 1,
    titulo: "Segurança da cena, avaliação inicial e SAMU 192",
    tempo: "5 minutos",
    cor: "1",
  },
  {
    kind: "conteudo",
    modulo: 1,
    titulo: "Módulo 1 — Antes de qualquer ação: avalie a segurança da cena",
    corpo: (
      <div className="space-y-4">
        <p>
          Antes de qualquer contato com a vítima, avalie o ambiente ao redor:
          identifique riscos — piso molhado, objetos que possam cair, fios expostos —
          e verifique se é seguro se aproximar.
        </p>
        <div className="rounded-lg border-l-4 border-yellow-400 bg-yellow-900/40 p-4">
          <p className="font-bold text-yellow-300">⚠️ Regra fundamental</p>
          <p className="mt-1">
            Se o ambiente não for seguro, não se coloque em risco. A regra geral é:
            <strong> não se tornar uma segunda vítima</strong> antes de prestar qualquer cuidado.
          </p>
        </div>
      </div>
    ),
    imagemUrl: "https://images.unsplash.com/photo-1612531386530-97286d97c2d2?w=900&q=80",
    imagemAlt: "Profissional de saúde avaliando ambiente antes de agir",
    imagemCredit: "Unsplash",
    cor: "1",
  },
  {
    kind: "conteudo",
    modulo: 1,
    titulo: "Módulo 1 — Como avaliar a vítima e quando acionar o SAMU 192",
    corpo: (
      <div className="space-y-4">
        <p>
          Com a cena segura: se houver outra pessoa, peça que ela ligue para o{" "}
          <strong>SAMU 192</strong> enquanto você avalia a vítima. Se estiver sozinha,
          avalie primeiro:
        </p>
        <ul className="space-y-2 pl-2">
          <li className="flex gap-2"><span className="text-blue-300 font-bold">→</span> Chame a pessoa pelo nome e pergunte se está bem.</li>
          <li className="flex gap-2"><span className="text-blue-300 font-bold">→</span> Verifique se ela está respirando normalmente.</li>
        </ul>
        <div className="rounded-lg border-l-4 border-red-400 bg-red-900/40 p-4">
          <p className="font-bold text-red-300">🚨 Acione o SAMU 192 imediatamente se houver:</p>
          <ul className="mt-2 space-y-1 text-sm">
            <li>• Vítima que não responde</li>
            <li>• Sangramento intenso</li>
            <li>• Dificuldade grave para respirar</li>
            <li>• Dor no peito súbita</li>
            <li>• Sinais de AVC ou trauma importante</li>
          </ul>
        </div>
        <p className="text-sm opacity-80">
          Como regra geral: <strong>não mova a vítima</strong> antes da chegada do socorro,
          exceto em risco iminente (fogo, por exemplo).
        </p>
      </div>
    ),
    imagemUrl: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=900&q=80",
    imagemAlt: "Profissional de saúde ao telefone acionando socorro",
    imagemCredit: "Unsplash",
    cor: "1",
  },
  {
    kind: "quiz",
    modulo: 1,
    situacao:
      "Você ouve um barulho no corredor e encontra uma residente caída, consciente, respondendo quando você chama o nome dela. Qual sua primeira ação?",
    opcoes: [
      "a) Levantar a residente imediatamente para levá-la até a cama",
      "b) Avaliar a segurança do local, checar a resposta dela com calma, e acionar o SAMU 192 se a situação parecer grave",
      "c) Ligar para a família antes de fazer qualquer coisa",
    ],
    cor: "1",
  },
  {
    kind: "resposta",
    modulo: 1,
    correta: "b",
    justificativa:
      "Mesmo que a residente esteja consciente, o ambiente deve ser avaliado primeiro — e qualquer sinal de gravidade exige acionar o 192 antes de movê-la.",
    opcoes: [
      "a) Levantar a residente imediatamente para levá-la até a cama",
      "b) Avaliar a segurança do local, checar a resposta dela com calma, e acionar o SAMU 192 se a situação parecer grave",
      "c) Ligar para a família antes de fazer qualquer coisa",
    ],
    cor: "1",
  },

  // ══════════════════════════════════════════════════════════════════
  // MÓDULO 2 — Engasgo / OVACE em adultos (8 min)
  // ══════════════════════════════════════════════════════════════════
  {
    kind: "titulo-modulo",
    modulo: 2,
    numero: 2,
    titulo: "Engasgo / OVACE em adultos",
    tempo: "8 minutos",
    cor: "2",
  },
  {
    kind: "conteudo",
    modulo: 2,
    titulo: "Módulo 2 — Engasgo leve × engasgo grave: como diferenciar",
    corpo: (
      <div className="space-y-5">
        <div className="rounded-lg border border-green-500 bg-green-900/40 p-4">
          <p className="font-bold text-green-300 text-lg">✅ Engasgo LEVE (obstrução parcial)</p>
          <p className="mt-2">A pessoa ainda consegue <strong>tossir, falar ou fazer sons</strong> — há passagem de ar.</p>
          <div className="mt-3 rounded bg-green-800/50 p-3">
            <p className="font-semibold">O que fazer:</p>
            <p>Incentive-a a tossir com força. <strong>Não aplique nenhuma manobra.</strong></p>
          </div>
        </div>
        <div className="rounded-lg border border-red-500 bg-red-900/40 p-4">
          <p className="font-bold text-red-300 text-lg">🚨 Engasgo GRAVE (obstrução total)</p>
          <p className="mt-2">A pessoa <strong>não consegue tossir, falar nem respirar</strong>, leva as mãos ao pescoço e pode ficar com os lábios arroxeados.</p>
          <p className="mt-2 font-semibold text-orange-300">→ Exige ação imediata (ver próximo slide).</p>
        </div>
      </div>
    ),
    imagemUrl: "https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=900&q=80",
    imagemAlt: "Pessoa com dificuldade para respirar levando as mãos ao pescoço",
    imagemCredit: "Unsplash",
    cor: "2",
  },
  {
    kind: "conteudo",
    modulo: 2,
    titulo: "Módulo 2 — Protocolo atualizado AHA 2025: o que fazer no engasgo grave",
    corpo: (
      <div className="space-y-4">
        <div className="rounded-lg border-l-4 border-orange-400 bg-orange-900/40 p-3 text-sm">
          <p className="font-bold text-orange-300">📋 Atualização AHA outubro 2025</p>
          <p className="mt-1">A Heimlich isolada deixou de ser o primeiro passo. Agora: <strong>alternar 5 golpes nas costas + 5 compressões abdominais</strong>, repetindo até desobstruir ou vítima perder a consciência.</p>
        </div>
        <ol className="space-y-3">
          <li className="flex gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500 font-bold">1</span>
            <div>
              <p className="font-semibold">5 golpes nas costas</p>
              <p className="text-sm opacity-80">Posicione-se atrás da vítima, incline o tronco levemente para frente e aplique 5 golpes firmes entre as escápulas com o calcanhar da mão.</p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500 font-bold">2</span>
            <div>
              <p className="font-semibold">5 compressões abdominais (Heimlich)</p>
              <p className="text-sm opacity-80">Abrace a vítima pela cintura, feche uma mão em punho entre o umbigo e a ponta do esterno, segure com a outra e puxe com força para dentro e para cima.</p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500 font-bold">3</span>
            <div>
              <p className="font-semibold">Repita os dois ciclos</p>
              <p className="text-sm opacity-80">Alterne (5 golpes + 5 compressões) até o objeto ser expelido ou a vítima perder a consciência.</p>
            </div>
          </li>
        </ol>
        <div className="rounded-lg bg-red-900/50 p-3 text-sm">
          <p className="font-bold">Se a vítima perder a consciência:</p>
          <p>Apoie a queda com cuidado → acione o SAMU 192 → inicie as compressões torácicas (RCP — Módulo 3).</p>
        </div>
      </div>
    ),
    imagemUrl: "https://images.unsplash.com/photo-1584515933487-779824d29309?w=900&q=80",
    imagemAlt: "Demonstração de primeiros socorros com compressão abdominal",
    imagemCredit: "Unsplash",
    cor: "2",
  },
  {
    kind: "video",
    modulo: 2,
    titulo: "Módulo 2 — Vídeo: Manobra de desengasgo em adultos (em português)",
    url: "https://www.youtube.com/watch?v=DmDkdMSHA6g",
    descricao: "G1 / Bem Estar — Aprenda a fazer a manobra de Heimlich com o Dr. Sérgio Timerman",
    cor: "2",
  },
  {
    kind: "quiz",
    modulo: 2,
    situacao:
      "Uma residente começa a tossir forte durante o almoço, mas ainda consegue tossir e emitir sons. O que fazer?",
    opcoes: [
      "a) Aplicar a manobra de Heimlich imediatamente",
      "b) Incentivá-la a continuar tossindo e observar de perto, sem intervir com a manobra",
      "c) Dar tapinhas nas costas com força",
    ],
    cor: "2",
  },
  {
    kind: "resposta",
    modulo: 2,
    correta: "b",
    justificativa:
      "Engasgo leve (ainda há passagem de ar) não exige manobra — apenas observação atenta e incentivo a tossir. A manobra só é aplicada no engasgo grave, quando a pessoa não consegue tossir nem falar.",
    opcoes: [
      "a) Aplicar a manobra de Heimlich imediatamente",
      "b) Incentivá-la a continuar tossindo e observar de perto, sem intervir com a manobra",
      "c) Dar tapinhas nas costas com força",
    ],
    cor: "2",
  },

  // ══════════════════════════════════════════════════════════════════
  // MÓDULO 3 — Parada cardiorrespiratória e RCP (10 min)
  // ══════════════════════════════════════════════════════════════════
  {
    kind: "titulo-modulo",
    modulo: 3,
    numero: 3,
    titulo: "Parada cardiorrespiratória e RCP",
    tempo: "10 minutos",
    cor: "3",
  },
  {
    kind: "conteudo",
    modulo: 3,
    titulo: "Módulo 3 — Como reconhecer uma parada cardiorrespiratória",
    corpo: (
      <div className="space-y-4">
        <div className="rounded-lg border border-red-400 bg-red-900/40 p-4">
          <p className="font-bold text-red-300 text-lg">🚨 Sinais de PCR</p>
          <ul className="mt-3 space-y-2">
            <li className="flex gap-2"><span className="text-red-400">•</span> <strong>Não responde</strong> quando chamada e tocada nos ombros</li>
            <li className="flex gap-2"><span className="text-red-400">•</span> <strong>Não respira normalmente</strong> (ou apresenta apenas gasping — respiração agônica, irregular)</li>
          </ul>
        </div>
        <div className="rounded-lg border-l-4 border-yellow-400 bg-yellow-900/40 p-4">
          <p className="font-bold text-yellow-300">⚠️ Atenção</p>
          <p className="mt-2">
            Diante de suspeita de PCR, <strong>não gaste tempo aferindo pulso, pressão ou outros sinais vitais</strong>.
            A prioridade é confirmar rapidamente resposta e respiração (em até 10 segundos) e iniciar as compressões.
          </p>
          <p className="mt-2 text-sm opacity-80">
            Cada minuto sem RCP reduz a chance de sobrevivência.
          </p>
        </div>
      </div>
    ),
    imagemUrl: "https://images.unsplash.com/photo-1504439468489-c8920d796a29?w=900&q=80",
    imagemAlt: "Primeiros socorros — verificação de resposta em adulto caído",
    imagemCredit: "Unsplash",
    cor: "3",
  },
  {
    kind: "conteudo",
    modulo: 3,
    titulo: "Módulo 3 — Como realizar as compressões torácicas (RCP)",
    corpo: (
      <div className="space-y-4">
        <p className="font-semibold text-red-300">
          Assim que identificar ausência de resposta e respiração: acione o SAMU 192 e inicie imediatamente.
        </p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-lg bg-white/10 p-3">
            <p className="font-bold text-sm text-red-300 mb-2">POSIÇÃO</p>
            <ul className="space-y-1 text-sm">
              <li>• Ajoelhe-se ao lado da vítima, na altura do ombro</li>
              <li>• Entrelace os dedos das mãos</li>
              <li>• Posicione o calcanhar da mão no <strong>centro do tórax</strong> (metade inferior do esterno)</li>
              <li>• Braços esticados</li>
            </ul>
          </div>
          <div className="rounded-lg bg-white/10 p-3">
            <p className="font-bold text-sm text-red-300 mb-2">RITMO</p>
            <ul className="space-y-1 text-sm">
              <li>• Profundidade: <strong>5 a 6 cm</strong></li>
              <li>• Frequência: <strong>100 a 120 por minuto</strong></li>
              <li>• Permita que o tórax retorne totalmente entre uma compressão e outra</li>
              <li>• Se houver mais de uma cuidadora: <strong>reveze a cada 2 minutos</strong></li>
            </ul>
          </div>
        </div>
        <div className="rounded-lg border-l-4 border-blue-400 bg-blue-900/40 p-3 text-sm">
          <p className="font-bold text-blue-300">Para cuidadoras sem treinamento em respiração de resgate:</p>
          <p className="mt-1">A orientação é <strong>RCP somente com compressões</strong> (sem parar para ventilar), mantendo-as de forma contínua até a chegada do socorro ou a vítima reagir.</p>
        </div>
      </div>
    ),
    imagemUrl: "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=900&q=80",
    imagemAlt: "Demonstração de compressões torácicas em manequim de treinamento",
    imagemCredit: "Unsplash",
    cor: "3",
  },
  {
    kind: "video",
    modulo: 3,
    titulo: "Módulo 3 — Vídeo: Demonstração de RCP em adultos (em português)",
    url: "https://www.youtube.com/c/minsaudebr",
    descricao:
      "Busque no canal oficial do Ministério da Saúde (youtube.com/minsaudebr) ou no canal do SAMU / Hospital das Clínicas / Cruz Vermelha Brasileira um vídeo atual de demonstração de RCP em português do Brasil. Não utilize vídeos em outro idioma.",
    cor: "3",
  },
  {
    kind: "quiz",
    modulo: 3,
    situacao:
      "Você encontra uma residente caída, não responde ao ser chamada e não está respirando normalmente. Você está sozinha no momento. Qual a sequência correta?",
    opcoes: [
      "a) Ligar para o SAMU 192 e começar as compressões imediatamente",
      "b) Tentar acordá-la por 5 minutos antes de agir",
      "c) Esperar outra cuidadora chegar para decidir o que fazer",
    ],
    cor: "3",
  },
  {
    kind: "resposta",
    modulo: 3,
    correta: "a",
    justificativa:
      "Cada minuto sem RCP reduz a chance de sobrevivência. Quando estiver sozinha: ligue para o 192 (pode usar viva-voz) e inicie as compressões imediatamente sem esperar por ninguém.",
    opcoes: [
      "a) Ligar para o SAMU 192 e começar as compressões imediatamente",
      "b) Tentar acordá-la por 5 minutos antes de agir",
      "c) Esperar outra cuidadora chegar para decidir o que fazer",
    ],
    cor: "3",
  },

  // ══════════════════════════════════════════════════════════════════
  // MÓDULO 4 — Emergências clínicas do adulto (20 min)
  // ══════════════════════════════════════════════════════════════════
  {
    kind: "titulo-modulo",
    modulo: 4,
    numero: 4,
    titulo: "Emergências clínicas do adulto",
    tempo: "20 minutos",
    cor: "4",
  },
  {
    kind: "conteudo",
    modulo: 4,
    titulo: "Módulo 4 — Instrução geral: sinais vitais antes de agir",
    corpo: (
      <div className="space-y-4">
        <div className="rounded-lg border-l-4 border-teal-400 bg-teal-900/40 p-4">
          <p className="font-bold text-teal-300">📋 Diferente da PCR (Módulo 3)</p>
          <p className="mt-2">
            Nas situações deste módulo há tempo para aferir sinais vitais básicos antes de decidir a conduta:
            pulso, respiração e, quando houver aparelho disponível, <strong>pressão arterial e glicemia capilar</strong>.
          </p>
          <p className="mt-2 text-sm opacity-80">
            Isso ajuda a diferenciar quadros parecidos (por exemplo, hipoglicemia e hiperglicemia)
            e a informar o SAMU com mais precisão.
          </p>
        </div>
        <p className="font-semibold text-teal-200">Emergências que veremos neste módulo:</p>
        <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-3">
          {["1. Infarto", "2. AVC", "3. Hipoglicemia", "4. Hiperglicemia", "5. Síncope / desmaio", "6. Anafilaxia"].map((e) => (
            <div key={e} className="rounded bg-white/10 px-3 py-2 text-center font-medium">
              {e}
            </div>
          ))}
        </div>
      </div>
    ),
    imagemUrl: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=900&q=80",
    imagemAlt: "Profissional de saúde aferindo sinais vitais de paciente",
    imagemCredit: "Unsplash",
    cor: "4",
  },
  {
    kind: "conteudo",
    modulo: 4,
    titulo: "Módulo 4 — Emergência 1: Suspeita de infarto (dor no peito)",
    corpo: (
      <div className="space-y-4">
        <div>
          <p className="font-bold text-teal-300 mb-2">Sinais:</p>
          <ul className="space-y-1 text-sm">
            <li>• Dor ou aperto no peito, irradiando para braço, costas, pescoço ou mandíbula</li>
            <li>• Sudorese fria, falta de ar, náusea, mal-estar</li>
          </ul>
          <div className="mt-3 rounded-lg border border-yellow-500 bg-yellow-900/30 p-3 text-sm">
            <p className="font-bold text-yellow-300">⚠️ Atenção especial</p>
            <p className="mt-1">Em <strong>mulheres, idosos e pessoas com diabetes</strong>, os sintomas podem ser mais discretos: cansaço extremo ou desconforto abdominal, em vez da dor clássica no peito.</p>
          </div>
        </div>
        <div>
          <p className="font-bold text-teal-300 mb-2">O que fazer:</p>
          <ul className="space-y-1 text-sm">
            <li>✅ Ligue o 192 imediatamente</li>
            <li>✅ Afira pulso e respiração</li>
            <li>✅ Mantenha a pessoa sentada e confortável, com joelhos levemente dobrados</li>
            <li>✅ Afrouxe roupas apertadas; não deixe a pessoa fazer esforço</li>
            <li>❌ Não ofereça medicamentos</li>
            <li>✅ Se ela perder a consciência e parar de respirar: inicie a RCP (Módulo 3)</li>
          </ul>
        </div>
      </div>
    ),
    imagemUrl: "https://images.unsplash.com/photo-1628348070889-cb656235b4eb?w=900&q=80",
    imagemAlt: "Pessoa com mão no peito com expressão de dor",
    imagemCredit: "Unsplash",
    cor: "4",
  },
  {
    kind: "conteudo",
    modulo: 4,
    titulo: "Módulo 4 — Emergência 2: Suspeita de AVC",
    corpo: (
      <div className="space-y-4">
        <div>
          <p className="font-bold text-teal-300 mb-2">Sinais:</p>
          <ul className="space-y-1 text-sm">
            <li>• Fraqueza ou formigamento em um lado do corpo (rosto, braço ou perna)</li>
            <li>• Boca torta; dificuldade para falar ou entender</li>
            <li>• Alteração da visão; perda de equilíbrio</li>
            <li>• Dor de cabeça súbita e intensa</li>
          </ul>
        </div>
        <div className="rounded-lg border border-teal-400 bg-teal-900/40 p-3 text-sm">
          <p className="font-bold text-teal-300">Teste rápido de AVC:</p>
          <p className="mt-1">Peça para a pessoa <strong>levantar os dois braços</strong>, <strong>sorrir</strong> e <strong>repetir uma frase</strong>. Dificuldade em qualquer um desses pontos é sinal de alerta.</p>
        </div>
        <div>
          <p className="font-bold text-teal-300 mb-2">O que fazer:</p>
          <ul className="space-y-1 text-sm">
            <li>✅ Ligue o 192 imediatamente e <strong>anote o horário dos primeiros sintomas</strong></li>
            <li>✅ Afira pulso e respiração</li>
            <li>✅ Se houver rebaixamento ou risco de vômito (mas ainda respirando): coloque em <strong>Posição Lateral de Segurança (PLS)</strong></li>
            <li>❌ Não ofereça água ou comida — risco de engasgo</li>
          </ul>
        </div>
      </div>
    ),
    imagemUrl: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=900&q=80",
    imagemAlt: "Profissional de saúde realizando avaliação neurológica rápida em paciente",
    imagemCredit: "Unsplash",
    cor: "4",
  },
  {
    kind: "conteudo",
    modulo: 4,
    titulo: "Módulo 4 — Emergência 3: Hipoglicemia (açúcar baixo no sangue)",
    corpo: (
      <div className="space-y-4">
        <div>
          <p className="font-bold text-teal-300 mb-2">Sinais:</p>
          <p className="text-sm">Tremores, sudorese fria, fome súbita, irritabilidade, confusão, coração acelerado. Em casos graves: convulsão ou desmaio.</p>
        </div>
        <div className="rounded-lg border border-teal-400 bg-teal-900/40 p-3 text-sm">
          <p className="font-bold text-teal-300">Glicemia abaixo de 70 mg/dL = hipoglicemia</p>
          <p className="mt-1">Se houver glicosímetro disponível, <strong>afira a glicemia capilar antes de agir</strong>.</p>
        </div>
        <div>
          <p className="font-bold text-teal-300 mb-2">O que fazer:</p>
          <div className="space-y-2 text-sm">
            <div className="rounded bg-green-900/40 p-2">
              <p className="font-semibold text-green-300">Se consciente e consegue engolir:</p>
              <p>Ofereça uma fonte de açúcar de ação rápida (colher de açúcar, suco, mel ou bala). Reavalie a glicemia em 15 minutos; se ainda estiver baixa, repita.</p>
            </div>
            <div className="rounded bg-red-900/40 p-2">
              <p className="font-semibold text-red-300">Se inconsciente ou com dificuldade para engolir:</p>
              <p>Não ofereça nada por via oral → posicione em PLS → acione o SAMU 192 imediatamente.</p>
            </div>
          </div>
        </div>
      </div>
    ),
    imagemUrl: "https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=900&q=80",
    imagemAlt: "Glicosímetro para medição de glicemia capilar",
    imagemCredit: "Unsplash",
    cor: "4",
  },
  {
    kind: "conteudo",
    modulo: 4,
    titulo: "Módulo 4 — Emergência 4: Hiperglicemia (açúcar alto no sangue)",
    corpo: (
      <div className="space-y-4">
        <div>
          <p className="font-bold text-teal-300 mb-2">Sinais:</p>
          <p className="text-sm">Sede excessiva, aumento da frequência urinária, boca seca, cansaço, dor de cabeça, visão turva.</p>
          <div className="mt-2 rounded border border-red-500 bg-red-900/30 p-2 text-sm">
            <p className="font-bold text-red-300">⚠️ Sinais de quadro grave (cetoacidose / coma hiperosmolar):</p>
            <p className="mt-1">Náusea, vômitos, dor abdominal, respiração rápida e profunda, <strong>hálito com odor de fruta madura (cetônico)</strong>, confusão, sonolência excessiva.</p>
          </div>
        </div>
        <div>
          <p className="font-bold text-teal-300 mb-2">O que fazer:</p>
          <ul className="space-y-1 text-sm">
            <li>✅ Afira a glicemia: acima de 180–250 = hiperglicemia; acima de 300 = emergência médica</li>
            <li className="font-bold text-red-300">❌ NUNCA ofereça açúcar nessa situação</li>
            <li>✅ Se consciente e sem sinais graves: ofereça água e monitore</li>
            <li>✅ Diante de qualquer sinal grave ou glicemia muito alta: acione o SAMU 192</li>
          </ul>
        </div>
      </div>
    ),
    imagemUrl: "https://images.unsplash.com/photo-1473116763249-2faaef81ccda?w=900&q=80",
    imagemAlt: "Pessoa com sede excessiva, sintoma de hiperglicemia",
    imagemCredit: "Unsplash",
    cor: "4",
  },
  {
    kind: "conteudo",
    modulo: 4,
    titulo: "Módulo 4 — Emergência 5: Síncope / desmaio",
    corpo: (
      <div className="space-y-4">
        <p className="text-sm opacity-80">Geralmente causado por queda breve do fluxo sanguíneo ao cérebro.</p>
        <div>
          <p className="font-bold text-teal-300 mb-2">O que fazer:</p>
          <ul className="space-y-2 text-sm">
            <li className="flex gap-2"><span className="text-teal-400">✅</span> Afira pulso e respiração</li>
            <li className="flex gap-2"><span className="text-teal-400">✅</span> Deite a pessoa de costas, <strong>elevando as pernas acima do nível do coração</strong></li>
            <li className="flex gap-2"><span className="text-teal-400">✅</span> Afaste objetos de risco; afrouxe roupas apertadas</li>
            <li className="flex gap-2"><span className="text-yellow-400">⚠️</span> Mesmo que recupere a consciência rapidamente, observe — a queda pode ter causado trauma (ver Módulo 6)</li>
          </ul>
        </div>
        <div className="rounded-lg border-l-4 border-red-400 bg-red-900/40 p-3 text-sm">
          <p className="font-bold text-red-300">Acione o SAMU 192 se:</p>
          <ul className="mt-1 space-y-1">
            <li>• Não recuperar a consciência rapidamente</li>
            <li>• Houver outros sintomas (dor no peito, confusão persistente)</li>
            <li>• Tiver se machucado na queda</li>
          </ul>
        </div>
      </div>
    ),
    imagemUrl: "https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=900&q=80",
    imagemAlt: "Profissional de saúde avaliando paciente desmaiada no chão",
    imagemCredit: "Unsplash",
    cor: "4",
  },
  {
    kind: "conteudo",
    modulo: 4,
    titulo: "Módulo 4 — Emergência 6: Reação alérgica grave / anafilaxia",
    corpo: (
      <div className="space-y-4">
        <div>
          <p className="font-bold text-teal-300 mb-2">Sinais:</p>
          <ul className="space-y-1 text-sm">
            <li>• Inchaço de lábios, olhos ou garganta</li>
            <li>• Dificuldade para respirar ou engolir</li>
            <li>• Urticária espalhada pelo corpo</li>
            <li>• Queda de pressão: fraqueza, tontura, desmaio</li>
            <li>• <strong>Sintomas que evoluem rapidamente</strong> após contato com alimento, picada ou medicamento</li>
          </ul>
        </div>
        <div>
          <p className="font-bold text-teal-300 mb-2">O que fazer:</p>
          <ul className="space-y-1 text-sm">
            <li>✅ Ligue o 192 imediatamente informando <strong>"anafilaxia"</strong> ou <strong>"reação alérgica grave"</strong></li>
            <li>✅ Afira pulso e respiração</li>
            <li>✅ Deite com as pernas elevadas (ou sentada se tiver dificuldade para respirar)</li>
            <li>✅ Permaneça ao lado até a chegada do socorro</li>
            <li>✅ Se ela tiver <strong>caneta de adrenalina autoinjetável</strong> já prescrita, ajude-a a usar conforme orientação prévia da equipe de saúde</li>
          </ul>
        </div>
      </div>
    ),
    imagemUrl: "https://images.unsplash.com/photo-1608178964625-7e48be23f5d2?w=900&q=80",
    imagemAlt: "Reação alérgica — inchaço visível em rosto de adulto",
    imagemCredit: "Unsplash",
    cor: "4",
  },
  {
    kind: "quiz",
    modulo: 4,
    situacao:
      "Uma residente diabética está confusa e com muita sede, e você tem um glicosímetro disponível. O que fazer primeiro?",
    opcoes: [
      "a) Oferecer uma fonte de açúcar de ação rápida imediatamente",
      "b) Aferir a glicemia capilar antes de decidir se é hipoglicemia ou hiperglicemia",
      "c) Deitá-la e elevar as pernas",
    ],
    cor: "4",
  },
  {
    kind: "resposta",
    modulo: 4,
    correta: "b",
    justificativa:
      "Os sintomas de hipoglicemia e hiperglicemia podem se confundir, e o tratamento é oposto em cada caso: na hipoglicemia oferece-se açúcar; na hiperglicemia, jamais. Por isso a glicemia deve ser confirmada antes de agir.",
    opcoes: [
      "a) Oferecer uma fonte de açúcar de ação rápida imediatamente",
      "b) Aferir a glicemia capilar antes de decidir se é hipoglicemia ou hiperglicemia",
      "c) Deitá-la e elevar as pernas",
    ],
    cor: "4",
  },

  // ══════════════════════════════════════════════════════════════════
  // MÓDULO 5 — Crises convulsivas (6 min)
  // ══════════════════════════════════════════════════════════════════
  {
    kind: "titulo-modulo",
    modulo: 5,
    numero: 5,
    titulo: "Crises convulsivas",
    tempo: "6 minutos",
    cor: "5",
  },
  {
    kind: "conteudo",
    modulo: 5,
    titulo: "Módulo 5 — Protocolo CALMA da Liga Brasileira de Epilepsia",
    corpo: (
      <div className="space-y-4">
        <p className="text-sm opacity-80">A Liga Brasileira de Epilepsia desenvolveu o protocolo CALMA para orientar a população:</p>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-5">
          {[
            { letra: "C", texto: "Conservar a calma" },
            { letra: "A", texto: "Afastar objetos que possam machucar" },
            { letra: "L", texto: "Lateralizar a cabeça (posição lateral de segurança)" },
            { letra: "M", texto: "Marcar o tempo da crise" },
            { letra: "A", texto: "Acionar ajuda médica, se necessário" },
          ].map((item) => (
            <div
              key={item.letra + item.texto}
              className="flex flex-col items-center rounded-lg bg-purple-800/60 p-3 text-center"
            >
              <span className="mb-1 text-3xl font-bold text-purple-300">{item.letra}</span>
              <span className="text-xs">{item.texto}</span>
            </div>
          ))}
        </div>
        <div className="grid gap-2 text-sm md:grid-cols-2">
          <div className="rounded-lg border border-red-500 bg-red-900/30 p-3">
            <p className="font-bold text-red-300">❌ Não faça:</p>
            <ul className="mt-1 space-y-1">
              <li>• Não contenha os movimentos — pode causar fraturas</li>
              <li>• Não coloque nada na boca — é um mito que a pessoa pode "engolir a língua"</li>
            </ul>
          </div>
          <div className="rounded-lg border border-purple-400 bg-purple-900/30 p-3">
            <p className="font-bold text-purple-300">✅ Acione o SAMU 192 se:</p>
            <ul className="mt-1 space-y-1">
              <li>• Primeira crise da pessoa</li>
              <li>• Crise com mais de 2 minutos</li>
              <li>• Crises seguidas sem recuperação</li>
              <li>• Dificuldade para respirar, vômito ou pele arroxeada</li>
              <li>• Machucado grave durante a queda</li>
            </ul>
          </div>
        </div>
      </div>
    ),
    imagemUrl: "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=900&q=80",
    imagemAlt: "Profissional de saúde auxiliando pessoa durante crise convulsiva, mantendo-a de lado",
    imagemCredit: "Unsplash",
    cor: "5",
  },
  {
    kind: "conteudo",
    modulo: 5,
    titulo: "Módulo 5 — O que fazer depois da crise convulsiva (período pós-ictal)",
    corpo: (
      <div className="space-y-4">
        <div className="rounded-lg border-l-4 border-purple-400 bg-purple-900/40 p-4">
          <p className="font-bold text-purple-300">Após a crise — período pós-ictal</p>
          <p className="mt-2 text-sm">
            É normal que a pessoa fique <strong>confusa ou sonolenta por alguns minutos</strong> após a crise.
            Isso se chama período pós-ictal e não significa que algo novo aconteceu.
          </p>
        </div>
        <ul className="space-y-2 text-sm">
          <li className="flex gap-2"><span className="text-purple-400">✅</span> Fique ao lado dela</li>
          <li className="flex gap-2"><span className="text-purple-400">✅</span> Fale de forma calma e tranquilizadora</li>
          <li className="flex gap-2"><span className="text-purple-400">✅</span> Mantenha-a em <strong>Posição Lateral de Segurança (PLS)</strong> até estar bem desperta</li>
          <li className="flex gap-2"><span className="text-purple-400">✅</span> Verifique se houve algum machucado durante a crise</li>
        </ul>
        <div className="rounded-lg bg-white/10 p-3 text-sm">
          <p className="font-semibold">Posição Lateral de Segurança (PLS):</p>
          <p className="mt-1">Deitada de lado, com a cabeça levemente inclinada para trás, para manter a via aérea livre e evitar engasgo com vômito ou saliva.</p>
        </div>
      </div>
    ),
    imagemUrl: "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=900&q=80",
    imagemAlt: "Cuidadora acompanhando paciente em recuperação após crise, posição lateral",
    imagemCredit: "Unsplash",
    cor: "5",
  },
  {
    kind: "quiz",
    modulo: 5,
    situacao:
      "Uma residente com diagnóstico conhecido de epilepsia tem uma crise convulsiva que dura cerca de 1 minuto e depois para sozinha, sem vômito. O que fazer?",
    opcoes: [
      "a) Aplicar o protocolo CALMA e, como não é a primeira crise dela, durou menos de 2 minutos e não houve vômito, acionar o SAMU só se houver outro sinal de alerta",
      "b) Ligar para o SAMU imediatamente em toda e qualquer crise, sem exceção",
      "c) Tentar segurar os braços e pernas dela para ela parar de se machucar",
    ],
    cor: "5",
  },
  {
    kind: "resposta",
    modulo: 5,
    correta: "a",
    justificativa:
      "Quando a pessoa já tem diagnóstico de epilepsia, a crise dura menos de 2 minutos e cessa espontaneamente sem vômito ou outros sinais de alerta, o protocolo CALMA já é suficiente. Segurar os membros durante a crise pode causar lesões musculares ou fraturas.",
    opcoes: [
      "a) Aplicar o protocolo CALMA e, como não é a primeira crise dela, durou menos de 2 minutos e não houve vômito, acionar o SAMU só se houver outro sinal de alerta",
      "b) Ligar para o SAMU imediatamente em toda e qualquer crise, sem exceção",
      "c) Tentar segurar os braços e pernas dela para ela parar de se machucar",
    ],
    cor: "5",
  },

  // ══════════════════════════════════════════════════════════════════
  // MÓDULO 6 — Quedas e trauma (8 min)
  // ══════════════════════════════════════════════════════════════════
  {
    kind: "titulo-modulo",
    modulo: 6,
    numero: 6,
    titulo: "Quedas e trauma",
    tempo: "8 minutos",
    cor: "6",
  },
  {
    kind: "conteudo",
    modulo: 6,
    titulo: "Módulo 6 — O que fazer diante de uma queda ou suspeita de trauma",
    corpo: (
      <div className="space-y-4">
        <ul className="space-y-2 text-sm">
          <li className="flex gap-2">
            <span className="text-amber-400 font-bold shrink-0">❌</span>
            <span><strong>Não movimente a vítima</strong>, especialmente se ela relatar dor intensa, não conseguir se mexer, ou se houver deformidade visível em algum membro.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-amber-400 font-bold shrink-0">✅</span>
            <span>Afira pulso e respiração; verifique o nível de consciência (ela responde bem, está confusa, ou não responde?).</span>
          </li>
          <li className="flex gap-2">
            <span className="text-amber-400 font-bold shrink-0">✅</span>
            <span>Peça para ela ficar parada e converse com calma enquanto aguarda o socorro.</span>
          </li>
        </ul>
        <div className="rounded-lg border-l-4 border-yellow-400 bg-yellow-900/40 p-3 text-sm">
          <p className="font-bold text-yellow-300">📌 Papel da cuidadora neste módulo</p>
          <p className="mt-1">
            Proteger a vítima, <strong>não movimentá-la</strong>, aferir os sinais vitais e acionar o socorro quando houver sinal de alerta.
            Técnicas de imobilização ou estabilização manual exigem treinamento específico e não fazem parte deste treinamento.
          </p>
        </div>
      </div>
    ),
    imagemUrl: "https://images.unsplash.com/photo-1550679257-4f1ae8d6a8b5?w=900&q=80",
    imagemAlt: "Cuidadora avaliando residente caída no chão sem movimentá-la",
    imagemCredit: "Unsplash",
    cor: "6",
  },
  {
    kind: "conteudo",
    modulo: 6,
    titulo: "Módulo 6 — Sinais de alerta que exigem acionamento imediato do SAMU 192",
    corpo: (
      <div className="space-y-3">
        <p className="text-sm opacity-80">Especialmente após queda com pancada na cabeça, acione o SAMU 192 se houver:</p>
        <ul className="grid gap-2 text-sm md:grid-cols-2">
          {[
            "Perda de consciência, mesmo breve",
            "Vômito após a queda (sinal de alerta de lesão interna, mesmo que a pessoa pareça bem depois)",
            "Dor de cabeça intensa e que não passa",
            "Confusão mental, sonolência excessiva ou dificuldade para acordar",
            "Sangramento ou saída de líquido pelo nariz, boca ou ouvido",
            "Fraqueza ou formigamento em algum lado do corpo",
            "Dor intensa, incapacidade de mover algum membro ou deformidade visível",
            "Qualquer dúvida sobre a gravidade",
          ].map((sinal) => (
            <li key={sinal} className="flex gap-2 rounded bg-amber-900/40 p-2">
              <span className="text-amber-400 shrink-0">⚠️</span>
              <span>{sinal}</span>
            </li>
          ))}
        </ul>
        <div className="rounded-lg border-l-4 border-amber-400 bg-amber-900/40 p-3 text-sm">
          <p>Mesmo sem esses sinais: se a residente bater a cabeça, <strong>observe-a de perto por pelo menos algumas horas</strong> antes de considerar o caso resolvido.</p>
        </div>
      </div>
    ),
    imagemUrl: "https://images.unsplash.com/photo-1616064916808-1d7793f6a3a0?w=900&q=80",
    imagemAlt: "Equipe médica atendendo paciente com suspeita de trauma na cabeça",
    imagemCredit: "Unsplash",
    cor: "6",
  },
  {
    kind: "quiz",
    modulo: 6,
    situacao:
      "Uma residente escorrega no banheiro, bate a cabeça e cai, ficando consciente e conversando normalmente. Alguns minutos depois, ela vomita. O que isso significa?",
    opcoes: [
      "a) Não significa nada, já que ela está consciente e conversando",
      "b) É um sinal de alerta de possível lesão interna, mesmo parecendo bem — acione o SAMU 192",
      "c) Só é preocupante se vomitar mais de 3 vezes",
    ],
    cor: "6",
  },
  {
    kind: "resposta",
    modulo: 6,
    correta: "b",
    justificativa:
      "Vômito após pancada na cabeça é um sinal de alerta de possível lesão interna, independentemente de o estado de consciência parecer normal. O SAMU 192 deve ser acionado imediatamente.",
    opcoes: [
      "a) Não significa nada, já que ela está consciente e conversando",
      "b) É um sinal de alerta de possível lesão interna, mesmo parecendo bem — acione o SAMU 192",
      "c) Só é preocupante se vomitar mais de 3 vezes",
    ],
    cor: "6",
  },

  // ══════════════════════════════════════════════════════════════════
  // MÓDULO 7 — Sangramentos, queimaduras e choque elétrico (8 min)
  // ══════════════════════════════════════════════════════════════════
  {
    kind: "titulo-modulo",
    modulo: 7,
    numero: 7,
    titulo: "Sangramentos, queimaduras e choque elétrico",
    tempo: "8 minutos",
    cor: "7",
  },
  {
    kind: "conteudo",
    modulo: 7,
    titulo: "Módulo 7 — Sangramentos: como controlar até a chegada do socorro",
    corpo: (
      <div className="space-y-3 text-sm">
        <ol className="space-y-3">
          <li className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 font-bold text-xs">1</span>
            <span><strong>Aplique pressão direta e firme</strong> sobre o ferimento com um pano limpo ou gaze.</span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 font-bold text-xs">2</span>
            <span>Se o pano encharcar, <strong>coloque outro por cima sem retirar o primeiro</strong>.</span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 font-bold text-xs">3</span>
            <span>Eleve o membro afetado, se possível, e mantenha a pressão até a chegada do socorro.</span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 font-bold text-xs">4</span>
            <span>Afira pulso e respiração — sangramentos intensos podem causar queda de pressão.</span>
          </li>
        </ol>
        <div className="rounded-lg border-l-4 border-yellow-400 bg-yellow-900/40 p-3">
          <p className="font-bold text-yellow-300">Torniquete:</p>
          <p className="mt-1">Apenas se a pressão direta não for suficiente para conter sangramento grave em braço ou perna. Aplique <strong>acima do ferimento</strong>, anote o horário e <strong>não afrouxe por conta própria</strong>.</p>
        </div>
      </div>
    ),
    imagemUrl: "https://images.unsplash.com/photo-1584432810601-6c7f27d2362b?w=900&q=80",
    imagemAlt: "Aplicação de pressão direta com gaze em ferimento no braço",
    imagemCredit: "Unsplash",
    cor: "7",
  },
  {
    kind: "conteudo",
    modulo: 7,
    titulo: "Módulo 7 — Queimaduras: o que fazer (e o que jamais fazer)",
    corpo: (
      <div className="space-y-3 text-sm">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-green-500 bg-green-900/40 p-3">
            <p className="font-bold text-green-300 mb-2">✅ Faça:</p>
            <ul className="space-y-1">
              <li>• Resfrie com <strong>água corrente em temperatura ambiente</strong> (nunca gelada ou com gelo direto) por <strong>10 a 20 minutos</strong></li>
              <li>• Retire roupas e joias da área antes que inche, sem puxar pele aderida</li>
              <li>• Cubra com um pano limpo e úmido</li>
            </ul>
          </div>
          <div className="rounded-lg border border-red-500 bg-red-900/40 p-3">
            <p className="font-bold text-red-300 mb-2">❌ Não faça:</p>
            <ul className="space-y-1">
              <li>• Não estoure bolhas</li>
              <li>• Não aplique pasta de dente, manteiga ou outros produtos caseiros</li>
              <li>• Não use gelo ou água gelada direto na pele</li>
            </ul>
          </div>
        </div>
        <div className="rounded-lg border-l-4 border-red-400 bg-red-900/40 p-3">
          <p className="font-bold text-red-300">Acione o SAMU 192 se a queimadura for:</p>
          <p className="mt-1">Extensa, profunda, no rosto, mãos ou por eletricidade.</p>
        </div>
      </div>
    ),
    imagemUrl: "https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=900&q=80",
    imagemAlt: "Queimadura sendo resfriada com água corrente em temperatura ambiente",
    imagemCredit: "Unsplash",
    cor: "7",
  },
  {
    kind: "conteudo",
    modulo: 7,
    titulo: "Módulo 7 — Choque elétrico: segurança antes de qualquer contato",
    corpo: (
      <div className="space-y-3 text-sm">
        <div className="rounded-lg border border-red-500 bg-red-900/40 p-4">
          <p className="font-bold text-red-300 text-base mb-2">⚡ ANTES de tocar a vítima:</p>
          <p><strong>Desligue a energia no quadro geral.</strong></p>
          <p className="mt-2">Se não for possível, afaste a vítima da fonte usando um material <strong>isolante seco</strong> (cabo de vassoura, tapete de borracha).</p>
          <p className="mt-1 font-bold text-red-300">Nunca com as mãos desprotegidas, objetos metálicos ou molhados.</p>
        </div>
        <ul className="space-y-2">
          <li className="flex gap-2"><span className="text-emerald-400">✅</span> Garantida a segurança: avalie resposta e respiração da vítima</li>
          <li className="flex gap-2"><span className="text-emerald-400">✅</span> Inicie a RCP (Módulo 3) se necessário</li>
          <li className="flex gap-2"><span className="text-emerald-400">✅</span> Resfrie queimaduras visíveis com água corrente</li>
          <li className="flex gap-2"><span className="text-yellow-400">⚠️</span> <strong>Acione o SAMU 192 sempre</strong>, mesmo que a pessoa pareça bem — lesões internas por choque elétrico podem não ser visíveis</li>
        </ul>
      </div>
    ),
    imagemUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=80",
    imagemAlt: "Caixa de disjuntores elétricos — desligamento de emergência",
    imagemCredit: "Unsplash",
    cor: "7",
  },
  {
    kind: "quiz",
    modulo: 7,
    situacao:
      "Uma residente se queima levemente no fogão da copa. O que fazer primeiro?",
    opcoes: [
      "a) Passar manteiga ou pasta de dente na queimadura",
      "b) Resfriar a área com água corrente em temperatura ambiente por 10 a 20 minutos",
      "c) Estourar a bolha que se formou, para aliviar a pressão",
    ],
    cor: "7",
  },
  {
    kind: "resposta",
    modulo: 7,
    correta: "b",
    justificativa:
      "Água corrente em temperatura ambiente por 10 a 20 minutos é o único procedimento correto. Manteiga, pasta de dente e outros produtos caseiros retêm calor e aumentam o risco de infecção. Bolhas nunca devem ser estouradas.",
    opcoes: [
      "a) Passar manteiga ou pasta de dente na queimadura",
      "b) Resfriar a área com água corrente em temperatura ambiente por 10 a 20 minutos",
      "c) Estourar a bolha que se formou, para aliviar a pressão",
    ],
    cor: "7",
  },

  // ══════════════════════════════════════════════════════════════════
  // REFERÊNCIAS
  // ══════════════════════════════════════════════════════════════════
  {
    kind: "referencias",
    modulo: 99,
  },
];

// ─── Sub-componentes de slide ─────────────────────────────────────────────────

function CapaGeral() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 text-center">
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-widest text-red-400">
          Residência Inclusiva — Treinamento em Saúde
        </p>
        <h1 className="text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl">
          Primeiros Socorros
        </h1>
        <p className="text-xl font-light text-slate-300 md:text-2xl">
          para Cuidadoras
        </p>
      </div>
      <div className="h-px w-24 bg-red-500" />
      <div className="space-y-2 text-slate-400">
        <p className="text-sm">Duração total: <strong className="text-white">1 hora</strong></p>
        <p className="text-sm">7 módulos de conteúdo prático</p>
      </div>
      <div className="grid grid-cols-2 gap-3 text-left text-xs text-slate-400 md:grid-cols-4">
        {[
          "Segurança da cena",
          "Engasgo / OVACE",
          "PCR e RCP",
          "Emergências clínicas",
          "Convulsões",
          "Quedas e trauma",
          "Sangramentos e queimaduras",
        ].map((m, i) => (
          <div key={m} className="rounded-md bg-white/5 px-3 py-2">
            <span className="font-bold text-slate-500">M{i + 1}</span>
            <br />
            {m}
          </div>
        ))}
      </div>
      <p className="max-w-md text-xs text-slate-500">
        Conteúdo baseado em fontes oficiais: SAMU 192, AHA 2025, Liga Brasileira de Epilepsia, ASBAI e outros.
        Voltado para a prática — sem jargão médico desnecessário.
      </p>
    </div>
  );
}

function TituloModuloCard({ slide }: { slide: TituloModuloSlide }) {
  const cor = CORES[slide.modulo ?? 1];
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
      <div
        className={`flex h-20 w-20 items-center justify-center rounded-full border-4 ${cor.borda} bg-white/10 text-4xl font-bold text-white`}
      >
        {slide.numero}
      </div>
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-widest text-white/60">
          Módulo {slide.numero}
        </p>
        <h2 className="text-3xl font-bold text-white md:text-4xl">{slide.titulo}</h2>
      </div>
      <div className={`rounded-full px-4 py-1 ${cor.destaque} text-sm font-medium text-white`}>
        ⏱ {slide.tempo}
      </div>
    </div>
  );
}

function ConteudoCard({ slide }: { slide: ConteudoSlide }) {
  const hasFoto = Boolean(slide.imagemUrl);
  return (
    <div className={`flex h-full flex-col gap-0 ${hasFoto ? "md:flex-row" : ""}`}>
      {/* Conteúdo */}
      <div className={`flex flex-col justify-center gap-4 p-8 ${hasFoto ? "md:w-3/5" : "w-full"}`}>
        <h2 className="text-xl font-bold leading-snug text-white md:text-2xl">{slide.titulo}</h2>
        <div className="text-sm leading-relaxed text-white/90 md:text-base">{slide.corpo}</div>
      </div>
      {/* Imagem */}
      {hasFoto && (
        <div className="relative flex-1 overflow-hidden md:w-2/5">
          <img
            src={slide.imagemUrl}
            alt={slide.imagemAlt ?? ""}
            className="h-full w-full object-cover opacity-80"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-current/40 to-transparent" />
          {slide.imagemCredit && (
            <p className="absolute bottom-2 right-2 text-xs text-white/40">{slide.imagemCredit}</p>
          )}
        </div>
      )}
    </div>
  );
}

function VideoCard({ slide }: { slide: VideoSlide }) {
  const cor = CORES[slide.modulo ?? 1];
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 text-center px-8">
      <div className={`flex h-16 w-16 items-center justify-center rounded-full ${cor.destaque}`}>
        <Youtube className="h-8 w-8 text-white" />
      </div>
      <h2 className="text-2xl font-bold text-white">{slide.titulo}</h2>
      <p className="max-w-lg text-sm text-white/70">{slide.descricao}</p>
      <div className="rounded-xl border border-white/20 bg-white/10 p-6 max-w-xl w-full">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/50">
          ▸ Pause a apresentação e acesse o link abaixo
        </p>
        <a
          href={slide.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`block break-all rounded-lg ${cor.destaque} px-4 py-3 font-mono text-sm text-white transition hover:opacity-90`}
        >
          {slide.url}
        </a>
        <p className="mt-3 text-xs text-white/40">
          ⚠️ Confirme que o vídeo está em português do Brasil antes de exibir à turma.
        </p>
      </div>
    </div>
  );
}

function QuizCard({ slide }: { slide: QuizSlide; onNext: () => void }) {
  const cor = CORES[slide.modulo ?? 1];
  return (
    <div className="flex h-full flex-col justify-center gap-6 px-8">
      <div className="space-y-2">
        <p className={`text-xs font-bold uppercase tracking-widest ${cor.destaque} rounded px-2 py-1 inline-block`}>
          Situação da Residência
        </p>
        <h2 className="text-xl font-bold text-white md:text-2xl">{slide.situacao}</h2>
      </div>
      <div className="space-y-3">
        {slide.opcoes.map((opcao) => (
          <div
            key={opcao}
            className="rounded-xl border border-white/20 bg-white/10 px-5 py-4 text-sm text-white md:text-base"
          >
            {opcao}
          </div>
        ))}
      </div>
      <p className="text-xs text-white/40 text-center">
        → Discuta com a turma e avance para ver a resposta
      </p>
    </div>
  );
}

function RespostaCard({ slide }: { slide: RespostaSlide }) {
  const cor = CORES[slide.modulo ?? 1];
  const letras = ["a", "b", "c"] as const;

  return (
    <div className="flex h-full flex-col justify-center gap-6 px-8">
      <div className="space-y-2">
        <p className={`text-xs font-bold uppercase tracking-widest ${cor.destaque} rounded px-2 py-1 inline-block`}>
          Resposta correta
        </p>
        <h2 className="text-xl font-bold text-white md:text-2xl">Resposta: opção {slide.correta.toUpperCase()}</h2>
      </div>
      <div className="space-y-3">
        {slide.opcoes.map((opcao, i) => {
          const letra = letras[i];
          const isCorreta = letra === slide.correta;
          return (
            <div
              key={opcao}
              className={`flex items-start gap-3 rounded-xl border px-5 py-4 text-sm md:text-base ${
                isCorreta
                  ? "border-green-400 bg-green-900/50 text-green-200"
                  : "border-white/10 bg-white/5 text-white/40"
              }`}
            >
              {isCorreta ? (
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-400" />
              ) : (
                <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-white/20" />
              )}
              {opcao}
            </div>
          );
        })}
      </div>
      <div className={`rounded-xl border ${cor.borda} bg-white/5 p-4 text-sm text-white/80`}>
        <p className="font-semibold text-white mb-1">Justificativa:</p>
        {slide.justificativa}
      </div>
    </div>
  );
}

const REFERENCIAS = [
  "Manual de Primeiros Socorros para Leigos — SAMU-192 São Paulo, Secretaria Municipal de Saúde (2022)",
  "SAMU Ceará — página oficial de primeiros socorros",
  "Cartilha de Noções de Primeiros Socorros e Principais Emergências — UFRRJ (2020)",
  "Boehringer Ingelheim Brasil — Como agir em caso de infarto",
  "Doctoralia — Sintomas de AVC e infarto e o que fazer",
  "Sanarmed — Atualização AHA 2025: manejo da obstrução de via aérea por corpo estranho",
  "CNN Brasil — Desengasgo: diretrizes atualizam manobras para socorrer crianças e adultos (2025)",
  "Agência Brasil / APM / Hospital Paulista — Novas diretrizes de desengasgo (2025)",
  "G1/Bem Estar — Manobra de Heimlich (vídeo, com Dr. Sérgio Timerman)",
  "Manuais MSD, edição para profissionais — Reanimação cardiopulmonar em adultos",
  "Sanarmed — Sequência da RCP e atualizações das diretrizes",
  "HCFMUSP — Manobra de RCP",
  "22Brasil Socorristas — Protocolos de RCP",
  "Posição Lateral de Segurança (PLS) — Cidesp, Escola Educação, Desfibrilhador DOC",
  "Artmed / Enfermagem de Sucesso — Aferição de sinais vitais",
  "Tua Saúde — Primeiros socorros para diabéticos, hipoglicemia e hiperglicemia",
  "Sociedade Brasileira de Diabetes — Cetoacidose diabética",
  "Sanarmed — Emergências hiperglicêmicas",
  "ASBAI (Associação Brasileira de Alergia e Imunologia) — Como agir na anafilaxia",
  "Liga Brasileira de Epilepsia — Protocolo CALMA (via Tribuna do Sertão, 2026)",
  "Hospital Einstein — O que fazer depois de uma pancada na cabeça (adulto)",
  "Tua Saúde — O que fazer depois de uma queda (adulto)",
  "Global First Aid Centre — Sangramento grave",
  "ISC Treinamentos / Doutor Salva / Clínica Mon Petit — Queimaduras e choque elétrico",
];

function ReferenciasCard() {
  return (
    <div className="flex h-full flex-col gap-5 px-8 py-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
          Fontes e Referências
        </p>
        <h2 className="text-2xl font-bold text-white">
          Base bibliográfica deste treinamento
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Todo o conteúdo foi parafraseado a partir das fontes abaixo — nenhuma reprodução literal de trechos protegidos por direitos autorais.
        </p>
      </div>
      <ol className="flex-1 grid grid-cols-1 gap-1 overflow-auto text-xs text-slate-300 md:grid-cols-2">
        {REFERENCIAS.map((ref, i) => (
          <li key={ref} className="flex gap-2 rounded bg-white/5 px-3 py-2">
            <span className="shrink-0 font-bold text-slate-500">{i + 1}.</span>
            {ref}
          </li>
        ))}
      </ol>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function PrimeirosSocorrosSlides() {
  const [atual, setAtual] = useState(0);
  const total = SLIDES.length;
  const slide = SLIDES[atual];
  const moduloAtual = slide.modulo ?? 0;
  const cor = CORES[moduloAtual] ?? CORES[0];

  const anterior = useCallback(() => setAtual((a) => Math.max(0, a - 1)), []);
  const proximo = useCallback(() => setAtual((a) => Math.min(total - 1, a + 1)), [total]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        proximo();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        anterior();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [anterior, proximo]);

  return (
    <div
      className={`flex min-h-screen flex-col bg-gradient-to-br ${cor.fundo} transition-all duration-500`}
    >
      {/* Área do slide */}
      <div className="flex flex-1 flex-col">
        <div className="flex-1 overflow-hidden">
          {slide.kind === "capa-geral" && <CapaGeral />}
          {slide.kind === "titulo-modulo" && <TituloModuloCard slide={slide as TituloModuloSlide} />}
          {slide.kind === "conteudo" && <ConteudoCard slide={slide as ConteudoSlide} />}
          {slide.kind === "video" && <VideoCard slide={slide as VideoSlide} />}
          {slide.kind === "quiz" && (
            <QuizCard slide={slide as QuizSlide} onNext={proximo} />
          )}
          {slide.kind === "resposta" && <RespostaCard slide={slide as RespostaSlide} />}
          {slide.kind === "referencias" && <ReferenciasCard />}
        </div>
      </div>

      {/* Controles de navegação — rodapé fixo */}
      <div className="flex items-center justify-between border-t border-white/10 bg-black/30 px-6 py-3 backdrop-blur">
        <button
          onClick={anterior}
          disabled={atual === 0}
          className="flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </button>

        <div className="flex items-center gap-3 text-xs text-white/40">
          <span>
            {atual + 1} / {total}
          </span>
          {moduloAtual > 0 && moduloAtual < 99 && (
            <span className={`rounded px-2 py-0.5 text-xs font-medium text-white ${cor.destaque}`}>
              Módulo {moduloAtual}
            </span>
          )}
          <span className="hidden text-white/25 md:inline">
            ← → para navegar
          </span>
        </div>

        <button
          onClick={proximo}
          disabled={atual === total - 1}
          className="flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Próximo
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
