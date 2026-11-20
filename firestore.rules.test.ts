import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const RULES_PATH = path.resolve(process.cwd(), "firestore.rules");
const BLUEPRINT_PATH = path.resolve(process.cwd(), "firebase-blueprint.json");

describe("Firestore Security Rules — Dirty Dozen Structural Verification", () => {
  const rules = fs.existsSync(RULES_PATH) ? fs.readFileSync(RULES_PATH, "utf8") : "";
  const blueprint = JSON.parse(fs.readFileSync(BLUEPRINT_PATH, "utf8"));

  it("enforces rules_version = '2' and default-deny catch-all", () => {
    expect(rules).toContain("rules_version = '2';");
    expect(rules).toMatch(/match \/\{document=\*\*\}\s*\{\s*allow read, write: if false;\s*\}/);
  });

  it("blocks email spoofing by requiring email_verified == true in isAdmin and verified writes", () => {
    expect(rules).toContain("request.auth.token.email_verified == true");
    expect(rules).toContain("lourenco.consultorimob@gmail.com");
  });

  it("enforces ID poisoning guard (isValidId) matching blueprint regex", () => {
    const uidPattern = blueprint.entities.UserProfile.properties.uid.pattern;
    expect(uidPattern).toBe("^[a-zA-Z0-9_\\-]+$");
    expect(rules).toContain("function isValidId(id)");
    expect(rules).toContain("isValidId(userId)");
  });

  it("prevents shadow fields and self-assigned admin roles in UserProfile validation", () => {
    expect(rules).toContain("function isValidUserProfile(data)");
    expect(rules).toContain("data.keys().hasAll(");
    expect(rules).toContain("data.keys().hasOnly(");
    expect(rules).toContain("affectedKeys().hasOnly(");
    expect(rules).toContain("incoming().role == 'user'");
  });

  it("enforces strict size bounds synchronized with firebase-blueprint.json", () => {
    const props = blueprint.entities.UserProfile.properties;
    expect(rules).toContain(`<= ${props.email.maxLength}`);
    expect(rules).toContain(`<= ${props.displayName.maxLength}`);
    expect(rules).toContain(`<= ${props.photoURL.maxLength}`);
  });

  it("enforces temporal integrity (request.time) and immutable createdAt/uid", () => {
    expect(rules).toContain("incoming().createdAt == request.time");
    expect(rules).toContain("incoming().updatedAt == request.time");
    expect(rules).toContain("incoming().createdAt == existing().createdAt");
    expect(rules).toContain("incoming().uid == existing().uid");
  });

  it("protects PII on /users/{userId} and secures list queries without DB lookups", () => {
    expect(rules).toContain("allow get: if isValidId(userId) && (isOwner(userId) || isAdmin());");
    expect(rules).toContain("allow list: if isSignedIn() && resource.data.uid == request.auth.uid;");
  });

  it("restricts /admins/{userId} reads and writes strictly to verified admins", () => {
    expect(rules).toContain("match /admins/{userId}");
    expect(rules).toContain("function isValidAdminRecord(data)");
  });
});
