# Portal — Security, API, and Self-Hosting Audit

**Audit scope.** This report covers the committed Portal source tree and its self-hosted production path: the Express entrypoint, tRPC router, first-party authentication, Amazon Bedrock gateway, S3 transcript storage, Vite build configuration, deployment helper, and tracked configuration artifacts. It is a source-and-build audit, not an attestation that a particular AWS account has model access, IAM permissions, DNS, or network controls configured.

## Executive conclusion

Portal’s active production request path is self-hostable with **AWS RDS/MySQL**, **Amazon Bedrock**, **Amazon S3**, **Nginx**, and **PM2**. The code no longer uses platform OAuth, platform analytics, platform LLM routing, platform storage proxying, or a platform Vite runtime plugin. Legacy platform-bound helper modules and an accidentally tracked managed-project configuration file were removed from the Git-tracked release.

The build, strict TypeScript check, production static-serving smoke test, and full Vitest suite must be run for every release. The validated status for this release is recorded in the deployment checkpoint and associated test output.

| Area | Verified state | Operational requirement |
|---|---|---|
| Authentication | First-party password and owner-bootstrap sessions use signed HTTP-only JWT cookies. | Set strong, unique `JWT_SECRET` and `PORTAL_OWNER_ACCESS_TOKEN` values. |
| AI inference | The active chat path calls the direct Amazon Bedrock gateway. | Configure `BEDROCK_API_KEY` **or** IAM credentials, plus the selected region and model. |
| Persistence | Drizzle uses `DATABASE_URL` for portable MySQL/AWS RDS connectivity. | Enforce TLS to RDS and restrict the security group to the instance. |
| Exports | Transcript objects are written directly to S3 with `aws:kms` server-side encryption and short-lived signed download URLs. | Supply an existing S3 bucket and grant least-privilege object/KMS access. |
| Web edge | Nginx terminates TLS and proxies only to loopback port `3000`. | Expose ports `80` and `443`, not port `3000`; complete Let’s Encrypt after DNS is live. |

## Active API surface

The active tRPC router mounts only `auth.*` and `portal.chat.*` procedures. The regression suite explicitly verifies that legacy `kg.*`, `mirror.*`, `subscription.*`, and `system.*` procedures are not mounted.

| Endpoint family | Access | Control boundary |
|---|---|---|
| `/api/trpc/auth.me` | Public | Reads a valid session cookie and returns the current identity or no identity. |
| `/api/trpc/auth.login` and `/api/trpc/auth.register` | Public | Input is validated before first-party password/session operations. |
| `/api/trpc/auth.ownerBootstrap` | Public caller, secret-gated | Requires the private `PORTAL_OWNER_ACCESS_TOKEN`; treat it as a high-value credential and rotate it if exposed. |
| `/api/trpc/auth.logout` | Authenticated session | Clears the Portal session. |
| `/api/trpc/portal.chat.*` | Authenticated session | Enforces session context and conversation ownership by user ID. |
| `/api/trpc/*` | HTTP request envelope | Express applies 1 MB JSON and URL-encoded body limits. |

There is deliberately **no** active Stripe webhook, Mirror, knowledge-graph, subscription, platform-system, map, transcription, image-generation, or external-data API route. Those inactive platform-bound modules have been removed from the release source.

## Runtime hardening

The Express entrypoint disables `X-Powered-By` and sets `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, and `Cross-Origin-Opener-Policy` headers. Nginx must remain the public ingress. The supplied `deploy-lightsail.sh` script binds Portal locally and configures Nginx to route public traffic to `127.0.0.1:3000`.

Application-level login throttling is not implemented in the audited code. Add an Nginx `limit_req` zone or an upstream WAF/rate-limit policy before inviting public traffic. This is an explicit deployment control, not a claim of a currently configured service.

## Required production configuration

| Variable | Purpose | Keep secret? |
|---|---|---|
| `DATABASE_URL` | MySQL/AWS RDS connection string | Yes |
| `JWT_SECRET` | Signs first-party session cookies | Yes |
| `PORTAL_OWNER_ACCESS_TOKEN` | Gates owner bootstrap | Yes |
| `BEDROCK_API_KEY` | Preferred direct Bedrock bearer-token auth | Yes |
| `BEDROCK_REGION` | Bedrock invocation region; configured for `sa-east-1` | No |
| `BEDROCK_MODEL_ID` | Bedrock model identifier; configured for `anthropic.claude-opus-5` | No |
| `PORTAL_S3_BUCKET` / `PORTAL_S3_REGION` | Encrypted transcript export location | Bucket name is operationally sensitive |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | Alternative IAM auth when no bearer token is used | Yes |

Before deployment, verify in the AWS console that the selected AWS account has access to the chosen model and that the configured identity can invoke it in the configured region. The source code can validate configuration shape; only an AWS account can grant access entitlement.

## Git and release hygiene

The Git-tracked managed-project configuration file was removed because it contained platform-specific connection metadata. It remains ignored locally and must never be recommitted. Do not commit `.env` files, RDS passwords, Bedrock bearer tokens, IAM keys, or generated transcript exports. If a secret ever entered Git history, rotate it in its owning service; deleting a current file does not revoke a previously exposed value.

## Release gate

Use the following release gate before an AWS deployment:

```bash
pnpm check
pnpm test
pnpm build
bash -n deploy-lightsail.sh
```

After the service starts, verify the local process before routing live traffic:

```bash
curl -I http://127.0.0.1:3000/
pm2 status
pm2 logs portal-sovereign --lines 50
```

The detailed, console-oriented procedure is maintained in [LIGHTSAIL_DEPLOYMENT_GUIDE.md](./LIGHTSAIL_DEPLOYMENT_GUIDE.md).
