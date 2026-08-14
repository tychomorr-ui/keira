#!/bin/bash

# Sovereign Truth Portal Chat - AWS Lightsail Deployment Script
# Deploy to: 18.138.160.99 (Singapore)
# Domain: portal.nexinus.net
# OS: Ubuntu 24.04

set -e

echo "=================================================="
echo "Sovereign Truth Portal Chat - Lightsail Deploy"
echo "=================================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Update system
echo -e "${YELLOW}[1/13] Updating system packages...${NC}"
apt update
apt upgrade -y
apt install -y curl wget git build-essential

# Step 2: Install Node.js and pnpm
echo -e "${YELLOW}[2/13] Installing Node.js and pnpm...${NC}"
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
apt install -y nodejs
npm install -g pnpm

# Step 3: Install MySQL
echo -e "${YELLOW}[3/13] Installing MySQL 8.0...${NC}"
apt install -y mysql-server
systemctl start mysql
systemctl enable mysql

# Step 4: Install Nginx
echo -e "${YELLOW}[4/13] Installing Nginx...${NC}"
apt install -y nginx
systemctl start nginx
systemctl enable nginx

# Step 5: Install Certbot for SSL
echo -e "${YELLOW}[5/13] Installing Certbot for SSL certificates...${NC}"
apt install -y certbot python3-certbot-nginx

# Step 6: Clone repository
echo -e "${YELLOW}[6/13] Cloning Sovereign Truth Portal Chat repository...${NC}"
cd /opt
git clone https://github.com/tychomorr-ui/sovereign-truth-engine.git
cd sovereign-truth-engine

# Step 7: Install dependencies
echo -e "${YELLOW}[7/13] Installing Node.js dependencies...${NC}"
pnpm install

# Step 8: Create .env file
echo -e "${YELLOW}[8/13] Creating .env file (you must fill in secrets)...${NC}"
cat > .env.local << 'EOF'
# Database
DATABASE_URL=mysql://root:CHANGE_ME@localhost:3306/sovereign_truth

# JWT
JWT_SECRET=CHANGE_ME_TO_RANDOM_STRING

# Manus OAuth
VITE_APP_ID=CHANGE_ME
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://oauth.manus.im

# Stripe
STRIPE_SECRET_KEY=sk_test_CHANGE_ME
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_CHANGE_ME
STRIPE_WEBHOOK_SECRET=whsec_CHANGE_ME

# Manus Built-in APIs
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=CHANGE_ME
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=CHANGE_ME

# Owner info
OWNER_OPEN_ID=CHANGE_ME
OWNER_NAME=CHANGE_ME

# App config
VITE_APP_TITLE=Sovereign Truth Portal
NODE_ENV=production
EOF

echo -e "${RED}⚠️  IMPORTANT: Edit .env.local and fill in all CHANGE_ME values${NC}"
echo "Location: /opt/sovereign-truth-engine/.env.local"
echo ""

# Step 9: Create database
echo -e "${YELLOW}[9/13] Creating MySQL database...${NC}"
mysql -u root << 'EOF'
CREATE DATABASE IF NOT EXISTS sovereign_truth;
USE sovereign_truth;
EOF

# Step 10: Build application
echo -e "${YELLOW}[10/13] Building application...${NC}"
pnpm build

# Step 11: Install PM2
echo -e "${YELLOW}[11/13] Installing PM2 process manager...${NC}"
npm install -g pm2
pm2 install pm2-auto-pull

# Step 12: Configure Nginx reverse proxy
echo -e "${YELLOW}[12/13] Configuring Nginx reverse proxy...${NC}"
cat > /etc/nginx/sites-available/portal.nexinus.net << 'EOF'
upstream portal_backend {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    server_name portal.nexinus.net;

    location / {
        proxy_pass http://portal_backend;
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
EOF

ln -sf /etc/nginx/sites-available/portal.nexinus.net /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

# Step 13: Setup SSL certificate
echo -e "${YELLOW}[13/13] Setting up SSL certificate with Let's Encrypt...${NC}"
echo -e "${YELLOW}Make sure your domain (portal.nexinus.net) DNS is already pointing to 18.138.160.99${NC}"
read -p "Press Enter to continue with SSL setup (or Ctrl+C to skip)..."
certbot --nginx -d portal.nexinus.net --non-interactive --agree-tos -m admin@nexinus.net

# Start application with PM2
echo -e "${GREEN}Starting application with PM2...${NC}"
cd /opt/sovereign-truth-engine
pm2 start "pnpm dev" --name "portal-chat" --env production
pm2 save
pm2 startup

echo ""
echo -e "${GREEN}=================================================="
echo "✅ Deployment Complete!"
echo "==================================================${NC}"
echo ""
echo "📋 Next Steps:"
echo "1. Edit .env.local with your actual secrets:"
echo "   nano /opt/sovereign-truth-engine/.env.local"
echo ""
echo "2. Update your DNS records:"
echo "   portal.nexinus.net A record → 18.138.160.99"
echo ""
echo "3. Restart the application:"
echo "   cd /opt/sovereign-truth-engine"
echo "   pm2 restart portal-chat"
echo ""
echo "4. View logs:"
echo "   pm2 logs portal-chat"
echo ""
echo "5. Access your Portal:"
echo "   https://portal.nexinus.net"
echo ""
echo "📚 Useful Commands:"
echo "   pm2 status              - Check app status"
echo "   pm2 logs portal-chat    - View application logs"
echo "   pm2 restart portal-chat - Restart application"
echo "   pm2 stop portal-chat    - Stop application"
echo ""
