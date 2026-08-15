# KEIRA Release II — Security, Integrity, and Upgrade Roadmap

**Audit date:** August 15, 2026  
**Audited revision:** `2af0355` — `compound KEIRA response controls and local recall`  
**Scope:** The active KEIRA source and build path, including authenticated tRPC procedures, first-party auth, Bedrock and S3 gateways, profile-backed response controls, local dialogue recall, runtime headers, deployment helper, production dependency audit, and the São Paulo self-hosting runbook.

> **Decision:** KEIRA’s active product behavior is coherent and materially stronger after Release II, but it is **not yet ready for public deployment**. A verified production dependency audit reports one critical and twenty-one high findings. Those must be remediated and re-audited before the public edge is opened.

## Executive assessment

KEIRA is now a **conversation-first Bedrock intelligence node** with explicit, operator-controlled behavior rather than hidden or decorative model settings. Release II materially improved the contract between the operator, stored dialogue, and model inference. The selected response objective changes the real Bedrock system instruction; the carryover policy limits the exact number of prior messages supplied to the next turn; and recall searches only the authenticated operator’s own saved dialogue before any deliberate promotion to the operator-owned ledger.

The active runtime is narrow by design. Only `auth.*` and `portal.chat.*` are mounted. The source verification confirms that legacy Forge-backed orchestration, platform OAuth, payment routes, mirror routes, and other legacy surface areas are not mounted into the active API router. Direct Bedrock and S3 calls remain server-side. This is the correct sovereignty boundary, but it does not remove the need to maintain the open-source dependency tree.

| Audit area | Verified Release II state | Assessment | Required action before public launch |
|---|---|---|---|
| API surface | `auth.*` and `portal.chat.*` only; legacy router families excluded by regression test | **Pass** | Keep the integration test as a release gate. |
| Authentication | Scrypt password hashes, timing-safe owner-token comparison, signed HTTP-only cookies, HTTPS-aware `Secure` flag | **Pass with hardening gap** | Add rate limits and reduce/revalidate the one-year session lifetime. |
| Authorization | Conversation, recall, and ledger access are scoped to authenticated `userId`; recall promotion rechecks ownership | **Pass** | Preserve ownership tests as new endpoints are added. |
| Input boundaries | Zod validates procedure input; Express limits JSON and URL-encoded bodies to 1 MB | **Pass** | Add per-route abuse controls at Nginx or application edge. |
| Inference integrity | Bedrock is the only active model path; response objective and calibration reach the live request | **Pass** | Keep research and realtime voice marked unavailable until configured. |
| Stored context | Active ledger is inspectable, pausable, deleteable; recall requires explicit operator promotion | **Pass** | Add retention/export/delete policy before multi-user public launch. |
| Browser rendering | Markdown is rendered with `streamdown`; no direct application use of `dangerouslySetInnerHTML` was found outside a generic chart component | **Conditional** | Update the transitive Markdown/diagram sanitizer chain before public launch. |
| Web edge | `X-Content-Type-Options`, frame denial, referrer policy, permissions policy, and COOP are set | **Pass with hardening gap** | Add CSP, HSTS at the HTTPS edge, and Nginx request-rate controls. |
| Dependency posture | `pnpm audit --prod --audit-level=moderate` reports **1 critical, 21 high, 49 moderate, and 10 low** findings | **Fail / deployment blocker** | Upgrade or remove vulnerable direct and transitive production dependencies, then re-run audit. |

## Release II implementation audit

The most important improvement is that operator controls are no longer merely visual. The `direct`, `analysis`, `creative`, and `plan` objectives are persisted in the user profile, validated in the `auth.updateProfile` contract, and inserted into the live Bedrock system instruction. Each objective imposes a different answer structure: direct conclusion, structured analysis, clearly labelled imaginative work, or executable planning.

The carryover control is similarly concrete. `minimal`, `standard`, and `extended` map to two, six, and twelve prior messages. The current operator message is intentionally excluded from the carryover slice because it is provided separately as the current Bedrock input, preventing duplicate current-turn content. The UI displays the active objective and the exact count used after a response.

The local-recall design is also sound for the current scope. It uses a scoped text query against the authenticated operator’s own `portalChatMessages` records and does not claim semantic retrieval, web search, or invisible long-term memory. A recalled message does not become model context automatically. The operator must choose a ledger type and explicitly promote it; server code rechecks message ownership before creating the active ledger entry.

| Implemented capability | Evidence in current release | Truthfulness boundary |
|---|---|---|
| Response objectives | Persisted profile enum, validated tRPC input, live Bedrock prompt contract | Does not imply a different underlying model. |
| Carryover policy | Exact 2/6/12 prior-message limits applied before Bedrock inference | Does not imply unlimited or hidden memory. |
| Dialogue recall | Authenticated local search over saved operator dialogue | Is not web research, vector retrieval, or cross-user search. |
| Context promotion | Explicit recall-to-ledger mutation with ownership validation | Does not automatically treat old dialogue as fact. |
| Answer-quality contract | System instruction requires stated assumptions, uncertainty, and no invented citations | Cannot verify fresh facts without a configured research provider. |
| Research / realtime voice | Capability inventory remains `awaiting-configuration` | Not represented as active capability. |

## Security findings and release gates

### Deployment-blocking supply-chain finding — Critical

The production audit identifies a critical `fast-xml-parser` advisory in the AWS S3 dependency chain. The resolved dependency is `fast-xml-parser@5.2.5`; the audit identifies a patched version of `5.3.5` or later. The affected dependency is transitive through `@aws-sdk/client-s3` and related AWS SDK packages. The public deployment must be paused until the AWS SDK dependency family is updated to a release resolving this chain, the lockfile is regenerated, and `pnpm audit --prod` no longer reports the critical advisory. The upstream advisory documents the entity-processing denial-of-service risk.[1]

### High-severity production dependency findings

The same production audit reports high-severity issues in direct and transitive dependencies, including `axios`, `nanoid`, `@trpc/server`, `drizzle-orm`, `path-to-regexp`, `lodash`/`lodash-es`, and the `streamdown → mermaid → dompurify` rendering chain. Two distinctions matter. First, `axios` has no active source call site in KEIRA and should be removed if the application does not need it. Second, transitive fixes should not be forced blindly: update their immediate parent packages, run the full suite and production build, and only then update the lockfile. The `streamdown` path should receive special attention because KEIRA renders model-generated Markdown in the browser.

| Severity | Finding | Current exposure | Remediation gate |
|---|---|---|---|
| Critical | `fast-xml-parser` via AWS S3 SDK dependency chain | Server process includes S3 client dependency tree | Update aligned AWS SDK packages until audit resolves it. |
| High | `axios` direct dependency | No active KEIRA call site found | Remove it if unused; otherwise upgrade to the patched release. |
| High | `nanoid` direct dependency | No active KEIRA call site found in the audited active path | Remove if unused or update to an audit-clean release. |
| High | `streamdown → mermaid → dompurify` | Browser renders model output as Markdown | Upgrade the rendering chain and regression-test hostile Markdown rendering. |
| High | `@trpc/server`, `drizzle-orm`, and routing utilities | Active API and database runtime | Upgrade together cautiously, then run router, ownership, and migration tests. |

### Authentication and edge hardening — High priority, not a code exploit finding

The application correctly uses a timing-safe comparison for the owner token, scrypt for password derivation, and signed HTTP-only session cookies. The present session lifetime is one year, however, with no token-version or server-side revocation mechanism. A shorter absolute lifetime plus idle renewal, and a per-user session-version field for forced logout after password/owner-token rotation, should be the next auth hardening increment. OWASP notes that idle timeouts reduce the opportunity to reuse a compromised session.[2]

No application-level login throttling is present. Before opening public registration or exposing the owner bootstrap to more than the operator, enforce an Nginx `limit_req` policy on `/api/trpc/auth.login`, `/api/trpc/auth.register`, and `/api/trpc/auth.ownerBootstrap`, and add upstream abuse monitoring. Rate limiting is a standard API abuse-control recommendation.[3]

The Express server sets useful baseline headers, but a production TLS configuration should additionally set a Content Security Policy and HTTP Strict Transport Security after the certificate is active. Keep Nginx as the only public ingress, bind the application only to loopback, and do not expose the Node port in the Lightsail firewall. For AWS credentials and S3 access, prefer an instance role or narrowly scoped access keys; AWS recommends granting only permissions required for the task.[4]

### Deployment configuration drift — Medium

The checked-in helper and runbook currently use **port 3000** and a KEIRA host example, while earlier operational notes referenced **port 3210** and `portal.xinus.one`. The server can also silently select the next available port if its preferred port is busy. That behavior is convenient in development but undesirable in production because Nginx may continue proxying to the configured port while the process moved elsewhere. Standardize the deployed application on one port, configure Nginx to match, and change production startup to fail closed if that configured port is unavailable. This is a reliability and safe-deployment issue rather than an immediate remote-execution vulnerability.

## Recommended upgrade tiers

The following roadmap improves KEIRA’s differentiated capability without pretending that unconfigured providers are already present. It prioritizes **verifiable quality, operator control, and deployment resilience** over feature count.

| Tier | Upgrade | What it adds | Prerequisite | Status |
|---|---|---|---|---|
| 0 | Dependency remediation and hardened edge | Audit-clean runtime, CSP/HSTS, rate limits, fixed production port | Dependency compatibility validation | **Required before public deployment** |
| 1 | Session and account security | Session revocation, shorter absolute and idle expiry, owner-token rotation flow, login telemetry without sensitive content | Schema migration and Nginx/application rate limit | Buildable now |
| 1 | Bounded evidence workspace | Operator-uploaded sources, extracted source cards, answer-to-source references, explicit evidence freshness | S3 metadata + document parsing service | Buildable with controlled scope |
| 1 | Research provider adapter | Search connector with source URL/date display and a strict “research unavailable” fallback | Chosen provider credential and policy | Provider-dependent |
| 2 | Retrieval-quality recall | Operator-approved embeddings, ranked recall previews, consented promotion, per-entry provenance and freshness | Embedding model and vector storage decision | Buildable after provider choice |
| 2 | Advanced voice runtime | Streaming speech-to-text, interruption/barge-in, low-latency speech synthesis, device status and privacy controls | Selected realtime voice provider and audio transport | Provider-dependent |
| 2 | Long-document intelligence | File ingest, chunk inspection, document-scoped questions, cited synthesis, deletion lifecycle | Parser/virus-scanning/storage pipeline | Buildable with controlled scope |
| 3 | Evaluated quality system | Curated benchmark set, regression scoring for accuracy/structure/style, red-team cases, release thresholds | Human-authored evaluation rubric | Buildable now |
| 3 | Tool-use execution | Explicit tools, confirmation gates, audit log, scoped credentials, reversible actions | Per-tool connector and approval model | Buildable one tool at a time |

The Tier 1 evidence workspace is the most valuable next product upgrade after security remediation. It turns “knowledgeable” from a branding claim into an inspectable workflow: a response can state what it knows from operator-provided material, what it infers, and what it cannot verify. Research integration should come after that evidence contract exists, so current web claims can be cited and dated rather than blended invisibly with model knowledge.

The Tier 3 evaluated quality system is the route to meaningful competitive progress. “Better than every other model” is not a testable global claim. KEIRA can instead set a concrete bar: define a local benchmark across direct answers, multi-step analysis, planning, esoteric exploration, source-bound synthesis, and conversation continuity; score each release; and block regressions. That creates an auditable intelligence-node advantage rather than an unmeasurable marketing promise.

## Verification and remediation sequence

1. Upgrade or remove the dependencies identified by `pnpm audit --prod`; do not use a blind force-upgrade.
2. Run `pnpm test`, `pnpm check`, `pnpm build`, `bash -n deploy-lightsail.sh`, and `pnpm audit --prod --audit-level=moderate`.
3. Add production edge controls: rate limiting, CSP, HSTS after TLS, exact loopback port binding, and firewall rules for only ports 80/443.
4. Regenerate and review migrations, then apply them on the production RDS only after the release passes locally.
5. Update the Lightsail checkout to the audited commit, configure `.env` directly on the instance, and verify health locally before DNS or TLS activation.

## References

[1] [GitHub Security Advisory GHSA-37qj-frw5-hhjh — fast-xml-parser](https://github.com/NaturalIntelligence/fast-xml-parser/security/advisories/GHSA-37qj-frw5-hhjh)  
[2] [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)  
[3] [OWASP REST Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html)  
[4] [AWS IAM Security Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
