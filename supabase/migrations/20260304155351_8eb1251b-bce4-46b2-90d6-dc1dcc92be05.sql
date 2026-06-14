
-- Drop all existing permissive policies on CRM tables
DROP POLICY IF EXISTS "Anyone can read crm_leads" ON public.crm_leads;
DROP POLICY IF EXISTS "Anyone can insert crm_leads" ON public.crm_leads;
DROP POLICY IF EXISTS "Anyone can update crm_leads" ON public.crm_leads;
DROP POLICY IF EXISTS "Anyone can delete crm_leads" ON public.crm_leads;

DROP POLICY IF EXISTS "Anyone can read crm_tasks" ON public.crm_tasks;
DROP POLICY IF EXISTS "Anyone can insert crm_tasks" ON public.crm_tasks;
DROP POLICY IF EXISTS "Anyone can update crm_tasks" ON public.crm_tasks;
DROP POLICY IF EXISTS "Anyone can delete crm_tasks" ON public.crm_tasks;

DROP POLICY IF EXISTS "Anyone can read crm_activity_log" ON public.crm_activity_log;
DROP POLICY IF EXISTS "Anyone can insert crm_activity_log" ON public.crm_activity_log;

-- Create deny-all policies for anon role (service_role bypasses RLS)
-- crm_leads
CREATE POLICY "Deny anon select on crm_leads" ON public.crm_leads FOR SELECT TO anon USING (false);
CREATE POLICY "Deny anon insert on crm_leads" ON public.crm_leads FOR INSERT TO anon WITH CHECK (false);
CREATE POLICY "Deny anon update on crm_leads" ON public.crm_leads FOR UPDATE TO anon USING (false);
CREATE POLICY "Deny anon delete on crm_leads" ON public.crm_leads FOR DELETE TO anon USING (false);

-- crm_tasks
CREATE POLICY "Deny anon select on crm_tasks" ON public.crm_tasks FOR SELECT TO anon USING (false);
CREATE POLICY "Deny anon insert on crm_tasks" ON public.crm_tasks FOR INSERT TO anon WITH CHECK (false);
CREATE POLICY "Deny anon update on crm_tasks" ON public.crm_tasks FOR UPDATE TO anon USING (false);
CREATE POLICY "Deny anon delete on crm_tasks" ON public.crm_tasks FOR DELETE TO anon USING (false);

-- crm_activity_log
CREATE POLICY "Deny anon select on crm_activity_log" ON public.crm_activity_log FOR SELECT TO anon USING (false);
CREATE POLICY "Deny anon insert on crm_activity_log" ON public.crm_activity_log FOR INSERT TO anon WITH CHECK (false);
