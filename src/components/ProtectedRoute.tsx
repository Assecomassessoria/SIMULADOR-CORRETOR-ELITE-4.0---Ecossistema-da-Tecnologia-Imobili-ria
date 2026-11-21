import React, { useEffect, type ComponentType, type FC, type ReactNode } from "react";
import { Navigate, useLocation, useParams } from "react-router-dom";
import { Loader2, ShieldCheck } from "lucide-react";
import type { User } from "firebase/auth";
import { useFirebaseAuth } from "@/contexts/FirebaseContext";
import type {
  AccessAuthorizationResult,
  PapelMultiTenant,
  TipoContaTenant,
} from "@/lib/accessDatabase";
import { checkLoginValid, isMasterAccess } from "@/lib/eliteUtils";

export type RouteAccessDenialReason =
  | "unauthenticated"
  | "unauthorized_account"
  | "missing_tenant"
  | "forbidden_tenant"
  | "forbidden_role"
  | "forbidden_account_type";

export interface AuthenticatedTenantSession {
  authenticated: boolean;
  uid: string;
  email: string;
  tenantId: string;
  codigoId?: string;
  papel: PapelMultiTenant;
  tipoConta: TipoContaTenant;
  isMaster: boolean;
  authorization: AccessAuthorizationResult | null;
}

export interface RouteAccessDecision {
  allowed: boolean;
  reason?: RouteAccessDenialReason;
  message?: string;
  session: AuthenticatedTenantSession | null;
}

export interface ProtectedRouteOptions {
  /** Allowed multi-tenant roles (e.g. ["master_adm", "admin_imobiliaria", "corretor"]) */
  allowedRoles?: readonly PapelMultiTenant[];
  /** Portuguese alias for allowedRoles */
  allowedPapeis?: readonly PapelMultiTenant[];
  /** Optional restriction by tenant account type ("imobiliaria" | "autonomo" | "adm") */
  allowedTiposConta?: readonly TipoContaTenant[];
  /** Static tenant_id or agency code (e.g. "IMOB-1234") required to access the route */
  requiredTenantId?: string;
  /** Route param name (e.g. "tenantId") to compare against the authenticated user's tenant_id */
  tenantParamName?: string;
  /** Require every non-master user to have a verified tenant_id bound to their contract (default: true) */
  requireTenantId?: boolean;
  /** Allow verified master_adm accounts to bypass a specific tenant_id mismatch (default: true) */
  allowMasterOverride?: boolean;
  /** Allow the preserved local Master password session (default: true) */
  allowLocalMasterSession?: boolean;
  /** Internal path to redirect unauthorized users (default: "/login") */
  redirectTo?: string;
  /** Optional callback invoked before redirecting an unauthorized user */
  onUnauthorized?: (decision: RouteAccessDecision) => void;
}

export interface ProtectedRouteRedirectState {
  from: string;
  authDeniedReason?: RouteAccessDenialReason;
  authDeniedMessage?: string;
}

export interface EvaluateRouteAccessInput {
  user: Pick<User, "uid" | "email" | "emailVerified"> | null;
  accessAuthorization: AccessAuthorizationResult | null;
  hasLocalMasterSession?: boolean;
  routeTenantParam?: string;
  options?: ProtectedRouteOptions;
}

/**
 * Ensures redirect targets are strictly internal paths to prevent open redirects.
 */
export function sanitizeInternalRedirect(target?: string): string {
  if (!target || typeof target !== "string") return "/login";
  const trimmed = target.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.includes("\\")) {
    return "/login";
  }
  return trimmed;
}

function normalizeTenantToken(value?: string | null): string {
  return (value || "").trim().toLowerCase();
}

function resolvePapel(authorization: AccessAuthorizationResult): PapelMultiTenant | null {
  if (authorization.papel) return authorization.papel;
  if (authorization.role === "master" || authorization.role === "adm") return "master_adm";
  if (authorization.role === "imobiliaria") return "admin_imobiliaria";
  if (authorization.role === "corretor") return "corretor";
  if (authorization.role === "cliente") return "cliente";
  return null;
}

function resolveTipoConta(authorization: AccessAuthorizationResult, papel: PapelMultiTenant): TipoContaTenant {
  if (authorization.tipoConta) return authorization.tipoConta;
  if (papel === "master_adm") return "adm";
  if (papel === "admin_imobiliaria") return "imobiliaria";
  return "autonomo";
}

/**
 * Pure authorization evaluator checking authentication, verified contract authorization,
 * tenant_id isolation, and role (papel) permissions.
 */
export function evaluateRouteAccess({
  user,
  accessAuthorization,
  hasLocalMasterSession = false,
  routeTenantParam,
  options = {},
}: EvaluateRouteAccessInput): RouteAccessDecision {
  const {
    allowedRoles,
    allowedPapeis,
    allowedTiposConta,
    requiredTenantId,
    requireTenantId = true,
    allowMasterOverride = true,
    allowLocalMasterSession = true,
  } = options;

  const effectiveRoles = allowedRoles ?? allowedPapeis;
  const targetTenantId = requiredTenantId || routeTenantParam;

  let session: AuthenticatedTenantSession | null = null;

  if (user && user.emailVerified) {
    if (!accessAuthorization || !accessAuthorization.authorized) {
      return {
        allowed: false,
        reason: "unauthorized_account",
        message:
          accessAuthorization?.message ||
          "Seu contrato não está ativo ou autorizado para acessar esta área.",
        session: null,
      };
    }

    const papel = resolvePapel(accessAuthorization);
    if (!papel) {
      return {
        allowed: false,
        reason: "forbidden_role",
        message: "Seu perfil não possui um papel válido configurado para esta área.",
        session: null,
      };
    }

    const isMaster = papel === "master_adm";
    const resolvedTenantId =
      (accessAuthorization.tenantId || "").trim() ||
      (isMaster ? "MASTER-GLOBAL" : (accessAuthorization.recordId || "").trim());

    session = {
      authenticated: true,
      uid: user.uid,
      email: (user.email || "").trim().toLowerCase(),
      tenantId: resolvedTenantId,
      codigoId: accessAuthorization.codigoId,
      papel,
      tipoConta: resolveTipoConta(accessAuthorization, papel),
      isMaster,
      authorization: accessAuthorization,
    };
  } else if (allowLocalMasterSession && hasLocalMasterSession) {
    session = {
      authenticated: true,
      uid: "local-master",
      email: "lourenco.consultorimob@gmail.com",
      tenantId: "MASTER-GLOBAL",
      codigoId: "MASTER",
      papel: "master_adm",
      tipoConta: "adm",
      isMaster: true,
      authorization: null,
    };
  }

  if (!session) {
    return {
      allowed: false,
      reason: "unauthenticated",
      message: "Faça login com sua conta autorizada para acessar esta página.",
      session: null,
    };
  }

  if (requireTenantId && !session.isMaster && !session.tenantId) {
    return {
      allowed: false,
      reason: "missing_tenant",
      message: "Sua conta não possui um tenant_id válido vinculado ao contrato.",
      session,
    };
  }

  if (effectiveRoles && effectiveRoles.length > 0 && !effectiveRoles.includes(session.papel)) {
    return {
      allowed: false,
      reason: "forbidden_role",
      message: "Seu perfil não tem permissão para acessar esta área.",
      session,
    };
  }

  if (allowedTiposConta && allowedTiposConta.length > 0 && !allowedTiposConta.includes(session.tipoConta)) {
    if (!(allowMasterOverride && session.isMaster)) {
      return {
        allowed: false,
        reason: "forbidden_account_type",
        message: "Este módulo não está disponível para o seu tipo de conta.",
        session,
      };
    }
  }

  if (targetTenantId) {
    const expected = normalizeTenantToken(targetTenantId);
    const actualTenant = normalizeTenantToken(session.tenantId);
    const actualCodigo = normalizeTenantToken(session.codigoId);
    const tenantMatches = expected !== "" && (actualTenant === expected || actualCodigo === expected);

    if (!tenantMatches && !(allowMasterOverride && session.isMaster)) {
      return {
        allowed: false,
        reason: "forbidden_tenant",
        message: "Acesso negado: você não tem permissão para acessar dados de outro tenant.",
        session,
      };
    }
  }

  return {
    allowed: true,
    session,
  };
}

/**
 * Hook exposing the current verified tenant_id and papel decision for protected views.
 */
export function useRouteAccess(options: ProtectedRouteOptions = {}): {
  isAuthReady: boolean;
  decision: RouteAccessDecision;
} {
  const { user, isAuthReady, accessAuthorization } = useFirebaseAuth();
  const params = useParams<Record<string, string | undefined>>();
  const routeTenantParam = options.tenantParamName ? params[options.tenantParamName] : undefined;
  const hasLocalMasterSession = checkLoginValid() && isMasterAccess();

  const decision = evaluateRouteAccess({
    user,
    accessAuthorization,
    hasLocalMasterSession,
    routeTenantParam,
    options,
  });

  return { isAuthReady, decision };
}

interface ProtectedRouteGuardProps extends ProtectedRouteOptions {
  children: ReactNode;
}

/**
 * Component-form guard used internally by the ProtectedRoute HOC (and available for JSX route wrapping).
 */
export const ProtectedRouteGuard: FC<ProtectedRouteGuardProps> = ({
  children,
  allowedRoles,
  allowedPapeis,
  allowedTiposConta,
  requiredTenantId,
  tenantParamName,
  requireTenantId = true,
  allowMasterOverride = true,
  allowLocalMasterSession = true,
  redirectTo = "/login",
  onUnauthorized,
}) => {
  const location = useLocation();
  const { isAuthReady, decision } = useRouteAccess({
    allowedRoles,
    allowedPapeis,
    allowedTiposConta,
    requiredTenantId,
    tenantParamName,
    requireTenantId,
    allowMasterOverride,
    allowLocalMasterSession,
    redirectTo,
  });

  useEffect(() => {
    if (isAuthReady && !decision.allowed && onUnauthorized) {
      onUnauthorized(decision);
    }
  }, [isAuthReady, decision, onUnauthorized]);

  if (!isAuthReady) {
    return (
      <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center elite-gradient geometric-pattern p-6 text-center">
        <div className="flex flex-col items-center gap-3 max-w-xs rounded-2xl bg-[#07162b]/90 border border-gold/25 px-6 py-7 shadow-2xl">
          <div className="w-11 h-11 rounded-xl bg-gold/15 border border-gold/30 flex items-center justify-center text-gold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="flex items-center gap-2 text-gold text-sm font-semibold">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Verificando acesso...</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Validando autenticação, tenant e permissões do contrato.
          </p>
        </div>
      </div>
    );
  }

  if (!decision.allowed) {
    const safeRedirect = sanitizeInternalRedirect(redirectTo);
    const redirectState: ProtectedRouteRedirectState = {
      from: `${location.pathname}${location.search}`,
      authDeniedReason: decision.reason,
      authDeniedMessage: decision.message,
    };

    return <Navigate to={safeRedirect} replace state={redirectState} />;
  }

  return <>{children}</>;
};

/**
 * Higher-Order Component (HOC) that protects a page or component by verifying:
 * 1. User authentication (verified Firebase session or preserved Master session)
 * 2. Active contract authorization
 * 3. Tenant isolation (`tenant_id` presence and optional target/route param match)
 * 4. Role permission (`papel`: master_adm | admin_imobiliaria | corretor | cliente)
 *
 * Unauthorized users are automatically redirected to the login screen.
 */
export function ProtectedRoute<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: ProtectedRouteOptions = {},
): FC<P> {
  const wrappedName = WrappedComponent.displayName || WrappedComponent.name || "Component";

  const ProtectedComponent: FC<P> = (props) => (
    <ProtectedRouteGuard {...options}>
      <WrappedComponent {...props} />
    </ProtectedRouteGuard>
  );

  ProtectedComponent.displayName = `ProtectedRoute(${wrappedName})`;
  return ProtectedComponent;
}

export default ProtectedRoute;
