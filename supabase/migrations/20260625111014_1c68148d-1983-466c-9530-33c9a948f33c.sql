ALTER TABLE public.agendamentos
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'Agendada',
  ADD COLUMN IF NOT EXISTS motivo text,
  ADD COLUMN IF NOT EXISTS especialidade text;