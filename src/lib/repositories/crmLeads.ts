/**
 * CrmLeadsRepository — exemplo completo de domínio.
 * Tabela `crm_leads` com filtros por estágio/responsável.
 */
import { BaseRepository } from "./base";
import { supabase } from "@/integrations/supabase/client";

class CrmLeadsRepository extends BaseRepository<"crm_leads"> {
  protected readonly table = "crm_leads" as const;

  async byEstagio(estagio: string) {
    const res = await supabase
      .from("crm_leads")
      .select("*")
      .eq("estagio", estagio)
      .order("updated_at", { ascending: false });
    return this.normalize(res as any);
  }

  async byResponsavel(email: string) {
    const res = await supabase
      .from("crm_leads")
      .select("*")
      .eq("responsavel", email)
      .order("updated_at", { ascending: false });
    return this.normalize(res as any);
  }

  async kanbanCounts() {
    const res = await supabase.from("crm_leads").select("estagio");
    if (res.error) return {} as Record<string, number>;
    return (res.data ?? []).reduce<Record<string, number>>((acc, row: any) => {
      const k = row.estagio || "indefinido";
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {});
  }

  async moveStage(id: string, novoEstagio: string) {
    return this.update(id, { estagio: novoEstagio } as any);
  }
}

export const crmLeadsRepo = new CrmLeadsRepository();
