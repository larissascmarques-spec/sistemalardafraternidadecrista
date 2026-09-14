
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
