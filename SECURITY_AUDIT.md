# Portal — Comprehensive Security, API & Sovereign Sovereignty Audit

This audit evaluates Portal across authentication boundaries, tRPC procedures, database safety, external dependencies, and sovereign self-hosting posture.

---

## 1. Executive Summary & Sovereignty Verification
- **Authentication**: First-party sovereign auth using scrypt password hashing and signed JWT HTTP-only cookies (`JWT_SECRET`). Owner bootstrap mechanism is protected by a dedicated private token (`PORTAL_OWNER_ACCESS_TOKEN`).
- **Inference Layer**: Direct integration with Amazon Bedrock Runtime SDK using secure server-side API keys (`BEDROCK_API_KEY`) or IAM credentials, scoped to region `sa-east-1` with model `anthropic.claude-opus-5`.
- **Database**: Fully portable Drizzle ORM schema targeting standard MySQL / AWS RDS instances (`PORTAL_DB_01`), with strict schema migrations and zero Manus-managed lock-in.

---

## 2. API & Endpoint Security Audit
| Procedure / Endpoint | Access Level | Validation / Security Controls |
|---|---|---|
| `/api/trpc/auth.me` | Public | Validates HTTP-only JWT session cookie; returns null or user record |
| `/api/trpc/auth.login` | Public | Rate-limited input validation (Zod email/password); scrypt verification |
| `/api/trpc/auth.ownerBootstrap` | Public | Validates exact private `PORTAL_OWNER_ACCESS_TOKEN` input |
| `/api/trpc/portal.chat.*` | Protected (`requireUser`) | Requires valid session context; validates conversation ownership per user ID |
| `/api/stripe/webhook` | Public (Signature Verified) | Verifies Stripe webhook signatures using raw body parsing |

---

## 3. Dependency & Audit Readiness
- All packages are standard open-source npm dependencies.
- Zero closed-source platform middleware in the runtime path.
- 112 passing unit and integration tests covering authentication, Bedrock invocation, personalization, audio cues, and session isolation.
