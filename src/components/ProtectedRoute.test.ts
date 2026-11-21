import { describe, it, expect } from "vitest";
import {
  evaluateRouteAccess,
  sanitizeInternalRedirect,
} from "./ProtectedRoute";
import type { AccessAuthorizationResult } from "@/lib/accessDatabase";

const verifiedBrokerUser = {
  uid: "uid-broker-1",
  email: "corretor1@imob-alpha.com.br",
  emailVerified: true,
};

const brokerAuth: AccessAuthorizationResult = {
  authorized: true,
  role: "corretor",
  code: "ok",
  message: "Acesso autorizado.",
  recordId: "corr_001",
  tenantId: "imob_alpha",
  codigoId: "CORR-1020",
  tipoConta: "imobiliaria",
  papel: "corretor",
  collectionSource: "corretor_elite",
};

const agencyAdminAuth: AccessAuthorizationResult = {
  authorized: true,
  role: "imobiliaria",
  code: "ok",
  message: "Acesso autorizado.",
  recordId: "imob_alpha",
  tenantId: "imob_alpha",
  codigoId: "IMOB-4050",
  tipoConta: "imobiliaria",
  papel: "admin_imobiliaria",
  collectionSource: "administrativo",
};

const autonomousBrokerAuth: AccessAuthorizationResult = {
  authorized: true,
  role: "corretor",
  code: "ok",
  message: "Acesso autorizado.",
  recordId: "corr_solo_7",
  tenantId: "corr_solo_7",
  codigoId: "CORR-7777",
  tipoConta: "autonomo",
  papel: "corretor",
  collectionSource: "corretor_elite",
};

const masterAuth: AccessAuthorizationResult = {
  authorized: true,
  role: "master",
  code: "ok",
  message: "Acesso Master autorizado.",
  tenantId: "MASTER-GLOBAL",
  codigoId: "MASTER",
  tipoConta: "adm",
  papel: "master_adm",
  collectionSource: "master",
};

describe("ProtectedRoute multi-tenant access evaluator", () => {
  it("blocks unauthenticated users and reports unauthenticated reason", () => {
    const result = evaluateRouteAccess({
      user: null,
      accessAuthorization: null,
      hasLocalMasterSession: false,
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("unauthenticated");
  });

  it("blocks Firebase users whose email is not verified", () => {
    const result = evaluateRouteAccess({
      user: { uid: "u1", email: "a@b.com", emailVerified: false },
      accessAuthorization: brokerAuth,
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("unauthenticated");
  });

  it("blocks authenticated Firebase users whose contract is not authorized/paid", () => {
    const result = evaluateRouteAccess({
      user: verifiedBrokerUser,
      accessAuthorization: {
        authorized: false,
        role: "none",
        code: "pending_payment",
        message: "Pagamento pendente.",
      },
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("unauthorized_account");
  });

  it("allows a linked broker into routes matching their papel and tenant_id", () => {
    const result = evaluateRouteAccess({
      user: verifiedBrokerUser,
      accessAuthorization: brokerAuth,
      routeTenantParam: "imob_alpha",
      options: {
        allowedRoles: ["master_adm", "admin_imobiliaria", "corretor"],
        requireTenantId: true,
      },
    });

    expect(result.allowed).toBe(true);
    expect(result.session?.tenantId).toBe("imob_alpha");
    expect(result.session?.papel).toBe("corretor");
  });

  it("blocks cross-tenant access when a broker requests another agency tenant_id", () => {
    const result = evaluateRouteAccess({
      user: verifiedBrokerUser,
      accessAuthorization: brokerAuth,
      routeTenantParam: "imob_beta",
      options: {
        allowedRoles: ["master_adm", "admin_imobiliaria", "corretor"],
        requireTenantId: true,
      },
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("forbidden_tenant");
  });

  it("blocks a broker from accessing an agency-admin-only route", () => {
    const result = evaluateRouteAccess({
      user: verifiedBrokerUser,
      accessAuthorization: brokerAuth,
      options: {
        allowedRoles: ["master_adm", "admin_imobiliaria"],
      },
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("forbidden_role");
  });

  it("allows an agency admin by tenantId or agency codigoId, and blocks other agencies", () => {
    const byCodigo = evaluateRouteAccess({
      user: { uid: "u-imob", email: "diretor@imob-alpha.com.br", emailVerified: true },
      accessAuthorization: agencyAdminAuth,
      routeTenantParam: "IMOB-4050",
      options: {
        allowedPapeis: ["master_adm", "admin_imobiliaria"],
      },
    });
    expect(byCodigo.allowed).toBe(true);

    const otherAgency = evaluateRouteAccess({
      user: { uid: "u-imob", email: "diretor@imob-alpha.com.br", emailVerified: true },
      accessAuthorization: agencyAdminAuth,
      routeTenantParam: "IMOB-9999",
      options: {
        allowedPapeis: ["master_adm", "admin_imobiliaria"],
      },
    });
    expect(otherAgency.allowed).toBe(false);
    expect(otherAgency.reason).toBe("forbidden_tenant");
  });

  it("isolates autonomous brokers strictly to their own tenant_id", () => {
    const ownTenant = evaluateRouteAccess({
      user: { uid: "u-solo", email: "solo@corretor.com", emailVerified: true },
      accessAuthorization: autonomousBrokerAuth,
      routeTenantParam: "corr_solo_7",
      options: { allowedRoles: ["corretor"] },
    });
    expect(ownTenant.allowed).toBe(true);

    const otherTenant = evaluateRouteAccess({
      user: { uid: "u-solo", email: "solo@corretor.com", emailVerified: true },
      accessAuthorization: autonomousBrokerAuth,
      routeTenantParam: "imob_alpha",
      options: { allowedRoles: ["corretor"] },
    });
    expect(otherTenant.allowed).toBe(false);
    expect(otherTenant.reason).toBe("forbidden_tenant");
  });

  it("blocks non-master users missing a tenant_id when requireTenantId is enabled", () => {
    const result = evaluateRouteAccess({
      user: verifiedBrokerUser,
      accessAuthorization: {
        authorized: true,
        role: "corretor",
        code: "ok",
        message: "OK",
        papel: "corretor",
        tipoConta: "autonomo",
      },
      options: { requireTenantId: true },
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("missing_tenant");
  });

  it("allows master_adm override across tenants when allowMasterOverride is true", () => {
    const result = evaluateRouteAccess({
      user: { uid: "u-master", email: "lourenco.consultorimob@gmail.com", emailVerified: true },
      accessAuthorization: masterAuth,
      routeTenantParam: "imob_alpha",
      options: {
        allowedRoles: ["master_adm", "admin_imobiliaria"],
        allowMasterOverride: true,
      },
    });

    expect(result.allowed).toBe(true);
    expect(result.session?.isMaster).toBe(true);
  });

  it("sanitizes unsafe external redirect paths to /login", () => {
    expect(sanitizeInternalRedirect("https://evil.example/phish")).toBe("/login");
    expect(sanitizeInternalRedirect("//evil.example")).toBe("/login");
    expect(sanitizeInternalRedirect("/\\evil")).toBe("/login");
    expect(sanitizeInternalRedirect("/login")).toBe("/login");
    expect(sanitizeInternalRedirect("/")).toBe("/");
  });
});
