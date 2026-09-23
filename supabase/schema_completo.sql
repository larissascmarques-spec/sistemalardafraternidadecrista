-- ESQUEMA COMPLETO DO BANCO DE DADOS FARMALAR
-- Copie e cole este script no SQL Editor do seu projeto Supabase no dashboard (https://app.supabase.com)

-- ==========================================
-- Migration: 20260610220413_afc38212-fee6-4f23-b25b-e884821f92a1.sql
-- ==========================================


-- Função utilitária para atualizar updated_at
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

-- ============ RESIDENTES ============
CREATE TABLE public.residentes (
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

CREATE INDEX residentes_user_id_idx ON public.residentes(user_id);

-- ============ RECEITAS ============
CREATE TABLE public.receitas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  residente_id UUID NOT NULL REFERENCES public.residentes(id) ON DELETE CASCADE,
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

CREATE INDEX receitas_user_id_idx ON public.receitas(user_id);
CREATE INDEX receitas_residente_id_idx ON public.receitas(residente_id);


-- ==========================================
-- Migration: 20260619133453_92e6f7d8-5c65-4a67-ae01-c15019edcbdf.sql
-- ==========================================


-- ESTOQUE
CREATE TABLE public.estoque (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  codigo text,
  medicacao text NOT NULL,
  apresentacao text,
  lote text,
  validade date,
  quantidade integer NOT NULL DEFAULT 0,
  estoque_minimo integer NOT NULL DEFAULT 0,
  consumo_diario numeric NOT NULL DEFAULT 0,
  origem text,
  local text,
  pacientes_uso jsonb NOT NULL DEFAULT '[]'::jsonb,
  proxima_compra date,
  observacao text,
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

-- INSUMOS
CREATE TABLE public.insumos (
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

-- Campos de unidade e data de lançamento (migration 20260923000000)
ALTER TABLE public.insumos
  ADD COLUMN IF NOT EXISTS unidade text NOT NULL DEFAULT 'unidade',
  ADD COLUMN IF NOT EXISTS lancado_em date;

-- AGENDAMENTOS
CREATE TABLE public.agendamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  residente_id uuid NOT NULL,
  tipo text NOT NULL,
  descricao text NOT NULL,
  data date NOT NULL,
  hora text,
  local text,
  medico text,
  observacoes text,
  realizado boolean NOT NULL DEFAULT false,
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

-- Campos novos da ficha do residente (também ficavam só no navegador)
ALTER TABLE public.residentes
  ADD COLUMN IF NOT EXISTS dependencia text,
  ADD COLUMN IF NOT EXISTS mobilidade text,
  ADD COLUMN IF NOT EXISTS dieta text,
  ADD COLUMN IF NOT EXISTS alertas text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS haldol_injetavel jsonb;


-- ==========================================
-- Migration: 20260622125301_c240881c-2b81-40f7-b712-c8377ea19a87.sql
-- ==========================================

ALTER TABLE public.estoque
  ADD COLUMN IF NOT EXISTS tipo_uso text NOT NULL DEFAULT 'continua',
  ADD COLUMN IF NOT EXISTS lancado_em date;

UPDATE public.estoque SET lancado_em = COALESCE(lancado_em, created_at::date);

-- ==========================================
-- Migration: 20260623104819_3888b33e-43c3-47e2-ac0b-9885b9fb8353.sql
-- ==========================================

-- Defesa em camadas: revogar acesso anônimo e garantir permissões explícitas
REVOKE ALL ON public.residentes FROM anon;
REVOKE ALL ON public.receitas FROM anon;
REVOKE ALL ON public.estoque FROM anon;
REVOKE ALL ON public.insumos FROM anon;
REVOKE ALL ON public.agendamentos FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.residentes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.receitas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.estoque TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.insumos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agendamentos TO authenticated;

GRANT ALL ON public.residentes TO service_role;
GRANT ALL ON public.receitas TO service_role;
GRANT ALL ON public.estoque TO service_role;
GRANT ALL ON public.insumos TO service_role;
GRANT ALL ON public.agendamentos TO service_role;

-- ==========================================
-- Migration: 20260624121303_5b635678-1c8d-4fb0-a5ed-ec709e3ea4a3.sql
-- ==========================================

ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS ultima_baixa date;
UPDATE public.estoque SET ultima_baixa = COALESCE(lancado_em, CURRENT_DATE) WHERE ultima_baixa IS NULL;

-- ==========================================
-- Migration: 20260625111014_1c68148d-1983-466c-9530-33c9a948f33c.sql
-- ==========================================

ALTER TABLE public.agendamentos
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'Agendada',
  ADD COLUMN IF NOT EXISTS motivo text,
  ADD COLUMN IF NOT EXISTS especialidade text;

-- ==========================================
-- Migration: 20260629125836_d197fb5e-4afa-426b-a436-7811149ce32c.sql
-- ==========================================

ALTER TABLE public.receitas DROP CONSTRAINT IF EXISTS receitas_residente_id_fkey;
ALTER TABLE public.receitas ALTER COLUMN residente_id TYPE text USING residente_id::text;
ALTER TABLE public.agendamentos ALTER COLUMN residente_id TYPE text USING residente_id::text;

-- ==========================================
-- Migration: 20260701114347_097d0117-75f0-4149-a146-7aa2e1720946.sql
-- ==========================================

ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS ultima_retirada date; ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS proxima_retirada date;

-- ==========================================
-- Migration: 20260721122801_9c0acff9-9728-4e56-9f57-358dbc42247a.sql
-- ==========================================


ALTER TABLE public.agendamentos
  ADD COLUMN IF NOT EXISTS resultado_data date,
  ADD COLUMN IF NOT EXISTS resultado_retirado boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS resultado_retirado_em date;


-- ==========================================
-- Migration: 20260722143705_95fd54cc-a68a-467b-b3fa-734686ef156f.sql
-- ==========================================

ALTER TABLE public.agendamentos ADD COLUMN IF NOT EXISTS realizado_em DATE;

-- ==========================================
-- Migration: 20260727125709_dd92f21c-0a42-4889-98b3-f95d291db32b.sql
-- ==========================================

ALTER TABLE public.residentes
  ADD COLUMN IF NOT EXISTS extras jsonb NOT NULL DEFAULT '{}'::jsonb;

-- ==========================================
-- Migration: 20260729101251_afd70b01-0d96-4332-8f35-c2fbe50d2d0c.sql
-- ==========================================

UPDATE public.estoque SET user_id = '255d05d4-83b9-4042-8355-2d66dfbe09f5' WHERE user_id = '68602d00-d468-4032-b588-5d697f05b465';
UPDATE public.agendamentos SET user_id = '255d05d4-83b9-4042-8355-2d66dfbe09f5' WHERE user_id = '68602d00-d468-4032-b588-5d697f05b465';

-- ==========================================
-- Migration: 20260805143055_070c6030-eb70-4e7e-a18b-491051ed78c8.sql
-- ==========================================

update public.estoque
set pacientes_uso = '[{"residenteId":"RU007","qtdDia":1}]'::jsonb,
    consumo_diario = 1
where id = '52c46971-4050-4975-9fe4-960781429133';

-- ==========================================
-- Migration: 20260806155440_29574f03-aee4-466f-9224-b76e9ca7e5f7.sql
-- ==========================================

ALTER TABLE public.estoque
  ADD COLUMN IF NOT EXISTS unidade text NOT NULL DEFAULT 'unidade',
  ADD COLUMN IF NOT EXISTS gotas_por_ml numeric;
ALTER TABLE public.estoque ALTER COLUMN quantidade TYPE numeric;

-- ==========================================
-- Migration: 20260810102248_217b81f9-d237-423d-b63a-9ea009a318c6.sql
-- ==========================================

DELETE FROM public.agendamentos a USING public.agendamentos b WHERE a.ctid > b.ctid AND a.user_id = b.user_id AND a.residente_id = b.residente_id AND a.descricao = b.descricao AND a.data = b.data AND coalesce(a.hora,'') = coalesce(b.hora,'') AND a.tipo = b.tipo;

-- ==========================================
-- Migration: 20260814104206_d8afe778-7f4f-4d70-b1b6-ac8cf97b29a1.sql
-- ==========================================

CREATE TABLE public.procedimentos (
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

CREATE INDEX procedimentos_user_data_idx ON public.procedimentos (user_id, data);

CREATE TRIGGER procedimentos_updated_at
BEFORE UPDATE ON public.procedimentos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- Migration: 20260819121956_632fedd7-d65f-48f6-8ed6-bd96c3ad7a83.sql
-- ==========================================

ALTER TABLE public.receitas
  ADD COLUMN IF NOT EXISTS dados jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS lista text NOT NULL DEFAULT 'ativa';

CREATE INDEX IF NOT EXISTS receitas_user_lista_idx ON public.receitas (user_id, lista);

