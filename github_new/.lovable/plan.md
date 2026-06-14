## Biometria (WebAuthn/FIDO2) — Plano de Implementação

Integração de autenticação biométrica (Face ID, Touch ID, Windows Hello, digital Android) como **alternativa opcional à senha**, mantendo o login tradicional sempre disponível como fallback.

### Regras de negócio confirmadas

- **Elegibilidade**: apenas corretores com licença **Definitiva** ou **Master** (Demo continua só com senha).
- **Multi-domínio**: cadastro independente por domínio (RP ID = hostname). O corretor que usar 2 domínios precisa cadastrar a biometria em cada um.
- **Fallback**: botão "Usar senha" sempre visível. Troca de celular = login com senha + novo cadastro.

### Arquitetura

```text
Frontend (React)                 Backend (Edge Functions Deno)         DB (Supabase)
─────────────────                ──────────────────────────────        ──────────────
LoginScreen
  ├─ "Entrar com biometria" ───► webauthn-auth-begin ──────────┐      webauthn_challenges
  │  (navigator.credentials.get)  (gera challenge, persiste)   │      (challenge, email,
  │                                                            ▼       type, expires_at)
  │  ── assertion ──────────────► webauthn-auth-finish ────────┤
  │                                (verifica + emite sessão)   │      webauthn_credentials
  │                                                            ▼      (email, credential_id,
  └─ "Usar senha" (fluxo atual)                                       public_key, counter,
                                                                       rp_id, device_name)
Settings/Perfil
  └─ "Cadastrar biometria" ────► webauthn-register-begin
     (navigator.credentials.create)  ↓
                                ► webauthn-register-finish
```

Cada edge function valida o `origin` contra a allowlist dos 4 domínios e usa `hostname` como **RP ID** (cadastros isolados).

### Etapas

1. **Migration** — criar `webauthn_credentials` e `webauthn_challenges` com RLS bloqueando acesso direto (tudo via edge function com service role).
2. **Edge functions** (4) usando `npm:@simplewebauthn/server@10`:
   - `webauthn-register-begin` — gera options de cadastro
   - `webauthn-register-finish` — verifica e persiste credencial
   - `webauthn-auth-begin` — gera options de autenticação
   - `webauthn-auth-finish` — verifica assertion, atualiza counter, emite `session_token` via `manage-session`
3. **Frontend**:
   - `src/lib/webauthn.ts` — wrapper sobre `@simplewebauthn/browser`
   - `LoginScreen.tsx` — botão "Entrar com biometria" (mostra só se navegador suporta + se houver credencial registrada localmente — cache em localStorage por domínio)
   - Painel de perfil — botão "Cadastrar biometria neste dispositivo" (só aparece para Definitiva/Master)
4. **Dependência frontend**: `@simplewebauthn/browser`.

### Detalhes técnicos

- **RP ID**: `new URL(origin).hostname` no backend. Isso garante isolamento por domínio.
- **Challenge**: gerado server-side, persistido por 5 min na tabela `webauthn_challenges`, deletado após verificação.
- **Counter FIDO2**: incrementado a cada autenticação (proteção anti-clone).
- **Plano**: verificação consulta `cadastro_comercial.plano` antes de permitir cadastro de biometria.
- **CORS**: reuso da allowlist já existente (`assecomassessoria.net.br`, `*.simuladorcorretorelite.com.br`, lovable previews).
- **Sessão**: ao autenticar com biometria, reuso `manage-session` action `create` para emitir o mesmo `session_token` do fluxo de senha (compatível com `active_sessions` e fingerprinting já em vigor).

### Confirmação necessária

Confirma para eu rodar a migration e implementar?