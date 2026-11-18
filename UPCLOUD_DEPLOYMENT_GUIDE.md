# KEIRA Intelligence — UpCloud Deployment Guide

This runbook deploys KEIRA Intelligence as an operator-managed service on an UpCloud Ubuntu host. It is configuration guidance only: successful execution is required before claiming that KEIRA is live. The current operator-declared host is `87.58.152.89`, with the public hostname `keira.nexinus.net`.

## Deployment boundary

- KEIRA is the canonical intelligence application and repository.
- The Node process binds to `127.0.0.1:3210`.
- Nginx is the public HTTPS reverse proxy.
- MariaDB/MySQL is local or operator-managed; the connection string remains outside Git.
- Local model inference is optional and must use an operator-controlled OpenAI-compatible endpoint.
- No external AI provider is enabled by this runbook.
- Do not treat an IP address, DNS record, HTTP response, or model response as proof of identity, legal authority, or mesh health.

## 1. Host prerequisites

Run these commands on the confirmed UpCloud Ubuntu host, not in the development sandbox:

```bash
hostname
cat /etc/os-release
ip -brief address
free -h
df -h /
sudo apt-get update
sudo apt-get install -y ca-certificates curl git build-essential nginx certbot python3-certbot-nginx mariadb-server
```

Confirm that the host is the operator-approved UpCloud machine before changing services. Do not run this procedure on another node.

## 2. Node.js, pnpm, and PM2

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pnpm pm2
node --version
pnpm --version
```

## 3. Application checkout

```bash
sudo install -d -o "$USER" -g "$USER" /opt/keira
if [[ -d /opt/keira/.git ]]; then
  git -C /opt/keira fetch origin main
git -C /opt/keira checkout main
git -C /opt/keira pull --ff-only origin main
else
  git clone --branch main https://github.com/tychomorr-ui/keira.git /opt/keira
fi
cd /opt/keira
pnpm install --frozen-lockfile
```

## 4. Protected environment

Create `/etc/keira/keira.env` using the operator’s secret-management procedure. Never commit this file or paste its values into GitHub.

```env
NODE_ENV=production
HOST=127.0.0.1
PORT=3210
DATABASE_URL=mysql://keira_user:REPLACE_WITH_SECRET@127.0.0.1:3306/keira
JWT_SECRET=REPLACE_WITH_RANDOM_SECRET
PORTAL_OWNER_ACCESS_TOKEN=REPLACE_WITH_RANDOM_SECRET
BETA_OPEN_MODE=false
KEIRA_IDENTITY_ROOT_SECRET=REPLACE_WITH_RANDOM_32_PLUS_CHARACTER_SECRET

# Optional local-only model lane. Leave endpoint and model empty for deterministic mode.
KEIRA_LLM_RUNTIME=ollama
KEIRA_LLM_ENDPOINT=
KEIRA_LLM_MODEL=
KEIRA_LLM_FALLBACK_MODEL=
KEIRA_LLM_API_KEY=
KEIRA_LLM_MAX_TOKENS=4096
KEIRA_LLM_NUM_CTX=2048
KEIRA_LLM_TEMPERATURE=0
KEIRA_LLM_TOP_P=1
KEIRA_LLM_SEED=42
KEIRA_LLM_TIMEOUT_MS=60000

# Optional transcript object storage; keep empty unless explicitly configured.
PORTAL_S3_BUCKET=
PORTAL_S3_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_SESSION_TOKEN=
```

```bash
sudo install -d -m 700 /etc/keira
sudo chown root:root /etc/keira/keira.env
sudo chmod 600 /etc/keira/keira.env
```

## 5. Database, build, and process

Review the committed migrations before applying them. The command below must stop on the first SQL error.

```bash
cd /opt/keira
set -a
source /etc/keira/keira.env
set +a
pnpm drizzle-kit migrate
pnpm check
pnpm test
pnpm build
```

Create a systemd environment reference or PM2 ecosystem configuration that reads `/etc/keira/keira.env`; do not copy the secrets into the repository. Then start the application:

```bash
pm2 delete keira-intelligence 2>/dev/null || true
pm2 start dist/index.js --name keira-intelligence --cwd /opt/keira --update-env
pm2 save
pm2 status
```

## 6. Nginx and TLS

Create `/etc/nginx/sites-available/keira`:

```nginx
limit_req_zone $binary_remote_addr zone=keira_auth:10m rate=10r/m;

server {
    listen 80;
    server_name keira.nexinus.net;

    location ~ ^/api/trpc/auth\.(login|register|ownerBootstrap) {
        limit_req zone=keira_auth burst=5 nodelay;
        proxy_pass http://127.0.0.1:3210;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:3210;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and validate it:

```bash
sudo ln -sfn /etc/nginx/sites-available/keira /etc/nginx/sites-enabled/keira
sudo nginx -t
sudo systemctl reload nginx
curl -fsSI http://127.0.0.1:3210/
curl -fsSI http://127.0.0.1/
```

Only after DNS for `keira.nexinus.net` is confirmed to point to the approved host:

```bash
sudo certbot --nginx -d keira.nexinus.net
curl -fsSI https://keira.nexinus.net/
```

## 7. Verification and rollback

Record the exact Git commit, database migration result, process status, local HTTP status, HTTPS status, certificate expiry, and model mode. A healthy response is not sufficient to assert signed ATMOS identity; use the separate ATMOS verifier and operator authorization for that.

For an update:

```bash
cd /opt/keira
git fetch origin main
git checkout main
git pull --ff-only origin main
pnpm install --frozen-lockfile
pnpm drizzle-kit migrate
pnpm check
pnpm test
pnpm build
pm2 restart keira-intelligence --update-env
```

If verification fails, stop the process, preserve logs and the release identifier, and return to the previously approved release using a reviewed rollback procedure. Do not automatically retry provider or network operations.
