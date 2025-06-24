-- MIGRAÇÃO COMPLEMENTAR: FINALIZAR OTIMIZAÇÕES CRÍTICAS
DROP FUNCTION IF EXISTS get_current_user_id();
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS \$\$
  SELECT auth.uid();
\$\$;

