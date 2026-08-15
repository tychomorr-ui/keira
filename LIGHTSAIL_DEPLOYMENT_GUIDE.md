# Portal — AWS Lightsail Sovereign Deployment Guide

This guide details how to deploy **Portal** as an independent sovereign service on an AWS Lightsail instance (Ubuntu 24.04 LTS), removing all dependence on platform-managed runtimes.

---

## 1. Instance Provisioning & System Prereqs
1. Spin up an **AWS Lightsail Ubuntu 24.04 LTS** instance (Recommended: 2 GB RAM / 1 vCPU or higher).
2. Attach a static IP and open ports `80` (HTTP) and `443` (HTTPS). Keep the Portal process on loopback port `3000`; do **not** expose port `3000` publicly when Nginx is the reverse proxy.
3. SSH into your instance or use the Lightsail browser console.

---

## 2. Environment Setup & Node.js 22
Run the following commands on your Lightsail instance:
```bash
# Update system and install git, build-essential, curl
sudo apt update && sudo apt upgrade -y
sudo apt install -y git build-essential curl nginx certbot python3-certbot-nginx

# Install Node.js 22 LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm globally
sudo npm install -g pnpm
```

---

## 3. Clone Repository & Install Dependencies
```bash
# Clone the GitHub repository over HTTPS
git clone https://github.com/tychomorr-ui/cosmic-net.git portal
cd portal

# Install exactly the dependency graph committed with Portal
pnpm install --frozen-lockfile
```

---

## 4. Configure Production Environment Variables
Create a `.env` file in the project root:
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=mysql://portal_user:replace-with-rds-password@portal-db-01.replace-with-rds-endpoint:3306/portal_db
JWT_SECRET=replace-with-a-long-random-32-plus-character-secret
PORTAL_OWNER_ACCESS_TOKEN=replace-with-a-long-random-owner-access-token

# Primary Amazon Bedrock authentication: a Bedrock bearer token/API key.
BEDROCK_API_KEY=replace-with-your-bedrock-bearer-token
BEDROCK_REGION=sa-east-1
BEDROCK_MODEL_ID=anthropic.claude-opus-5
BEDROCK_MAX_TOKENS=4096
BEDROCK_TEMPERATURE=0.1

# Required for encrypted transcript exports. Use the name of an actual S3 bucket,
# not the RDS instance identifier, and make sure the Portal runtime can access it.
PORTAL_S3_BUCKET=replace-with-your-s3-bucket-name
PORTAL_S3_REGION=sa-east-1

# Alternative to BEDROCK_API_KEY: use an attached Lightsail instance role or IAM
# access keys with Bedrock and S3 permissions. Do not set both unless intended.
# AWS_ACCESS_KEY_ID=...
# AWS_SECRET_ACCESS_KEY=...
# AWS_SESSION_TOKEN=... # only for temporary IAM credentials
```

Protect the local file and never commit it:
```bash
chmod 600 .env
```

---

## 5. Build and Run with PM2 (Always-On Daemon)
```bash
# Install PM2 process manager
sudo npm install -g pm2

# Apply schema migrations before serving a new version
pnpm db:push

# Build the frontend and backend bundle
pnpm build

# Start the application with PM2. The bundle entrypoint is dist/index.js.
pm2 start dist/index.js --name "portal-sovereign" --update-env

# Configure PM2 to start on system boot
pm2 startup
pm2 save
```

---

## 6. Configure Nginx Reverse Proxy & SSL (HTTPS)
Configure Nginx (`/etc/nginx/sites-available/portal`) to proxy traffic to port `3000`:
```nginx
server {
    listen 80;
    server_name portal.xinus.one;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Enable the site and issue an SSL certificate via Certbot:
```bash
sudo ln -s /etc/nginx/sites-available/portal /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Issue free SSL certificate via Let's Encrypt
sudo certbot --nginx -d portal.xinus.one
```

---

## 7. Verify Before Switching DNS
After the build and process start, use the following checks from the Lightsail browser console. The first verifies the local application, then the second verifies Nginx. Only point `portal.xinus.one` to the instance static IP after both respond successfully.

```bash
curl -I http://127.0.0.1:3000/
curl -I http://127.0.0.1/
pm2 status
pm2 logs portal-sovereign --lines 50
```

To update Portal later, retrieve the audited GitHub revision, reinstall deterministic dependencies, migrate, rebuild, and restart the process:

```bash
cd ~/portal
git pull --ff-only origin main
pnpm install --frozen-lockfile
pnpm db:push
pnpm build
pm2 restart portal-sovereign --update-env
```
