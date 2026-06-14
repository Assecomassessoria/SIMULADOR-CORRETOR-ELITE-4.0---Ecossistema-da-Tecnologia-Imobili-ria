-- 1. Deny authenticated direct access on sensitive tables
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'active_sessions','cadastro_comercial','corretores','demo_licenses',
    'crm_activity_log','crm_construtoras','crm_leads','crm_tasks',
    'empreendimento_tabelas','empreendimento_unidades',
    'password_reset_otps','system_settings','used_liberation_passwords',
    'user_pin_access','whatsapp_connection_attempts'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS "Deny authenticated all on %1$I" ON public.%1$I',
      t
    );
    EXECUTE format(
      'CREATE POLICY "Deny authenticated all on %1$I" ON public.%1$I FOR ALL TO authenticated USING (false) WITH CHECK (false)',
      t
    );
  END LOOP;
END $$;

-- 2. Storage policies: tabelas-empreendimentos (private — backend only)
DROP POLICY IF EXISTS "Deny client access tabelas-empreendimentos" ON storage.objects;
CREATE POLICY "Deny client access tabelas-empreendimentos"
ON storage.objects FOR ALL
TO anon, authenticated
USING (bucket_id = 'tabelas-empreendimentos' AND false)
WITH CHECK (bucket_id = 'tabelas-empreendimentos' AND false);

-- 3. Storage policies: imagens_anuncios (public read, no client mutations)
DROP POLICY IF EXISTS "Deny client update imagens_anuncios" ON storage.objects;
CREATE POLICY "Deny client update imagens_anuncios"
ON storage.objects FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'imagens_anuncios' AND false)
WITH CHECK (bucket_id = 'imagens_anuncios' AND false);

DROP POLICY IF EXISTS "Deny client delete imagens_anuncios" ON storage.objects;
CREATE POLICY "Deny client delete imagens_anuncios"
ON storage.objects FOR DELETE
TO anon, authenticated
USING (bucket_id = 'imagens_anuncios' AND false);

-- 4. Remove crm_leads / crm_tasks from realtime publication (handled by edge function)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'crm_leads'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.crm_leads';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'crm_tasks'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.crm_tasks';
  END IF;
END $$;