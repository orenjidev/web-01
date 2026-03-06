# Deployment Guide — RAN CP on VPS / Virtual Desktop

This guide covers deploying the RAN Control Panel (backend + frontend) on a Windows or Linux VPS.

---

## Prerequisites

| Software | Version | Purpose |
|----------|---------|---------|
| **Node.js** | 20+ LTS | Runtime for both backend and frontend |
| **npm** | 10+ | Package manager (comes with Node.js) |
| **Git** | Latest | Clone the repository |
| **PM2** | Latest | Process manager (keeps apps running, auto-restart) |
| **MSSQL Server** | 2014+ | Already running (remote or local) |

### Optional (recommended for production)
| Software | Purpose |
|----------|---------|
| **Nginx** | Reverse proxy (serve both apps on port 80/443) |
| **Certbot** | Free SSL certificates (Let's Encrypt) |

---

## Step 1: Install Node.js & PM2

### Windows
1. Download Node.js 20 LTS from https://nodejs.org
2. Install with default settings
3. Open **PowerShell** or **Command Prompt**:
```bash
node -v        # Should show v20+
npm -v         # Should show 10+
npm install -g pm2
```

### Linux (Ubuntu/Debian)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
npm install -g pm2
```

---

## Step 2: Clone the Repository

```bash
cd /opt  # or wherever you want (Windows: C:\Apps\)
git clone <your-repo-url> ran-cp00
cd ran-cp00
```

---

## Step 3: Configure Environment Variables

### Backend (`ran-backend/.env`)

```env
NODE_ENV=production
PORT=3000

## SQL INFO
DB_HOST=<your-mssql-host-ip>
DB_USER=sa
DB_PASS=<your-db-password>
DB_PORT=1433

# DB TYPE
RAN_GAME_TYPE_=0
DB_NAME_USER=RG2User
DB_NAME_GAME=RG2Game
DB_NAME_LOG=RG2Log
DB_NAME_SHOP=RG2Shop
DB_NAME_WEB=OrenjiCP

## CONFIG
IsMD5=true

## SESSION COOKIE
COOKIE=rng-web-prod

## WEB INFO (your production domain)
WEB_URL=https://yourdomain.com

## SESSION SECRET (generate a strong random string!)
SESSION_SECRET=<generate-a-random-64-char-string>

## SENTRY (optional)
SENTRY_DSN=

## SWAGGER (disable in production)
ENABLE_SWAGGER=false
```

> **Generate a session secret:**
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

### Frontend (`ran-frontend/.env.local`)

```env
NEXT_PUBLIC_API_ENDPOINT_URL=https://yourdomain.com
WEB_URL=https://yourdomain.com
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=<your-recaptcha-site-key>
NEXT_PUBLIC_SENTRY_DSN=
IMAGE_DOMAINS=
```

> **Important:** `NEXT_PUBLIC_API_ENDPOINT_URL` is baked into the frontend at build time. If you change it, you must rebuild.

---

## Step 4: Install Dependencies & Build

```bash
# Backend
cd ran-backend
npm install --production
cd ..

# Frontend
cd ran-frontend
npm install
npm run build
cd ..
```

The frontend build produces a **standalone** output at `ran-frontend/.next/standalone/`. This is a self-contained Node.js server that doesn't need `node_modules`.

---

## Step 5: Run with PM2

Create a PM2 ecosystem file at the project root:

### `ecosystem.config.cjs`

```js
module.exports = {
  apps: [
    {
      name: "ran-backend",
      cwd: "./ran-backend",
      script: "src/server.js",
      node_args: "--experimental-modules",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
    },
    {
      name: "ran-frontend",
      cwd: "./ran-frontend",
      script: ".next/standalone/server.js",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
        HOSTNAME: "0.0.0.0",
      },
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
    },
  ],
};
```

### Copy static assets (required for standalone mode)

Next.js standalone doesn't include `public/` and `.next/static/` — you must copy them:

```bash
# From the ran-frontend directory:
cp -r public .next/standalone/public
cp -r .next/static .next/standalone/.next/static
```

**Windows (PowerShell):**
```powershell
Copy-Item -Recurse -Force public .next\standalone\public
Copy-Item -Recurse -Force .next\static .next\standalone\.next\static
```

### Start the apps

```bash
cd /opt/ran-cp00  # project root
pm2 start ecosystem.config.cjs
pm2 save      # Persist across reboots
pm2 startup   # Auto-start PM2 on boot (Linux only)
```

### Useful PM2 commands

```bash
pm2 list              # See running processes
pm2 logs              # View logs (both apps)
pm2 logs ran-backend  # Backend logs only
pm2 restart all       # Restart everything
pm2 stop all          # Stop everything
pm2 monit             # Live monitoring dashboard
```

---

## Step 6: Reverse Proxy with Nginx (Recommended)

Without Nginx, users would access `http://yourdomain.com:3001` (frontend) and `http://yourdomain.com:3000` (backend API). Nginx lets you serve everything on port 80/443.

### Install Nginx

**Linux:**
```bash
sudo apt install -y nginx
```

**Windows:** Download from https://nginx.org/en/download.html

### Configure (`/etc/nginx/sites-available/ran-cp`)

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend (Next.js)
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # File uploads
        client_max_body_size 10M;
    }

    # Uploaded files (ticket attachments, etc.)
    location /uploads/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
    }
}
```

### Enable the site (Linux)

```bash
sudo ln -s /etc/nginx/sites-available/ran-cp /etc/nginx/sites-enabled/
sudo nginx -t          # Test config
sudo systemctl restart nginx
```

---

## Step 7: SSL with Let's Encrypt (Linux)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

Certbot will automatically:
- Obtain a free SSL certificate
- Modify your Nginx config to redirect HTTP to HTTPS
- Set up auto-renewal

---

## Step 8: Firewall

### Linux (UFW)
```bash
sudo ufw allow 22      # SSH
sudo ufw allow 80      # HTTP
sudo ufw allow 443     # HTTPS
sudo ufw enable
```

> Ports 3000 and 3001 should NOT be exposed publicly — Nginx proxies to them internally.

### Windows
Open **Windows Defender Firewall** → Advanced Settings → Inbound Rules:
- Allow port 80 (HTTP)
- Allow port 443 (HTTPS)
- Block ports 3000 and 3001 from external access

---

## Step 9: Update Environment for Nginx Proxy

Once Nginx is in front, update these values:

### Backend `.env`
```env
# Change WEB_URL to your public domain
WEB_URL=https://yourdomain.com
```

### Frontend `.env.local`
```env
# Point API to the same domain (Nginx proxies /api/ to backend)
NEXT_PUBLIC_API_ENDPOINT_URL=https://yourdomain.com
```

> After changing `NEXT_PUBLIC_API_ENDPOINT_URL`, rebuild the frontend:
> ```bash
> cd ran-frontend && npm run build
> cp -r public .next/standalone/public
> cp -r .next/static .next/standalone/.next/static
> pm2 restart ran-frontend
> ```

---

## Quick Reference: Updating the App

```bash
cd /opt/ran-cp00

# Pull latest code
git pull

# Backend: just restart (no build needed)
cd ran-backend && npm install --production && cd ..
pm2 restart ran-backend

# Frontend: rebuild and restart
cd ran-frontend && npm install && npm run build
cp -r public .next/standalone/public
cp -r .next/static .next/standalone/.next/static
cd ..
pm2 restart ran-frontend
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| **ECONNREFUSED on MSSQL** | Check `DB_HOST`, `DB_PORT`, and ensure SQL Server allows remote connections |
| **502 Bad Gateway** | Check if PM2 apps are running: `pm2 list` |
| **Session lost after restart** | Expected — sessions are in-memory. Users will need to re-login |
| **CORS errors** | Ensure `WEB_URL` in backend `.env` matches your actual domain |
| **API returns HTML** | `NEXT_PUBLIC_API_ENDPOINT_URL` is wrong — must point to the backend, not frontend |
| **Static files 404** | Forgot to copy `public/` and `.next/static/` to standalone folder |
| **Build fails** | Run `npm run build` locally first to check for TypeScript errors |

---

## Architecture Overview

```
Client Browser
    │
    ▼
┌─────────┐
│  Nginx  │  :80 / :443
│ (proxy) │
└────┬────┘
     │
     ├── /           → Frontend (Next.js)  :3001
     ├── /api/       → Backend  (Express)  :3000
     └── /uploads/   → Backend  (Express)  :3000
```

Both apps run as PM2 processes on localhost. Nginx routes traffic to the correct app based on the URL path.
