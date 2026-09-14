ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS ultima_baixa date;
UPDATE public.estoque SET ultima_baixa = COALESCE(lancado_em, CURRENT_DATE) WHERE ultima_baixa IS NULL;