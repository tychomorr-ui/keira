# Portal — AWS Lightsail Sovereign Deployment Guide

This guide details how to deploy **Portal** as an independent sovereign service on an AWS Lightsail instance (Ubuntu 24.04 LTS), removing all dependence on platform-managed runtimes.

---

## 1. Instance Provisioning & System Prereqs
1. Spin up an **AWS Lightsail Ubuntu 24.04 LTS** instance (Recommended: 2 GB RAM / 1 vCPU or higher).
2. Attach a static IP and open ports `80` (HTTP), `443` (HTTPS), and `3000` (App server, or proxied via Nginx).
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
# Clone your repository (or push your code to your private/public GitHub repo)
git clone https://github.com/tychomorr-ui/cosmic-net.git portal
cd portal

# Install dependencies
pnpm install
```

---

## 4. Configure Production Environment Variables
Create a `.env` file in the project root:
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=mysql://dbuser:dbpassword@localhost:3306/portal_db
JWT_SECRET=your-secure-random-jwt-secret-string
PORTAL_OWNER_ACCESS_TOKEN=your-custom-secure-owner-key

# Optional: Amazon Bedrock Inference (Direct sovereign AI routing)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
BEDROCK_REGION=us-west-2
BEDROCK_MODEL_ID=us.anthropic.claude-3-5-sonnet-20241022-v2:0
```

---

## 5. Build and Run with PM2 (Always-On Daemon)
```bash
# Install PM2 process manager
sudo npm install -g pm2

# Build the frontend and backend bundle
pnpm build

# Start the application with PM2
pm2 start dist/server/_core/index.js --name "portal-sovereign"

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
