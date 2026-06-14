
-- Create construtoras table
CREATE TABLE public.crm_construtoras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ordem serial NOT NULL,
  nome_empreendimento text NOT NULL,
  email text,
  whatsapp text,
  cnpj text,
  estagio_obras text DEFAULT 'planejamento',
  responsavel text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.crm_construtoras ENABLE ROW LEVEL SECURITY;

-- Deny anon access (same pattern as other CRM tables)
CREATE POLICY "Deny anon select on crm_construtoras" ON public.crm_construtoras FOR SELECT TO anon USING (false);
CREATE POLICY "Deny anon insert on crm_construtoras" ON public.crm_construtoras FOR INSERT TO anon WITH CHECK (false);
CREATE POLICY "Deny anon update on crm_construtoras" ON public.crm_construtoras FOR UPDATE TO anon USING (false);
CREATE POLICY "Deny anon delete on crm_construtoras" ON public.crm_construtoras FOR DELETE TO anon USING (false);

-- Add construtora_id to crm_leads
ALTER TABLE public.crm_leads ADD COLUMN construtora_id uuid REFERENCES public.crm_construtoras(id) ON DELETE SET NULL;

-- Trigger for updated_at
CREATE TRIGGER update_crm_construtoras_updated_at
  BEFORE UPDATE ON public.crm_construtoras
  FOR EACH ROW
  EXECUTE FUNCTION public.update_crm_updated_at();
