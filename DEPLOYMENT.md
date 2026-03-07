# Deployment Guide — RAN Online CP (Windows Server + IIS)

## Architecture

```
Browser → Cloudflare (HTTPS :443) → IIS (HTTP :80) → Backend / Frontend
```

- **Frontend**: `https://cp.rng-dev.com` → IIS → `localhost:3001` (Next.js standalone)
- **Backend**: `https://backend.rng-dev.com` → IIS → `localhost:1669` (Express)
- **Cloudflare** handles SSL
- **IIS** acts as reverse proxy via URL Rewrite + ARR
- **PM2** manages Node.js processes

---

## Prerequisites

- Windows Server with IIS installed
- Node.js installed
- PM2 installed globally: `npm install -g pm2`
- Cloudflare account with domain configured

---

## Step 1: Install IIS + Extensions

PowerShell as Admin:
```powershell
Install-WindowsFeature -name Web-Server -IncludeManagementTools
```

Download and install:
- **URL Rewrite**: https://www.iis.net/downloads/microsoft/url-rewrite
- **ARR (Application Request Routing)**: https://www.iis.net/downloads/microsoft/application-request-routing

Restart IIS:
```powershell
iisreset
```

---

## Step 2: Enable ARR Proxy

1. Open **IIS Manager** (`inetmgr`)
2. Click the **server name** (top level)
3. Double-click **Application Request Routing Cache**
4. Click **Server Proxy Settings** (right panel)
5. Check **Enable proxy**
6. Click **Apply**

---

## Step 3: Stop Default Site

In IIS Manager → Sites → right-click **Default Web Site** → **Stop**

---

## Step 4: Create IIS Sites

### Backend Site

1. Create folder:
```powershell
mkdir C:\inetpub\wwwroot\backend
```

2. Create `C:\inetpub\wwwroot\backend\web.config`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <system.webServer>
        <rewrite>
            <rules>
                <rule name="Backend Proxy" stopProcessing="true">
                    <match url="(.*)" />
                    <action type="Rewrite" url="http://localhost:1669/{R:0}" />
                </rule>
            </rules>
        </rewrite>
    </system.webServer>
</configuration>
```

3. In IIS Manager → right-click **Sites** → **Add Website**
   - Site name: `backend`
   - Physical path: `C:\inetpub\wwwroot\backend`
   - Port: `80`
   - Host name: `backend.rng-dev.com`

### Frontend Site

1. Create folder:
```powershell
mkdir C:\inetpub\wwwroot\frontend
```

2. Create `C:\inetpub\wwwroot\frontend\web.config`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <system.webServer>
        <rewrite>
            <rules>
                <rule name="Frontend Proxy" stopProcessing="true">
                    <match url="(.*)" />
                    <action type="Rewrite" url="http://localhost:3001/{R:0}" />
                </rule>
            </rules>
        </rewrite>
    </system.webServer>
</configuration>
```

3. In IIS Manager → right-click **Sites** → **Add Website**
   - Site name: `cp-frontend`
   - Physical path: `C:\inetpub\wwwroot\frontend`
   - Port: `80`
   - Host name: `cp.rng-dev.com`

---

## Step 5: Open Firewall

```powershell
netsh advfirewall firewall add rule name="HTTP" dir=in action=allow protocol=TCP localport=80
netsh advfirewall firewall add rule name="HTTPS" dir=in action=allow protocol=TCP localport=443
```

---

## Step 6: Configure Cloudflare DNS

In Cloudflare Dashboard → DNS → add A records:
- `cp` → `51.79.218.144` (Proxied)
- `backend` → `51.79.218.144` (Proxied)

SSL/TLS → set to **Flexible** (Cloudflare handles HTTPS, sends HTTP to your server).

---

## Step 7: Configure Environment Files

### Backend `.env` (`ran-backend/.env`)
```
NODE_ENV=production
PORT=1669
WEB_URL=https://cp.rng-dev.com
```
(Plus your DB credentials, session secret, etc.)

### Frontend `.env` (`ran-frontend/.env`)
```
NEXT_PUBLIC_API_ENDPOINT_URL=https://backend.rng-dev.com
WEB_URL=https://cp.rng-dev.com
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_key_here
```

> **Important**: `NEXT_PUBLIC_` variables are baked in at build time. You must rebuild the frontend after changing them.

---

## Step 8: Build Frontend

```powershell
cd C:\Users\Administrator\Desktop\web-01\ran-frontend
npm run build
Copy-Item -Recurse -Force public .next\standalone\public
Copy-Item -Recurse -Force .next\static .next\standalone\.next\static
```

The `Copy-Item` commands are required because Next.js standalone mode does not include `public/` and `.next/static/` in the output.

---

## Step 9: PM2 — Start Services

### ecosystem.config.cjs

Place in project root (`C:\Users\Administrator\Desktop\web-01\`):

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
        PORT: 1669,
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
        HOSTNAME: "localhost",
      },
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
    },
  ],
};
```

### Start services:
```powershell
cd C:\Users\Administrator\Desktop\web-01
pm2 start ecosystem.config.cjs
pm2 save
```

### Auto-start on reboot:
```powershell
npm install -g pm2-windows-startup
pm2-startup install
pm2 save
```

---

## Step 10: Verify

```powershell
# Check PM2 status
pm2 status

# Test backend directly
curl http://localhost:1669/health

# Test frontend directly
curl http://localhost:3001

# Test backend through IIS
Invoke-WebRequest -Uri "http://backend.rng-dev.com/health"

# Test frontend through IIS
Invoke-WebRequest -Uri "http://cp.rng-dev.com"
```

Then open in browser:
- `https://backend.rng-dev.com/health`
- `https://cp.rng-dev.com`

---

## Common PM2 Commands

```powershell
pm2 status                  # List all processes
pm2 logs                    # View all logs
pm2 logs ran-backend        # View backend logs only
pm2 flush                   # Clear all logs
pm2 restart all             # Restart everything
pm2 restart ran-backend     # Restart backend only
pm2 restart ran-frontend    # Restart frontend only
pm2 stop all                # Stop everything
pm2 delete all              # Remove all processes
```

---

## Redeployment Checklist

When pushing code updates:

1. `git pull` on the server
2. If **backend** changed:
   ```powershell
   pm2 restart ran-backend
   ```
3. If **frontend** changed:
   ```powershell
   cd ran-frontend
   npm run build
   Copy-Item -Recurse -Force public .next\standalone\public
   Copy-Item -Recurse -Force .next\static .next\standalone\.next\static
   pm2 restart ran-frontend
   ```
4. If **`.env`** changed on frontend: must rebuild (step 3)
5. If **`.env`** changed on backend: just `pm2 restart ran-backend`

---

## Step 2b: Disable "Reverse Rewrite Host in Response Headers" (CRITICAL)

After enabling ARR proxy, also disable response header rewriting — otherwise IIS rewrites the session cookie domain (e.g. `.rng-dev.com` → `.backend.rng-dev.com`) which breaks cross-subdomain sessions.

1. IIS Manager → click **server name** (top level)
2. Double-click **Application Request Routing Cache**
3. Click **Server Proxy Settings**
4. **Uncheck** "Reverse rewrite host in response headers"
5. Click **Apply**
6. Run `iisreset`

---

## Step 4b: IIS Site Binding — Use "All Unassigned" IP

When creating the IIS site bindings, set IP address to **All Unassigned** instead of a specific IP. Using a specific IP causes `localhost` requests to not match the hostname binding.

In IIS Manager → site → **Bindings** → Edit:
- IP address: **All Unassigned**
- Port: `80`
- Host name: `backend.rng-dev.com` (or `cp.rng-dev.com`)

---

## Step 4c: Session Cookie Config for Cross-Subdomain Auth

Since frontend (`cp.rng-dev.com`) and backend (`backend.rng-dev.com`) are on different subdomains, the session cookie must be configured to work cross-subdomain.

In `ran-backend/src/loaders/express.js`, the cookie config must be:

```js
cookie: {
    httpOnly: true,
    sameSite: "none",   // allows cross-origin cookie sending
    secure: true,       // required when sameSite is "none"
    domain: ".rng-dev.com",  // shared across all subdomains
    path: "/",
    maxAge: 1000 * 60 * 60 * 2,
},
```

- `sameSite: "none"` — allows the browser to send the cookie on cross-origin requests
- `secure: true` — required by browsers when `sameSite: "none"`; works because Cloudflare delivers HTTPS to the browser
- `domain: ".rng-dev.com"` — cookie is accessible on all `*.rng-dev.com` subdomains

> **Note:** `secure: true` works here because Cloudflare terminates HTTPS. The connection between Cloudflare and IIS is HTTP, but the browser sees HTTPS.

---

## Notes

### Item Shop — DB_NAME_SHOP vs Hardcoded DB

The item shop works even if `DB_NAME_SHOP` is not set in the backend `.env`. All shop queries in `ran-backend/src/services/shop.service.js` use fully qualified table names hardcoded as `RG2Shop.dbo.*` (e.g. `FROM RG2Shop.dbo.ShopCategory`).

`DB_NAME_SHOP` is only used to establish the SQL connection pool. Once connected, the queries reference `RG2Shop` directly. As long as the SQL user has access to the `RG2Shop` database on the server, the shop will function regardless of the env var value.

---

## Troubleshooting

| Problem | Check |
|---------|-------|
| 404 from IIS | ARR proxy enabled? `web.config` correct? `iisreset` |
| 404 with correct web.config | IIS site binding IP — change from specific IP to "All Unassigned" |
| CORS errors | Backend `WEB_URL` must match frontend origin exactly (e.g. `https://cp.rng-dev.com`) |
| CSRF token invalid | Multiple stale cookies in browser — clear all cookies for the domain and retry |
| CSRF token invalid (after clearing) | Session cookie domain being rewritten by ARR — disable "Reverse rewrite host in response headers" |
| Login succeeds but session lost | Cookie `domain` not set to `.rng-dev.com` — see Step 4c |
| Multiple session cookies | Old cookies from earlier testing — clear all browser cookies for `*.rng-dev.com` |
| Connection refused | `pm2 status` — is the service online? Check `pm2 logs` |
| Old API URL after env change | Frontend needs rebuild — `NEXT_PUBLIC_` is baked at build time |
| Blank page (title only) | Static assets not copied — run `Copy-Item` commands |
| 401 Unauthorized from IIS | Check IIS Authentication — Anonymous must be enabled, disable Windows Authentication |
| 500 on /api/account/me | Check `pm2 logs ran-backend` for the actual error |
| `ERR_MODULE_NOT_FOUND` on backend | New files not deployed — `git pull` on the server |
