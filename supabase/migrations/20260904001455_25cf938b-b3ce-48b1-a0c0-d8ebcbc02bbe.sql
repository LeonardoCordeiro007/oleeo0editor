ALTER FUNCTION public.has_role(uuid, public.app_role) SECURITY INVOKER;
REVOKE EXECUTE ON FUNCTION public.claim_admin() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_admin() TO service_role;