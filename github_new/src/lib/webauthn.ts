/**
 * WebAuthn (biometria FIDO2) — wrapper frontend.
 * Cadastro independente por domínio. Fallback sempre disponível para senha tradicional.
 */
import {
  startRegistration,
  startAuthentication,
  browserSupportsWebAuthn,
  platformAuthenticatorIsAvailable,
} from "@simplewebauthn/browser";
import { supabase } from "@/integrations/supabase/client";
import { setSessionToken, setUserEmail } from "@/lib/eliteUtils";

const FLAG_PREFIX = "elite_biometria_registered_";

function flagKey(email: string) {
  // Per-domain isolation
  return `${FLAG_PREFIX}${window.location.hostname}_${email.trim().toLowerCase()}`;
}

export function isBiometriaSupported(): boolean {
  return browserSupportsWebAuthn();
}

export async function isBiometriaPlatformAvailable(): Promise<boolean> {
  try {
    if (!browserSupportsWebAuthn()) return false;
    return await platformAuthenticatorIsAvailable();
  } catch {
    return false;
  }
}

export function hasLocalBiometriaFor(email: string): boolean {
  if (!email) return false;
  return localStorage.getItem(flagKey(email)) === "1";
}

export function markLocalBiometria(email: string) {
  localStorage.setItem(flagKey(email), "1");
}

export function clearLocalBiometria(email: string) {
  localStorage.removeItem(flagKey(email));
}

export async function registerBiometria(email: string, deviceName?: string): Promise<void> {
  if (!isBiometriaSupported()) throw new Error("Navegador não suporta biometria.");
  const normalized = email.trim().toLowerCase();

  const { data: beginData, error: beginErr } = await supabase.functions.invoke(
    "webauthn-register-begin",
    { body: { email: normalized, device_name: deviceName } }
  );
  if (beginErr || !beginData?.options) {
    throw new Error(beginData?.error || beginErr?.message || "Falha ao iniciar cadastro.");
  }

  const attResp = await startRegistration(beginData.options);

  const { data: finishData, error: finishErr } = await supabase.functions.invoke(
    "webauthn-register-finish",
    { body: { email: normalized, response: attResp, device_name: deviceName } }
  );
  if (finishErr || !finishData?.success) {
    throw new Error(finishData?.error || finishErr?.message || "Falha ao concluir cadastro.");
  }

  markLocalBiometria(normalized);
}

export async function loginWithBiometria(
  email: string,
  deviceFingerprint?: string
): Promise<{ email: string; sessionToken: string }> {
  if (!isBiometriaSupported()) throw new Error("Navegador não suporta biometria.");
  const normalized = email.trim().toLowerCase();

  const { data: beginData, error: beginErr } = await supabase.functions.invoke(
    "webauthn-auth-begin",
    { body: { email: normalized } }
  );
  if (beginErr || !beginData?.options) {
    throw new Error(beginData?.error || beginErr?.message || "Biometria não cadastrada neste domínio.");
  }

  const assertion = await startAuthentication(beginData.options);

  const { data: finishData, error: finishErr } = await supabase.functions.invoke(
    "webauthn-auth-finish",
    { body: { email: normalized, response: assertion, device_fingerprint: deviceFingerprint } }
  );
  if (finishErr || !finishData?.success || !finishData?.session_token) {
    throw new Error(finishData?.error || finishErr?.message || "Falha ao validar biometria.");
  }

  setSessionToken(finishData.session_token);
  setUserEmail(finishData.email);
  markLocalBiometria(finishData.email);

  return { email: finishData.email, sessionToken: finishData.session_token };
}
