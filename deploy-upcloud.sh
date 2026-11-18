#!/usr/bin/env bash
set -Eeuo pipefail

# Run on the operator-approved UpCloud Ubuntu host as a sudo-capable user.
# Review the protected environment requirements before first use.

APP_DIR="${APP_DIR:-/opt/keira}"
REPO_URL="${REPO_URL:-https://github.com/tychomorr-ui/keira.git}"
BRANCH="${BRANCH:-main}"
KEIRA_DOMAIN="${KEIRA_DOMAIN:-keira.nexinus.net}"
APP_PORT="${APP_PORT:-3210}"
ENV_FILE="${ENV_FILE:-/etc/keira/keira.env}"

required_environment_variables=(
  DATABASE_URL
  JWT_SECRET
  PORTAL_OWNER_ACCESS_TOKEN
  KEIRA_IDENTITY_ROOT_SECRET
)

require_env_file() {
  if [[ ! -f "$ENV_FILE" ]]; then
    echo "Missing protected environment file: $ENV_FILE" >&2
    echo "Create it with the UpCloud runbook before running this script." >&2
    exit 1
  fi

  for key in "${required_environment_variables[@]}"; do
    value="$(grep -E "^${key}=" "$ENV_FILE" | tail -n 1 | cut -d= -f2- || true)"
    if [[ -z "$value" || "$value" == *"replace-with"* || "$value" == "CHANGE_ME" ]]; then
      echo "Missing required production environment variable: ${key}" >&2
      exit 1
    fi
  done
}

echo "Installing base packages and Node.js 22..."
sudo apt-get update
sudo apt-get install -y ca-certificates curl git build-essential nginx certbot python3-certbot-nginx
if ! command -v node >/dev/null 2>&1 || [[ "$(node -p 'process.versions.node.split(`.`)[0]')" -lt 22 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
sudo npm install -g pnpm pm2

require_env_file
sudo install -d -o "$(id -un)" -g "$(id -gn)" "$APP_DIR"
if [[ -d "$APP_DIR/.git" ]]; then
  git -C "$APP_DIR" fetch origin "$BRANCH"
  git -C "$APP_DIR" checkout "$BRANCH"
  git -C "$APP_DIR" pull --ff-only origin "$BRANCH"
else
  git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
fi
sudo chown -R "$(id -u):$(id -g)" "$APP_DIR"
cd "$APP_DIR"

set -a
source "$ENV_FILE"
set +a
export HOST=127.0.0.1
export PORT="$APP_PORT"

pnpm install --frozen-lockfile
pnpm drizzle-kit migrate
pnpm check
pnpm test
pnpm build

pm2 delete keira-intelligence 2>/dev/null || true
pm2 start dist/index.js --name keira-intelligence --cwd "$APP_DIR" --update-env
pm2 save

sudo tee /etc/nginx/sites-available/keira >/dev/null <<NGINX
limit_req_zone \$binary_remote_addr zone=keira_auth:10m rate=10r/m;

server {
    listen 80;
    server_name ${KEIRA_DOMAIN};

    location ~ ^/api/trpc/auth\.(login|register|ownerBootstrap) {
        limit_req zone=keira_auth burst=5 nodelay;
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINX

sudo ln -sfn /etc/nginx/sites-available/keira /etc/nginx/sites-enabled/keira
sudo nginx -t
sudo systemctl reload nginx

curl -fsSI "http://127.0.0.1:${APP_PORT}/"
curl -fsSI "http://127.0.0.1/"
printf '\nKEIRA Intelligence is running locally on 127.0.0.1:%s.\n' "$APP_PORT"
printf 'After DNS is confirmed for %s, issue TLS with: sudo certbot --nginx -d %s\n' "$KEIRA_DOMAIN" "$KEIRA_DOMAIN"
printf 'After TLS, verify: curl -fsSI https://%s/\n' "$KEIRA_DOMAIN"
printf 'For reboot persistence, run the command printed by: pm2 startup\n'
