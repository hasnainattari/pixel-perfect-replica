
-- Fix public_assets view: use security invoker with column-level grants
DROP VIEW IF EXISTS public.public_assets;

REVOKE ALL ON public.assets FROM anon;
GRANT SELECT (id, asset_code, name, category, location, condition, status, last_service_date, next_service_date)
  ON public.assets TO anon;

CREATE POLICY "Anon reads safe asset columns" ON public.assets
  FOR SELECT TO anon USING (true);

CREATE VIEW public.public_assets
WITH (security_invoker = true) AS
SELECT id, asset_code, name, category, location, condition, status, last_service_date, next_service_date
FROM public.assets;
GRANT SELECT ON public.public_assets TO anon, authenticated;

-- Restrict SECURITY DEFINER helpers to authenticated only
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.current_user_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_issue_number() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.generate_issue_number() TO anon, authenticated;
