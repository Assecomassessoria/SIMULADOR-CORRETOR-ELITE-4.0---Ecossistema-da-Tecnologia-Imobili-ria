
CREATE TABLE public.cadastro_comercial (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  razao_social text NOT NULL,
  cpf_cnpj text,
  endereco text,
  bairro text,
  cidade text,
  estado text,
  cep text,
  nome_contato text,
  contato text,
  whatsapp text,
  email text,
  plano text NOT NULL DEFAULT 'plano01',
  plano_label text,
  max_usuarios integer NOT NULL DEFAULT 5,
  senha text NOT NULL,
  validade_dias integer NOT NULL DEFAULT 365,
  data_envio text,
  data_expiracao text,
  status text NOT NULL DEFAULT 'Ativo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cadastro_comercial ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny anon all on cadastro_comercial" ON public.cadastro_comercial
  FOR ALL TO public USING (false) WITH CHECK (false);

CREATE TABLE public.corretores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cadastro_comercial_id uuid REFERENCES public.cadastro_comercial(id) ON DELETE CASCADE,
  nome text NOT NULL,
  cpf text NOT NULL,
  creci text,
  whatsapp text,
  email text,
  pin_hash text NOT NULL,
  status text NOT NULL DEFAULT 'ativo',
  data_cadastro text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.corretores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny anon all on corretores" ON public.corretores
  FOR ALL TO public USING (false) WITH CHECK (false);
