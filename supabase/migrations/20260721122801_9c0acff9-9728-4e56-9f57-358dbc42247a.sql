
ALTER TABLE public.agendamentos
  ADD COLUMN IF NOT EXISTS resultado_data date,
  ADD COLUMN IF NOT EXISTS resultado_retirado boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS resultado_retirado_em date;
