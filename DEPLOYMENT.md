# KEIRA Intelligence — Deployment and Operations

This document is the canonical deployment overview for KEIRA Intelligence. The application source is this repository: `tychomorr-ui/keira`. The current operator-declared host is an UpCloud Ubuntu server at `87.58.152.89`, using `https://keira.nexinus.net` as its public hostname.

This document does not assert that the host is currently live. Live status requires a read-only host check, release identification, process/database verification, DNS/TLS verification, and—when applicable—separate ATMOS signed-receipt verification.

## Runtime boundary

KEIRA runs as a Node.js application behind Nginx:

```text
HTTPS keira.nexinus.net
        |
      Nginx
        |
127.0.0.1:3210  KEIRA Intelligence
        |
  MariaDB/MySQL + optional local model endpoint
```

The application uses deterministic offline mode when no local model is configured. It must not silently fall through to external model providers.

## Deployment procedure

Use [UPCLOUD_DEPLOYMENT_GUIDE.md](./UPCLOUD_DEPLOYMENT_GUIDE.md) for the operator procedure covering:

- Ubuntu host prerequisites
- Node.js 22, pnpm, and PM2
- The `/opt/keira` release checkout
- Protected environment configuration
- Database migrations
- Build and test gates
- Nginx reverse proxy and TLS
- Verification and rollback

## Release checks

Before a release is started:

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
```

The production process is `keira-intelligence` and the application must remain bound to loopback. Do not expose port `3210` directly to the Internet.

## Secrets

Production secrets belong in the operator-controlled secret store or protected host file. Never commit database credentials, session secrets, owner tokens, local-model keys, S3 credentials, or Ed25519 private keys.

## Provider and product boundary

KEIRA Intelligence is not VALKYRIE, ROOT-GATE, ATMOS, Tesseract-A Core, or Tesseract-Terminus. It provides intelligence and bounded local reasoning; it does not issue mesh authority, certify legal outcomes, or prove remote node health.

Historical provider-specific deployment references are retired and are not current KEIRA deployment instructions.

## Authenticated federation endpoints

KEIRA includes bounded HTTP adapters for local federation. They are disabled unless `KEIRA_FEDERATION_SHARED_SECRET` is configured. The secret is used only for HMAC-SHA256 envelope verification; it does not grant execution authority.

```text
POST /api/nexal/events
  Header: x-nexal-signature: <HMAC-SHA256 hex>
  Body: signed NEXAL event envelope

POST /api/sso/report
  Body: SSO report envelope with its `signature` field
```

The SSO receiver accepts fresh, signed remote observations and rejects stale context, nonce reuse, invalid signatures, self-originated reports, and remote attempts to grant `AUTHORIZED`, `EXECUTED`, or `POSTCONDITION-VERIFIED` state locally. NEXAL delivery is separate from execution authority.

Set these only in the protected production environment when a trusted peer is configured:

```text
KEIRA_FEDERATION_SHARED_SECRET=<random 32-byte-or-longer shared secret>
KEIRA_NODE_ID=keira
KEIRA_RUNTIME_VERSION=<release identifier>
KEIRA_CONTEXT_VERSION=1
```

Generate a secret without printing it into shell history:

```bash
umask 077
FEDERATION_SECRET="$(openssl rand -hex 32)"
printf '%s\n' "$FEDERATION_SECRET" > /root/keira-federation-secret.txt
chmod 600 /root/keira-federation-secret.txt
```

Do not expose the secret in logs, URLs, Git, or browser code. Do not expose port `11434` or the federation endpoints without Nginx/TLS and peer-level access controls. The endpoint adapters are tested locally; live peer-to-peer federation requires the corresponding peer configuration and network path.
