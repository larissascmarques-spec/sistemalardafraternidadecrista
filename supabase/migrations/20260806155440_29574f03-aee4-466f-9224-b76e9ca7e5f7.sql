ALTER TABLE public.estoque
  ADD COLUMN IF NOT EXISTS unidade text NOT NULL DEFAULT 'unidade',
  ADD COLUMN IF NOT EXISTS gotas_por_ml numeric;
ALTER TABLE public.estoque ALTER COLUMN quantidade TYPE numeric;