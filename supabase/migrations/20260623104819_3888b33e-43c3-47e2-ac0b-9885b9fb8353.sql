-- Defesa em camadas: revogar acesso anônimo e garantir permissões explícitas
REVOKE ALL ON public.residentes FROM anon;
REVOKE ALL ON public.receitas FROM anon;
REVOKE ALL ON public.estoque FROM anon;
REVOKE ALL ON public.insumos FROM anon;
REVOKE ALL ON public.agendamentos FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.residentes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.receitas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.estoque TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.insumos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agendamentos TO authenticated;

GRANT ALL ON public.residentes TO service_role;
GRANT ALL ON public.receitas TO service_role;
GRANT ALL ON public.estoque TO service_role;
GRANT ALL ON public.insumos TO service_role;
GRANT ALL ON public.agendamentos TO service_role;