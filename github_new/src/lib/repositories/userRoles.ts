/**
 * UserRolesRepository — Phase 2 RBAC
 * Acesso à tabela `user_roles`. Todas as escritas só funcionam para admin
 * (garantido por RLS); leituras retornam apenas os próprios papéis exceto admin.
 */
import { BaseRepository } from "./base";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];

class UserRolesRepository extends BaseRepository<"user_roles"> {
  protected readonly table = "user_roles" as const;

  /** Papéis do usuário autenticado atual. Vazio se não logado. */
  async myRoles(): Promise<AppRole[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    if (error) {
      console.error("[user_roles] myRoles error:", error);
      return [];
    }
    return (data ?? []).map(r => r.role as AppRole);
  }

  /** Verifica se o usuário atual tem um papel específico. */
  async amI(role: AppRole): Promise<boolean> {
    const roles = await this.myRoles();
    return roles.includes(role);
  }

  /** Lista papéis de outro usuário (somente admin via RLS). */
  async rolesOf(userId: string): Promise<AppRole[]> {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    if (error) return [];
    return (data ?? []).map(r => r.role as AppRole);
  }

  /** Atribui um papel (somente admin). */
  async assign(userId: string, role: AppRole) {
    return this.create({ user_id: userId, role } as any);
  }

  /** Remove um papel específico de um usuário (somente admin). */
  async revoke(userId: string, role: AppRole) {
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", role);
    return { error: error ? new Error(error.message) : null };
  }
}

export const userRolesRepo = new UserRolesRepository();
