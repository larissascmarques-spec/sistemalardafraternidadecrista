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