
-- Explicit deny policies for active_sessions (all operations blocked for anon)
CREATE POLICY "Deny anon select on active_sessions" ON public.active_sessions FOR SELECT USING (false);
CREATE POLICY "Deny anon insert on active_sessions" ON public.active_sessions FOR INSERT WITH CHECK (false);
CREATE POLICY "Deny anon update on active_sessions" ON public.active_sessions FOR UPDATE USING (false);
CREATE POLICY "Deny anon delete on active_sessions" ON public.active_sessions FOR DELETE USING (false);

-- Explicit deny policies for demo_licenses (all operations blocked for anon)
CREATE POLICY "Deny anon select on demo_licenses" ON public.demo_licenses FOR SELECT USING (false);
CREATE POLICY "Deny anon insert on demo_licenses" ON public.demo_licenses FOR INSERT WITH CHECK (false);
CREATE POLICY "Deny anon update on demo_licenses" ON public.demo_licenses FOR UPDATE USING (false);
CREATE POLICY "Deny anon delete on demo_licenses" ON public.demo_licenses FOR DELETE USING (false);
