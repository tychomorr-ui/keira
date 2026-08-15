# KEIRA — Sovereign Intelligence Node

KEIRA is the sovereign ecosystem's dedicated conversational intelligence node. It provides direct, long-context dialogue, adaptive persona manifestation, esoteric keyword awareness, secure first-party sessions, optional browser voice interaction, encrypted transcript export, and Amazon Bedrock-backed response generation.

KEIRA is intentionally distinct from its sibling systems: Tesseract-A provides the mirror and recovery entity experience, including the KEIRA$KHAOS mode; Root provides sovereign identity; XinUS Clarity provides practical public-service workflows; and Cosmic Net / Tesseract Terminus provides the network and universal-truth console.

## Runtime Architecture

The production request path is self-hosted. KEIRA uses Express and tRPC for its application API, MySQL-compatible AWS RDS for application data, Amazon Bedrock for model invocation, and Amazon S3 for transcript storage. First-party email/password and owner-bootstrap sessions use signed HTTP-only cookies. Nginx provides the public reverse proxy, and PM2 supervises the production Node process.

| Component | Production responsibility |
|---|---|
| React + Vite | Conversation-first operator interface |
| Express + tRPC | Authenticated application API |
| Amazon Bedrock | Model inference through the server-side gateway |
| AWS RDS / MySQL | User, profile, conversation, and learning data |
| Amazon S3 | Transcript object storage and presigned downloads |
| Nginx + PM2 | HTTPS ingress and process supervision |

## Core Capabilities

KEIRA retains a coherent conversation history, adapts its response framing to the operator's stated preferences, highlights configured esoteric terms, supports browser speech input and synthesis where the browser provides those capabilities, exports conversation transcripts, and shows generation calibration stages without fabricating operational telemetry.

The application uses the existing internal `portal.chat.*` tRPC namespace for backward-compatible API contracts. That internal namespace is not the public product name and does not change the KEIRA interface or deployment identity.

## Local Development

Install Node.js 22 and pnpm, then install the committed dependency graph and start the development server.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Run the verification gates before committing changes:

```bash
pnpm check
pnpm test
pnpm build
```

## Self-Hosted Deployment

The dedicated repository is [`tychomorr-ui/keira`](https://github.com/tychomorr-ui/keira). The audited Lightsail sequence, required environment variables, PM2 process configuration, Nginx reverse proxy, and TLS setup are documented in [LIGHTSAIL_DEPLOYMENT_GUIDE.md](./LIGHTSAIL_DEPLOYMENT_GUIDE.md). The source and endpoint audit is documented in [SECURITY_AUDIT.md](./SECURITY_AUDIT.md).

Do not commit `.env` files, AWS credentials, Bedrock tokens, database passwords, owner keys, or signing secrets.

## License

MIT. See [LICENSE](./LICENSE) when present.
