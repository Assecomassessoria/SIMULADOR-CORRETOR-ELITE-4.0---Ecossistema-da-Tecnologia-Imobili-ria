# Security Specification & Payload-First Security TDD

## 1. Data Invariants
1. **Default Deny**: All undefined collections and paths deny read and write unconditionally.
2. **Verified Identity Mandate**: Every write to `/users/{userId}` requires `request.auth != null` and `request.auth.token.email_verified == true`.
3. **PII Isolation**: `/users/{userId}` contains PII (`email`). Only the document owner (`request.auth.uid == userId`) or a verified admin (`isAdmin()`) may read (`get`) a user profile. List queries on `/users` MUST enforce `resource.data.uid == request.auth.uid` without `get()`/`exists()` calls.
4. **No Self-Assigned Privileges**: A standard user creating `/users/{userId}` MUST set `role == 'user'`. Only a verified admin may assign `role == 'admin'` or write to `/admins/{userId}`.
5. **Immutability & Temporal Integrity**: `uid`, `provider`, and `createdAt` are immutable after creation. `createdAt == request.time` on create; `updatedAt == request.time` and `lastLoginAt == request.time` on create and update.
6. **Master / Admin Verification**: Bootstrapped admin emails (`lourenco.consultorimob@gmail.com` and `simuladorcorretorelite4.0@gmail.com`) MUST also satisfy `request.auth.token.email_verified == true`.
7. **Strict Schema & Size Guards**: Every string field has explicit `is string` and `.size()` bounds, IDs match `^[a-zA-Z0-9_\-]+$`, and shadow/ghost keys are rejected via `hasAll()` + `hasOnly()` on create and `affectedKeys().hasOnly()` on update.

## 2. The "Dirty Dozen" Adversarial Payloads (All Must Fail with PERMISSION_DENIED)
1. **Unauthenticated Read**: Anonymous client calls `get(/users/user123)`.
2. **PII Cross-User Read**: Authenticated `userA` calls `get(/users/userB)`.
3. **Shadow Field Injection (Create)**: `userA` creates `/users/userA` with extra ghost field `isVerified: true`.
4. **Self-Assigned Admin Privilege**: Non-admin `userA` creates `/users/userA` with `role: "admin"`.
5. **Privilege Escalation (Update)**: Non-admin `userA` updates `/users/userA` changing `role` from `"user"` to `"admin"`.
6. **Identity Spoofing (UID Mismatch)**: `userA` creates `/users/userA` with `uid: "userB"`.
7. **Email Spoofing Attack**: Attacker with `email: "lourenco.consultorimob@gmail.com"` and `email_verified: false` tries to read `/users/userB` or write `/admins/attacker`.
8. **ID Poisoning**: Authenticated user attempts create at `/users/<200-char-invalid-id!@#>` violating `isValidId()`.
9. **Resource Poisoning (Oversized String)**: `userA` updates `/users/userA` with a 500-character `displayName` exceeding `maxLength: 120`.
10. **Immutable Timestamp Tampering**: `userA` updates `/users/userA` attempting to change `createdAt` or spoof `updatedAt` to a past timestamp instead of `request.time`.
11. **Value Poisoning on Allowed Update Field**: `userA` updates `/users/userA` setting `displayName: true` (boolean instead of string).
12. **Unauthorized Admin Registry Write**: Non-admin `userA` attempts to create `/admins/userA`.
