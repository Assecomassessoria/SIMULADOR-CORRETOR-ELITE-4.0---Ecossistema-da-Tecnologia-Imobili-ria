# Security Specification — Multi-Tenant Isolation & Hybrid Auth (Firestore Rules TDD)

## 1. Data Invariants (Multi-Tenant Zero Data Leakage)
1. **Unique Identity & Tenant Partitioning**:
   - Every paying Real Estate Agency (`/administrativo/{id}`, `tipo == 'imobiliaria'`) has a unique `codigoCadastro` (`IMOB-XXXX`), `tenantId == id`, `tipoConta == 'imobiliaria'`, and `papel == 'admin_imobiliaria'`.
   - Every Broker/Client (`/corretor_elite/{id}`) has a unique `codigoCorretor` (`CORR-XXXX`):
     - **Autonomous (`modalidade == 'individual'`)**: `tenantId == id`, `tipoConta == 'autonomo'`, no `imobiliariaId`/`imobiliariaEmail`. Zero agency visibility into this broker.
     - **Agency-Linked (`modalidade == 'imobiliaria'`)**: `tenantId == imobiliariaId`, `tipoConta == 'imobiliaria'`, `imobiliariaEmail == agency.email`.
2. **Strict Cross-Tenant & Cross-Broker Isolation**:
   - An Agency (`admin_imobiliaria`) can ONLY read its own `/administrativo/{id}` doc and ONLY `/corretor_elite` & `/tenant_records` documents belonging to its own `tenantId` (`imobiliariaEmail == request.auth.token.email`). Zero access to other agencies or autonomous brokers.
   - A Broker (autonomous or linked) can ONLY read its own `/corretor_elite/{id}` doc (`email == request.auth.token.email`) and its own `/tenant_records` (`corretorEmail == request.auth.token.email && ownerUid == request.auth.uid`). Zero access to other brokers (even in the same agency) or other agencies.
3. **Hybrid Auth Binding Without Privilege Escalation**:
   - Both Email+Password (personal password) and Google OAuth require `request.auth.token.email_verified == true` (`isVerified()`).
   - Authenticated users may ONLY bind `googleSubId == request.auth.uid` and `senhaPessoalConfigurada` on their own pre-registered contract doc (`existing().email == request.auth.token.email`), and can NEVER mutate `tenantId`, `codigoCorretor`, `codigoCadastro`, `imobiliariaId`, `autorizado`, `pagamentoConfirmado`, `status`, or `plano`.
4. **Master Gate (`isActiveAgencyOwner`)**:
   - An Agency can create, toggle status, or delete linked brokers ONLY if its `/administrativo/{imobId}` doc exists, has `tipo == 'imobiliaria'`, `email == request.auth.token.email`, `autorizado == true`, `pagamentoConfirmado == true`, and `status == 'ativo'`.

## 2. The "Dirty Dozen" Payloads (Must ALL Return PERMISSION_DENIED)
1. **Cross-Agency Broker Snooping**: Agency A attempts `get` or `list` on Agency B's brokers or autonomous brokers.
2. **Cross-Broker Snooping (Same Agency)**: Broker 1 of Agency A attempts `get` or `list` on Broker 2 of Agency A.
3. **Cross-Agency Contract Read**: Agency A attempts `get` on Agency B's `/administrativo/{agencyBId}` doc.
4. **Email Spoofing (`email_verified == false`)**: Unverified Email/Password account matching an authorized broker or admin email attempts `get`/`update`.
5. **Self-Authorization Escalation**: Broker attempts `update` on own `/corretor_elite/{id}` to flip `autorizado: true`, `pagamentoConfirmado: true`, `status: 'ativo'`, or change `tenantId`.
6. **Spoofed `googleSubId` Binding**: Broker attempts `update` on own doc setting `googleSubId` to another user's UID.
7. **Shadow Field Injection**: Create or update with undocumented key `isSuperAdmin: true`.
8. **Suspended/Unpaid Agency Broker Registration**: Agency with `pagamentoConfirmado: false` or `status: 'bloqueado'` tries to create a broker.
9. **Agency Forging Autonomous Broker**: Active agency tries to create a broker with `modalidade: 'individual'` or `tenantId != imobiliariaId`.
10. **Cross-Tenant Business Record Injection**: Broker of Agency A tries to create a `/tenant_records` doc with `tenantId` of Agency B or `ownerUid != request.auth.uid`.
11. **ID Poisoning / Size Overflow**: Document ID with invalid chars (`../admin`) or string field exceeding blueprint `maxLength`.
12. **Client-Forged Timestamp / Immutable Field Tampering**: Attempt to modify `createdAt`, `createdBy`, `email`, or `id`, or set `updatedAt` != `request.time`.
