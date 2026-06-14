
-- Tabela de sugestões
CREATE TABLE public.sugestoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  whatsapp TEXT,
  email TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  anexo_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sugestoes ENABLE ROW LEVEL SECURITY;

-- Qualquer um pode inserir (canal aberto)
CREATE POLICY "Qualquer pessoa pode enviar sugestao"
  ON public.sugestoes FOR INSERT
  WITH CHECK (true);

-- Apenas admins podem ler
CREATE POLICY "Admins podem ver sugestoes"
  ON public.sugestoes FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Bucket privado para anexos
INSERT INTO storage.buckets (id, name, public)
VALUES ('sugestoes-anexos', 'sugestoes-anexos', false)
ON CONFLICT (id) DO NOTHING;

-- Qualquer um pode subir anexos
CREATE POLICY "Qualquer pessoa pode anexar sugestao"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'sugestoes-anexos');

-- Apenas admins leem anexos
CREATE POLICY "Admins podem ler anexos de sugestoes"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'sugestoes-anexos' AND public.has_role(auth.uid(), 'admin'));
