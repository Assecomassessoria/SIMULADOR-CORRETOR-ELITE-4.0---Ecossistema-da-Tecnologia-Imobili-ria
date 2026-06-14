-- 1) imagens_anuncios: client uploads são feitos APENAS pelas edge functions
--    (process-video, generate-carousel) usando o service role. Negamos INSERT
--    de qualquer cliente (anon/authenticated). Service role continua bypassando RLS.
DROP POLICY IF EXISTS "Anyone can upload ad images" ON storage.objects;
DROP POLICY IF EXISTS "Deny client insert imagens_anuncios" ON storage.objects;
CREATE POLICY "Deny client insert imagens_anuncios"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'imagens_anuncios' AND false);

-- 2) sugestoes-anexos: aceitar uploads públicos mas com restrições fortes:
--    - somente PDFs
--    - tamanho máximo 10 MB
--    - obrigatório usar prefixo 'public/'
DROP POLICY IF EXISTS "Qualquer pessoa pode anexar sugestao" ON storage.objects;
CREATE POLICY "Sugestoes anexo upload restrito"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'sugestoes-anexos'
  AND (storage.foldername(name))[1] = 'public'
  AND lower(right(name, 4)) = '.pdf'
  AND coalesce((metadata->>'size')::bigint, 0) <= 10485760
  AND coalesce(metadata->>'mimetype', '') = 'application/pdf'
);

-- 3) sugestoes (tabela): trocar WITH CHECK (true) por validações de tamanho/formato
DROP POLICY IF EXISTS "Qualquer pessoa pode enviar sugestao" ON public.sugestoes;
CREATE POLICY "Qualquer pessoa pode enviar sugestao"
ON public.sugestoes
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(nome) BETWEEN 1 AND 200
  AND length(email) BETWEEN 5 AND 200
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND length(mensagem) BETWEEN 1 AND 5000
  AND length(coalesce(whatsapp, '')) <= 40
  AND (anexo_path IS NULL OR length(anexo_path) <= 300)
);