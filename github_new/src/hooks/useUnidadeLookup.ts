import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface UnidadeLookupResult {
  found: boolean;
  empreendimento?: string;
  construtora_cnpj?: string;
  atualizado_em?: string;
  andar?: string;
  apto_torre?: string;
  valor_lancamento?: number;
  tipologia?: string;
  metragem?: string;
  reason?: string;
}

export function useUnidadeLookup() {
  const [loading, setLoading] = useState(false);
  const cache = useRef<Map<string, UnidadeLookupResult>>(new Map());

  const lookup = useCallback(async (empreendimento: string, unidade: string): Promise<UnidadeLookupResult | null> => {
    if (!empreendimento?.trim() || !unidade?.trim()) return null;
    const key = `${empreendimento.trim().toLowerCase()}|${unidade.trim().toLowerCase()}`;
    if (cache.current.has(key)) return cache.current.get(key)!;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("buscar-unidade", {
        body: { empreendimento: empreendimento.trim(), unidade: unidade.trim() },
      });
      if (error) return { found: false, reason: "erro_servidor" };
      const result = data as UnidadeLookupResult;
      cache.current.set(key, result);
      return result;
    } finally {
      setLoading(false);
    }
  }, []);

  return { lookup, loading };
}
