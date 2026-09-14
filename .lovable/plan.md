## Reestruturação FarmaLar — plano

Vou reorganizar o sistema para que **a residente vire o centro de tudo**. Hoje você abre 3 abas pra ver o quadro de uma paciente; depois dessa mudança, você clica no nome dela e vê tudo numa tela só, com um formulário de entrada rápido de 4 campos.

### 1. Aba **Residentes** vira o painel principal
- Cada card mostra: nome, avatar com iniciais, local de retirada, quantidade de medicações contínuas e **um badge de status calculado automaticamente**:
  - 🔴 receita vencida
  - 🟠 retirar em X dias (≤7)
  - 🟡 renovar em X dias (≤30)
  - 🟢 tudo em dia
- Clicar no card abre a nova tela de perfil.

### 2. Nova tela **Perfil da residente** (`/residentes/$id`) — tudo numa página só
- **Cabeçalho**: nome, avatar, local de retirada, botão "+ Lançar entrada".
- **Seção Receitas ativas**: uma linha por receita com medicamentos cobertos, emissão, data limite de retirada (emissão + 30d, ou até 180d nas renováveis), data de renovação (emissão + 60d, editável), badge colorido de prazo e checkbox "✓ Retirada realizada" que registra a data e recalcula a próxima.
- **Seção Estoque por medicamento**: lista das medicações contínuas dela, com quantidade atual, consumo/dia, **dias restantes** calculados, badge (🔴 ≤7 / 🟠 8–15 / 🟢 >15) e botão "+ Entrada" ao lado de cada uma.
- **Formulário rápido inline** (aparece logo abaixo do medicamento clicado, sem modal): só 4 campos editáveis — Lote, Validade do lote, Quantidade recebida, Origem (pré-preenchida da receita). Medicamento e residente já vêm bloqueados. Se for controlado, o lançamento também alimenta automaticamente o livro de controlados.

### 3. Aba **Medicações** vira aba de consulta
- Mantenho a tabela atual (todos os lotes, validades, agrupada por medicamento).
- Adiciono **filtro por residente**.
- Removo o botão "Lançar entrada" daqui (a entrada principal passa a ser feita pelo perfil da residente).

### 4. Aba **Compra/Retirada** — removida
- Some da aba Medicações. Toda essa informação vive agora no perfil de cada residente.

### 5. **Dashboard** reorganizado em 3 blocos
- **Bloco 1 — Urgências** (vermelho): receitas vencidas + estoque crítico (≤7d), cada item com link direto pro perfil da residente.
- **Bloco 2 — Atenção 15 dias** (laranja): retiradas vencendo em 1–15d, renovações em 1–30d, estoque 8–15d.
- **Bloco 3 — Resumo geral**: total de residentes, medicações contínuas em gestão, receitas OK.
- Mantenho o painel Haldol injetável e o alerta SAD da Rosilda que já existiam.

### O que NÃO mexo
- Cadastro de medicamentos (campos, lotes, controlados) — igual.
- Livro de registro de controlados (Portaria 344/98) — igual.
- Autenticação, permissões, Insumos, Consultas e Exames, Farmacologia — igual.
- Paleta verde-escuro + branco — igual.
- Nada do que você já lançou é apagado.

### Ordem de entrega (como você pediu)
1. Perfil da residente com Seções A, B e C.
2. Formulário inline de entrada rápida (Seção D).
3. Dashboard reorganizado.
4. Remoção da aba Compra/Retirada.
5. Aba Medicações em modo consulta + filtro por residente.

---

### Detalhes técnicos (pra referência, pode pular)
- Nova rota `src/routes/residentes.$id.tsx` com as seções A–D; card da lista em `residentes.tsx` passa a linkar pra ela.
- Cálculos centralizados num helper `src/lib/status-residente.ts` (badge do card, dias de estoque, dias de receita).
- Reaproveito `receitas-store` (retirada / próxima retirada já existem), `estoque-store` (lotes) e `salvar-receita` (arquivamento).
- `estoque.tsx`: remove a aba Compra/Retirada, adiciona `<Select>` de filtro por residente, esconde o botão "Lançar entrada" do topo.
- `index.tsx`: reescrevo a montagem dos blocos usando o mesmo helper de status pra garantir consistência com o perfil.
- Sem migração de banco — as tabelas atuais já têm todos os campos necessários.

Posso começar pela etapa 1 (perfil da residente)?
