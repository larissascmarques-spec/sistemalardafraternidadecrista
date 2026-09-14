ALTER TABLE public.receitas
  ADD COLUMN IF NOT EXISTS dados jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS lista text NOT NULL DEFAULT 'ativa';

CREATE INDEX IF NOT EXISTS receitas_user_lista_idx ON public.receitas (user_id, lista);