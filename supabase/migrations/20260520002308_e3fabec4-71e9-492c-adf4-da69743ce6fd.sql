
-- Tabelas de vendas por empreendimento
CREATE TABLE public.empreendimento_tabelas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  construtora_cnpj TEXT NOT NULL,
  empreendimento_nome TEXT NOT NULL,
  cidade TEXT,
  uf TEXT,
  arquivo_path TEXT,
  arquivo_tipo TEXT NOT NULL CHECK (arquivo_tipo IN ('pdf','xlsx')),
  total_unidades INTEGER NOT NULL DEFAULT 0,
  uploaded_by_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_emp_tabelas_nome ON public.empreendimento_tabelas (lower(empreendimento_nome));
CREATE INDEX idx_emp_tabelas_cnpj ON public.empreendimento_tabelas (construtora_cnpj);

ALTER TABLE public.empreendimento_tabelas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny anon all on empreendimento_tabelas"
  ON public.empreendimento_tabelas AS PERMISSIVE FOR ALL TO public
  USING (false) WITH CHECK (false);

CREATE TABLE public.empreendimento_unidades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tabela_id UUID NOT NULL REFERENCES public.empreendimento_tabelas(id) ON DELETE CASCADE,
  unidade TEXT NOT NULL,
  andar TEXT,
  apto_torre TEXT,
  valor_lancamento NUMERIC,
  tipologia TEXT,
  metragem TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_emp_unidades_lookup ON public.empreendimento_unidades (tabela_id, lower(unidade));

ALTER TABLE public.empreendimento_unidades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny anon all on empreendimento_unidades"
  ON public.empreendimento_unidades AS PERMISSIVE FOR ALL TO public
  USING (false) WITH CHECK (false);

-- Trigger updated_at
CREATE TRIGGER trg_emp_tabelas_updated
BEFORE UPDATE ON public.empreendimento_tabelas
FOR EACH ROW EXECUTE FUNCTION public.update_crm_updated_at();

-- Storage bucket (privado)
INSERT INTO storage.buckets (id, name, public)
VALUES ('tabelas-empreendimentos', 'tabelas-empreendimentos', false)
ON CONFLICT (id) DO NOTHING;
