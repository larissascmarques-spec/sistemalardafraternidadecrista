-- ESQUEMA COMPLETO DO BANCO DE DADOS FARMALAR
-- Copie e cole este script no SQL Editor do seu projeto Supabase no dashboard (https://app.supabase.com)
-- Execute este script completo para criar toda a estrutura necessária

-- ==========================================
-- REMOVER TABELAS EXISTENTES (ordem respeita foreign keys)
-- ==========================================
DROP TABLE IF EXISTS public.procedimentos CASCADE;
DROP TABLE IF EXISTS public.agendamentos CASCADE;
DROP TABLE IF EXISTS public.insumos CASCADE;
DROP TABLE IF EXISTS public.estoque CASCADE;
DROP TABLE IF EXISTS public.receitas CASCADE;
DROP TABLE IF EXISTS public.residentes CASCADE;

-- ==========================================
-- Função utilitária para atualizar updated_at
-- ==========================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ==========================================
-- TABELA: RESIDENTES
-- ==========================================
CREATE TABLE IF NOT EXISTS public.residentes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  codigo TEXT,
  nome TEXT NOT NULL,
  data_nascimento DATE,
  diagnosticos TEXT[] NOT NULL DEFAULT '{}',
  alergias TEXT[] NOT NULL DEFAULT '{}',
  responsavel TEXT,
  medico TEXT,
  ubs TEXT,
  observacoes TEXT,
  a_revisar BOOLEAN NOT NULL DEFAULT false,
  dependencia TEXT,
  mobilidade TEXT,
  dieta TEXT,
  alertas TEXT[] NOT NULL DEFAULT '{}',
  haldol_injetavel JSONB,
  extras JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.residentes TO authenticated;
GRANT ALL ON public.residentes TO service_role;

ALTER TABLE public.residentes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário gerencia seus próprios residentes"
  ON public.residentes
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER residentes_updated_at
  BEFORE UPDATE ON public.residentes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS residentes_user_id_idx ON public.residentes(user_id);

-- ==========================================
-- TABELA: RECEITAS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.receitas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  residente_id TEXT NOT NULL,
  codigo TEXT,
  medicacao TEXT NOT NULL,
  dosagem TEXT,
  tipo TEXT,
  data_emissao DATE,
  validade_dias INTEGER NOT NULL DEFAULT 30,
  vencimento DATE,
  medico TEXT,
  origem TEXT,
  arquivo TEXT,
  arquivada_em TIMESTAMPTZ,
  substituida_por UUID REFERENCES public.receitas(id) ON DELETE SET NULL,
  dados JSONB NOT NULL DEFAULT '{}'::jsonb,
  lista TEXT NOT NULL DEFAULT 'ativa',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.receitas TO authenticated;
GRANT ALL ON public.receitas TO service_role;

ALTER TABLE public.receitas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário gerencia suas próprias receitas"
  ON public.receitas
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER receitas_updated_at
  BEFORE UPDATE ON public.receitas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS receitas_user_id_idx ON public.receitas(user_id);
CREATE INDEX IF NOT EXISTS receitas_residente_id_idx ON public.receitas(residente_id);
CREATE INDEX IF NOT EXISTS receitas_user_lista_idx ON public.receitas (user_id, lista);

-- ==========================================
-- TABELA: ESTOQUE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.estoque (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  codigo text,
  medicacao text NOT NULL,
  apresentacao text,
  lote text,
  validade date,
  quantidade numeric NOT NULL DEFAULT 0,
  estoque_minimo integer NOT NULL DEFAULT 0,
  consumo_diario numeric NOT NULL DEFAULT 0,
  origem text,
  local text,
  pacientes_uso jsonb NOT NULL DEFAULT '[]'::jsonb,
  proxima_compra date,
  observacao text,
  tipo_uso text NOT NULL DEFAULT 'continua',
  lancado_em date,
  ultima_baixa date,
  ultima_retirada date,
  proxima_retirada date,
  unidade text NOT NULL DEFAULT 'unidade',
  gotas_por_ml numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.estoque TO authenticated;
GRANT ALL ON public.estoque TO service_role;

ALTER TABLE public.estoque ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário gerencia seu próprio estoque" ON public.estoque
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER estoque_updated_at BEFORE UPDATE ON public.estoque
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- TABELA: INSUMOS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.insumos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  codigo text,
  nome text NOT NULL,
  categoria text,
  apresentacao text,
  lote text,
  validade date,
  quantidade integer NOT NULL DEFAULT 0,
  estoque_minimo integer NOT NULL DEFAULT 0,
  consumo_diario numeric NOT NULL DEFAULT 0,
  origem text,
  local text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.insumos TO authenticated;
GRANT ALL ON public.insumos TO service_role;

ALTER TABLE public.insumos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário gerencia seus próprios insumos" ON public.insumos
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER insumos_updated_at BEFORE UPDATE ON public.insumos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- TABELA: AGENDAMENTOS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.agendamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  residente_id text NOT NULL,
  tipo text NOT NULL,
  descricao text NOT NULL,
  data date NOT NULL,
  hora text,
  local text,
  medico text,
  observacoes text,
  realizado boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'Agendada',
  motivo text,
  especialidade text,
  resultado_data date,
  resultado_retirado boolean NOT NULL DEFAULT false,
  resultado_retirado_em date,
  realizado_em DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.agendamentos TO authenticated;
GRANT ALL ON public.agendamentos TO service_role;

ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário gerencia seus próprios agendamentos" ON public.agendamentos
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER agendamentos_updated_at BEFORE UPDATE ON public.agendamentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- TABELA: PROCEDIMENTOS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.procedimentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data date NOT NULL DEFAULT CURRENT_DATE,
  hora text,
  residente_id text,
  categoria text NOT NULL,
  descricao text,
  desfecho text NOT NULL DEFAULT 'resolvido_local',
  destino text,
  profissional text,
  observacoes text,
  valores jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.procedimentos TO authenticated;
GRANT ALL ON public.procedimentos TO service_role;

ALTER TABLE public.procedimentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário gerencia seus próprios registros de enfermagem"
ON public.procedimentos FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS procedimentos_user_data_idx ON public.procedimentos (user_id, data);

CREATE TRIGGER procedimentos_updated_at
BEFORE UPDATE ON public.procedimentos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- REVOGAR ACESSO ANÔNIMO (defesa em camadas)
-- ==========================================
REVOKE ALL ON public.residentes FROM anon;
REVOKE ALL ON public.receitas FROM anon;
REVOKE ALL ON public.estoque FROM anon;
REVOKE ALL ON public.insumos FROM anon;
REVOKE ALL ON public.agendamentos FROM anon;
REVOKE ALL ON public.procedimentos FROM anon;

-- ==========================================
-- GARANTIR PERMISSÕES EXPLÍCITAS PARA AUTHENTICATED
-- ==========================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.residentes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.receitas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.estoque TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.insumos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agendamentos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.procedimentos TO authenticated;

GRANT ALL ON public.residentes TO service_role;
GRANT ALL ON public.receitas TO service_role;
GRANT ALL ON public.estoque TO service_role;
GRANT ALL ON public.insumos TO service_role;
GRANT ALL ON public.agendamentos TO service_role;
GRANT ALL ON public.procedimentos TO service_role;