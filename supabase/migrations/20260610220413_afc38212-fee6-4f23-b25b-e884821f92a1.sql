
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
