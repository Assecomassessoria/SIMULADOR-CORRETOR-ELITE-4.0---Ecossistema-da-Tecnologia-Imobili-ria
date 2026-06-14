
-- CRM Leads table
CREATE TABLE public.crm_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT,
  whatsapp TEXT,
  cpf_cnpj TEXT,
  mensagem TEXT,
  estagio TEXT NOT NULL DEFAULT 'prospeccao',
  origem TEXT DEFAULT 'manual',
  responsavel TEXT,
  valor_negociacao NUMERIC DEFAULT 0,
  data_ultimo_contato TIMESTAMP WITH TIME ZONE,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by TEXT NOT NULL,
  CONSTRAINT unique_cpf_cnpj UNIQUE (cpf_cnpj),
  CONSTRAINT unique_whatsapp UNIQUE (whatsapp),
  CONSTRAINT unique_email_lead UNIQUE (email)
);

ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read crm_leads" ON public.crm_leads FOR SELECT USING (true);
CREATE POLICY "Anyone can insert crm_leads" ON public.crm_leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update crm_leads" ON public.crm_leads FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete crm_leads" ON public.crm_leads FOR DELETE USING (true);

-- CRM Tasks table
CREATE TABLE public.crm_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  responsavel TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  data_vencimento TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read crm_tasks" ON public.crm_tasks FOR SELECT USING (true);
CREATE POLICY "Anyone can insert crm_tasks" ON public.crm_tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update crm_tasks" ON public.crm_tasks FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete crm_tasks" ON public.crm_tasks FOR DELETE USING (true);

-- CRM Activity Log
CREATE TABLE public.crm_activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by TEXT
);

ALTER TABLE public.crm_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read crm_activity_log" ON public.crm_activity_log FOR SELECT USING (true);
CREATE POLICY "Anyone can insert crm_activity_log" ON public.crm_activity_log FOR INSERT WITH CHECK (true);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_crm_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_crm_leads_updated_at
  BEFORE UPDATE ON public.crm_leads
  FOR EACH ROW EXECUTE FUNCTION public.update_crm_updated_at();

CREATE TRIGGER update_crm_tasks_updated_at
  BEFORE UPDATE ON public.crm_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_crm_updated_at();

-- Enable realtime for leads
ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_tasks;
