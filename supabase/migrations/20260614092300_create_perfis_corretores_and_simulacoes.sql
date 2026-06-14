-- Migration to create perfis_corretores and simulacoes tables

-- 1. Tabela de Perfis de Usuários (Corretores)
CREATE TABLE IF NOT EXISTS public.perfis_corretores (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    nome_completo TEXT,
    creci TEXT,
    empresa TEXT,
    plano_ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Tabela de Simulações (Core do Simulador)
CREATE TABLE IF NOT EXISTS public.simulacoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    corretor_id UUID REFERENCES public.perfis_corretores(id) ON DELETE CASCADE,
    valor_imovel DECIMAL(12,2),
    valor_entrada DECIMAL(12,2),
    prazo_meses INTEGER,
    taxa_juros DECIMAL(5,2),
    resultado_parcela DECIMAL(12,2),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Ativando RLS (Segurança)
ALTER TABLE public.perfis_corretores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulacoes ENABLE ROW LEVEL SECURITY;

-- 4. Criando Políticas de Segurança para perfis_corretores

CREATE POLICY "Corretor pode ver seu próprio perfil" ON public.perfis_corretores
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Corretor pode atualizar seu próprio perfil" ON public.perfis_corretores
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Corretor pode inserir seu próprio perfil" ON public.perfis_corretores
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 5. Criando Políticas de Segurança para simulacoes

-- Política: Corretor só vê seus próprios dados
CREATE POLICY "Corretor pode ver seus dados" ON public.simulacoes
    FOR SELECT USING (auth.uid() = corretor_id);

CREATE POLICY "Corretor pode inserir suas simulações" ON public.simulacoes
    FOR INSERT WITH CHECK (auth.uid() = corretor_id);

CREATE POLICY "Corretor pode atualizar suas simulações" ON public.simulacoes
    FOR UPDATE USING (auth.uid() = corretor_id);

CREATE POLICY "Corretor pode deletar suas simulações" ON public.simulacoes
    FOR DELETE USING (auth.uid() = corretor_id);
