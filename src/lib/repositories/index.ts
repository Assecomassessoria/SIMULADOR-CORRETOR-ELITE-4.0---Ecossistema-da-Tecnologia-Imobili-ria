/**
 * Camada de Repositório (Phase 2)
 *
 * Use `import { crmLeadsRepo, userRolesRepo } from "@/lib/repositories"`
 * em vez de chamar `supabase.from(...)` diretamente nos componentes.
 *
 * Repositórios entregues nesta fase (template + alto valor):
 * - userRolesRepo       → RBAC (admin/gestor/corretor/visitante)
 * - crmLeadsRepo        → CRM Leads
 * - whatsappAttemptsRepo → métricas de WhatsApp
 *
 * Próximos a serem migrados (a confirmar):
 *   profiles, corretores, cadastro_comercial, demo_licenses,
 *   crm_construtoras, crm_tasks, crm_activity_log,
 *   empreendimento_tabelas, empreendimento_unidades,
 *   password_reset_otps, user_pin_access, system_settings,
 *   active_sessions, used_liberation_passwords
 */
export * from "./base";
export { userRolesRepo, type AppRole } from "./userRoles";
export { crmLeadsRepo } from "./crmLeads";
export { whatsappAttemptsRepo } from "./whatsappAttempts";
