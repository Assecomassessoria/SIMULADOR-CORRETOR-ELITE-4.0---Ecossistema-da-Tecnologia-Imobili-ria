/**
 * WhatsappAttemptsRepository — leitura das tentativas de conexão WhatsApp.
 * Usado pelo painel administrativo para métricas.
 */
import { BaseRepository } from "./base";
import { supabase } from "@/integrations/supabase/client";

class WhatsappAttemptsRepository extends BaseRepository<"whatsapp_connection_attempts"> {
  protected readonly table = "whatsapp_connection_attempts" as const;

  async recent(limit = 50) {
    const res = await supabase
      .from("whatsapp_connection_attempts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    return this.normalize(res as any);
  }

  async countByAction(): Promise<Record<string, number>> {
    const res = await supabase.from("whatsapp_connection_attempts").select("action");
    if (res.error) return {};
    return (res.data ?? []).reduce<Record<string, number>>((acc, row: any) => {
      acc[row.action] = (acc[row.action] ?? 0) + 1;
      return acc;
    }, {});
  }

  async uniqueIdentifiers(): Promise<number> {
    const res = await supabase.from("whatsapp_connection_attempts").select("identifier");
    if (res.error) return 0;
    return new Set((res.data ?? []).map((r: any) => r.identifier)).size;
  }
}

export const whatsappAttemptsRepo = new WhatsappAttemptsRepository();
