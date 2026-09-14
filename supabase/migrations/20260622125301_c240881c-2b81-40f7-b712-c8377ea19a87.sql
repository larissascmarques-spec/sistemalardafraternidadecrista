ALTER TABLE public.estoque
  ADD COLUMN IF NOT EXISTS tipo_uso text NOT NULL DEFAULT 'continua',
  ADD COLUMN IF NOT EXISTS lancado_em date;

UPDATE public.estoque SET lancado_em = COALESCE(lancado_em, created_at::date);