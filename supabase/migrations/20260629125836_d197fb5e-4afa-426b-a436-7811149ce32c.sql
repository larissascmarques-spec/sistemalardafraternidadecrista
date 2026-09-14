ALTER TABLE public.receitas DROP CONSTRAINT IF EXISTS receitas_residente_id_fkey;
ALTER TABLE public.receitas ALTER COLUMN residente_id TYPE text USING residente_id::text;
ALTER TABLE public.agendamentos ALTER COLUMN residente_id TYPE text USING residente_id::text;