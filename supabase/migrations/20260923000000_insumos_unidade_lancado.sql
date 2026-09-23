-- Adiciona unidade e data de lançamento aos insumos.
ALTER TABLE public.insumos
  ADD COLUMN IF NOT EXISTS unidade text NOT NULL DEFAULT 'unidade',
  ADD COLUMN IF NOT EXISTS lancado_em date;

UPDATE public.insumos SET lancado_em = COALESCE(lancado_em, created_at::date);