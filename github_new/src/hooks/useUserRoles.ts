/**
 * useUserRoles — hook React para acesso aos papéis (RBAC) do usuário autenticado.
 * Reage a mudanças de sessão automaticamente.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { userRolesRepo, type AppRole } from "@/lib/repositories";

export function useUserRoles() {
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchRoles = async () => {
      const r = await userRolesRepo.myRoles();
      if (mounted) {
        setRoles(r);
        setLoading(false);
      }
    };

    fetchRoles();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchRoles();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
    roles,
    loading,
    isAdmin: roles.includes("admin"),
    isGestor: roles.includes("gestor"),
    isCorretor: roles.includes("corretor"),
    isVisitante: roles.includes("visitante"),
    hasRole: (role: AppRole) => roles.includes(role),
  };
}
