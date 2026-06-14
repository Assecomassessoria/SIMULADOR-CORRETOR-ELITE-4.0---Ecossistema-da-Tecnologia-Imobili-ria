INSERT INTO storage.buckets (id, name, public)
VALUES ('relatorios-auditoria', 'relatorios-auditoria', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Deny anon all on relatorios-auditoria"
ON storage.objects FOR ALL TO anon
USING (bucket_id = 'relatorios-auditoria' AND false)
WITH CHECK (bucket_id = 'relatorios-auditoria' AND false);

CREATE POLICY "Deny authenticated all on relatorios-auditoria"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'relatorios-auditoria' AND false)
WITH CHECK (bucket_id = 'relatorios-auditoria' AND false);