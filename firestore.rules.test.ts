import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const RULES_PATH = path.resolve(process.cwd(), "firestore.rules");
const BLUEPRINT_PATH = path.resolve(process.cwd(), "firebase-blueprint.json");

describe("Firestore Security Rules — Multi-Tenant & Hybrid Auth Verification", () => {
  const rules = fs.existsSync(RULES_PATH) ? fs.readFileSync(RULES_PATH, "utf8") : "";
  const blueprint = JSON.parse(fs.readFileSync(BLUEPRINT_PATH, "utf8"));

  it("enforces rules_version = '2' and default-deny catch-all", () => {
    expect(rules).toContain("rules_version = '2';");
    expect(rules).toMatch(/match \/\{document=\*\*\}\s*\{\s*allow read, write: if false;\s*\}/);
  });

  it("blocks email spoofing by requiring email_verified == true across all verified rules", () => {
    expect(rules).toContain("request.auth.token.email_verified == true");
    expect(rules).toContain("lourenco.consultorimob@gmail.com");
    expect(rules).toContain("simuladorcorretorelite4.0@gmail.com");
  });

  it("enforces ID and registration code poisoning guards matching blueprint regex", () => {
    const uidPattern = blueprint.entities.UserProfile.properties.uid.pattern;
    expect(uidPattern).toBe("^[a-zA-Z0-9_\\-]+$");
    expect(blueprint.entities.AdministrativoRecord.properties.codigoCadastro.pattern).toBe(uidPattern);
    expect(blueprint.entities.CorretorEliteRecord.properties.codigoCorretor.pattern).toBe(uidPattern);
    expect(blueprint.entities.CorretorEliteRecord.properties.tenantId.pattern).toBe(uidPattern);
    expect(rules).toContain("function isValidId(id)");
    expect(rules).toContain("function isValidCode(code)");
    expect(rules).toContain("isValidId(recordId)");
  });

  it("enforces Pillar 1 Master Gate for active agencies and brokers across collections", () => {
    expect(rules).toContain("function isValidUserProfile(data)");
    expect(rules).toContain("function isValidAdminRecord(data)");
    expect(rules).toContain("function isValidCorretorElite(data)");
    expect(rules).toContain("function isValidAdministrativo(data)");
    expect(rules).toContain("function isValidTenantRecord(data)");
    expect(rules).toContain("function isActiveAgencyOwner(imobId)");
    expect(rules).toContain("function isActiveCorretorOwner(corretorId, expectedTenantId)");
    expect(rules).toContain("incoming().tenantId == incoming().imobiliariaId");
    expect(rules).toContain("incoming().imobiliariaEmail == request.auth.token.email");
  });

  it("restricts self-binding of googleSubId and senhaPessoalConfigurada without privilege escalation", () => {
    expect(rules).toContain("incoming().googleSubId == request.auth.uid");
    expect(rules).toContain(
      "incoming().diff(existing()).affectedKeys().hasOnly(['googleSubId', 'senhaPessoalConfigurada', 'updatedAt'])",
    );
    expect(rules).toContain("['google', 'password', 'google+password']");
  });

  it("enforces strict size bounds and enums synchronized verbatim with firebase-blueprint.json", () => {
    const corretorProps = blueprint.entities.CorretorEliteRecord.properties;
    const admProps = blueprint.entities.AdministrativoRecord.properties;
    const tenantRecProps = blueprint.entities.TenantBusinessRecord.properties;

    expect(rules).toContain(`<= ${corretorProps.nome.maxLength}`);
    expect(rules).toContain(`<= ${corretorProps.observacoes.maxLength}`);
    expect(rules).toContain(`<= ${corretorProps.pinHash.maxLength}`);
    expect(rules).toContain(`<= ${admProps.planoLabel.maxLength}`);
    expect(rules).toContain(`<= ${admProps.senhaAcesso.maxLength}`);
    expect(rules).toContain(`<= ${tenantRecProps.resumo.maxLength}`);
    expect(rules).toContain("['plano01', 'plano02', 'plano03', 'plano04', 'plano05', 'master']");
    expect(rules).toContain("['individual', 'imobiliaria']");
    expect(rules).toContain("['autonomo', 'imobiliaria']");
  });

  it("enforces temporal integrity (request.time) and immutable identity/tenant keys", () => {
    expect(rules).toContain("incoming().createdAt == request.time");
    expect(rules).toContain("incoming().updatedAt == request.time");
    expect(rules).toContain("incoming().createdAt == existing().createdAt");
    expect(rules).toContain("incoming().createdBy == existing().createdBy");
    expect(rules).toContain("incoming().email == existing().email");
    expect(rules).toContain("incoming().tenantId == existing().tenantId");
    expect(rules).toContain("incoming().corretorId == existing().corretorId");
  });

  it("protects PII and enforces zero-lookup multi-tenant list queries across all collections", () => {
    expect(rules).toContain("match /corretor_elite/{recordId}");
    expect(rules).toContain("match /administrativo/{recordId}");
    expect(rules).toContain("match /tenant_records/{recordId}");
    expect(rules).toContain("allow list: if isBootstrapAdmin()");
    expect(rules).toContain("resource.data.imobiliariaEmail == request.auth.token.email");
    expect(rules).toContain("resource.data.corretorEmail == request.auth.token.email");
  });
});
