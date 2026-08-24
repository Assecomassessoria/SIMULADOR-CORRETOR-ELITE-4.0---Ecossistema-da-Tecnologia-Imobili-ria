-- ==============================================================================
-- MIGRATION: Blindagem e Isolamento Multi-Tenant via RLS (Row Level Security)
-- Tabelas: leads, empreendimentos, crm_leads, crm_construtoras, crm_tasks, crm_activity_log
-- ==============================================================================

-- 1. Criação das tabelas padrão 'leads' e 'empreendimentos' caso ainda não existam no schema público
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    corretor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    nome TEXT NOT NULL,
    email TEXT,
    telefone TEXT,
    whatsapp TEXT,
    cpf_cnpj TEXT,
    estagio TEXT NOT NULL DEFAULT 'prospeccao',
    origem TEXT DEFAULT 'simulador',
    valor_interesse NUMERIC DEFAULT 0,
    renda_bruta NUMERIC DEFAULT 0,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.empreendimentos (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    corretor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    nome TEXT NOT NULL,
    construtora TEXT,
    cidade TEXT,
    estado TEXT,
    valor_min NUMERIC DEFAULT 0,
    valor_max NUMERIC DEFAULT 0,
    link_material TEXT,
    estagio_obras TEXT,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Ativar o Row Level Security (RLS) nas tabelas
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empreendimentos ENABLE ROW LEVEL SECURITY;

-- 3. Limpeza de políticas existentes para evitar duplicidade
DROP POLICY IF EXISTS "Leitura restrita ao dono - Leads" ON public.leads;
DROP POLICY IF EXISTS "Inserção restrita ao dono - Leads" ON public.leads;
DROP POLICY IF EXISTS "Atualização restrita ao dono - Leads" ON public.leads;
DROP POLICY IF EXISTS "Exclusão restrita ao dono - Leads" ON public.leads;

DROP POLICY IF EXISTS "Leitura restrita ao dono - Empreendimentos" ON public.empreendimentos;
DROP POLICY IF EXISTS "Inserção restrita ao dono - Empreendimentos" ON public.empreendimentos;
DROP POLICY IF EXISTS "Atualização restrita ao dono - Empreendimentos" ON public.empreendimentos;
DROP POLICY IF EXISTS "Exclusão restrita ao dono - Empreendimentos" ON public.empreendimentos;

-- 4. Criar políticas completas de segurança para public.leads
-- Leitura (SELECT): Corretor visualiza apenas os seus próprios leads
CREATE POLICY "Leitura restrita ao dono - Leads" 
ON public.leads FOR SELECT 
TO authenticated
USING (auth.uid() = corretor_id);

-- Inserção (INSERT): Corretor insere apenas associando ao seu próprio UID
CREATE POLICY "Inserção restrita ao dono - Leads" 
ON public.leads FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = corretor_id);

-- Atualização (UPDATE): Corretor altera apenas os seus próprios leads
CREATE POLICY "Atualização restrita ao dono - Leads" 
ON public.leads FOR UPDATE 
TO authenticated
USING (auth.uid() = corretor_id)
WITH CHECK (auth.uid() = corretor_id);

-- Exclusão (DELETE): Corretor deleta apenas os seus próprios leads
CREATE POLICY "Exclusão restrita ao dono - Leads" 
ON public.leads FOR DELETE 
TO authenticated
USING (auth.uid() = corretor_id);

-- 5. Criar políticas completas de segurança para public.empreendimentos
-- Leitura (SELECT): Corretor visualiza apenas os seus próprios empreendimentos
CREATE POLICY "Leitura restrita ao dono - Empreendimentos" 
ON public.empreendimentos FOR SELECT 
TO authenticated
USING (auth.uid() = corretor_id);

-- Inserção (INSERT): Corretor cadastra empreendimentos apenas no seu próprio ID
CREATE POLICY "Inserção restrita ao dono - Empreendimentos" 
ON public.empreendimentos FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = corretor_id);

-- Atualização (UPDATE): Corretor altera apenas os seus próprios empreendimentos
CREATE POLICY "Atualização restrita ao dono - Empreendimentos" 
ON public.empreendimentos FOR UPDATE 
TO authenticated
USING (auth.uid() = corretor_id)
WITH CHECK (auth.uid() = corretor_id);

-- Exclusão (DELETE): Corretor deleta apenas os seus próprios empreendimentos
CREATE POLICY "Exclusão restrita ao dono - Empreendimentos" 
ON public.empreendimentos FOR DELETE 
TO authenticated
USING (auth.uid() = corretor_id);

-- 6. Índices para performance e otimização das consultas filtradas por RLS
CREATE INDEX IF NOT EXISTS idx_leads_corretor_id ON public.leads (corretor_id);
CREATE INDEX IF NOT EXISTS idx_empreendimentos_corretor_id ON public.empreendimentos (corretor_id);
