# Threat Model — ran-cp00

**Methodology:** STRIDE (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege)

**Scope:** Backend API (Express 5 + MSSQL) and Frontend (Next.js 16). Session-based auth, no JWT in use.

**Date:** 2026-03-05

---

## Attack Surface Summary

| Surface | Technology | Exposure |
|---------|-----------|---------|
| Auth endpoints | `POST /api/auth/login`, `/register`, `/forgotpass` | Public internet |
| Account endpoints | `POST /api/account/*` | Authenticated users |
| Admin panel | `POST /api/adminpanel/*` | Staff (type >= 50) |
| File uploads | Ticket attachments, slider images | Authenticated users / Staff |
| Static files | `/uploads/`, `/images/shop/` | Public |
| Session cookies | HTTP-only, SameSite=lax | All requests |
| Database | MSSQL — 5 databases | Backend only |
| Config hot-reload | In-memory + DB sync | Admin panel |

---

## STRIDE Findings

### S — Spoofing (Identity)

#### S-1: MD5 Password Hashing — SEVERITY: HIGH
**Location:** `ran-backend/src/services/util/auth.util.js`, `encodePassword()`

**Description:**
Passwords are hashed with MD5 and truncated to 19 uppercase hex characters. MD5 is computationally cheap — an attacker with a stolen database dump can crack all passwords offline with commodity hardware (GPU-accelerated hashcat) in hours.

The `encodePassword` function also has a double-gate bug: it checks both `baseServerConfig.coreOptions.ismd5` and `process.env.IsMD5`. If either is misconfigured, passwords may be stored in plaintext.

**Proof of concept (offline crack):**
```
hashcat -m 0 -a 3 <stolen_hash> ?a?a?a?a?a?a?a?a  # cracks in minutes
```

**Remediation:**
1. For new registrations: add `bcrypt` (or `argon2`) alongside MD5 for existing users
2. Migration path: on successful login via MD5, re-hash and store with bcrypt
3. Add a `PassVersion` column to `UserInfo` to track which algorithm was used

---

#### S-2: No Brute Force Protection on Login — SEVERITY: HIGH
**Location:** `ran-backend/src/api/routes/auth.routes.js`

**Description:**
`POST /api/auth/register` has `express-rate-limit` (5/15 min). `POST /api/auth/login` has **no rate limit**. An attacker can submit unlimited credential attempts, enabling:
- Credential stuffing (leaked password lists)
- Dictionary attacks against known usernames

**Remediation:**
```js
import rateLimit from "express-rate-limit";
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });
router.post("/login", loginLimiter, loginController);
```

---

### T — Tampering (Integrity)

#### T-1: Hardcoded Session Secret — SEVERITY: HIGH
**Location:** `ran-backend/src/loaders/express.js`

**Description:**
Was hardcoded as `"dev-secret-change-later"`. If deployed as-is, any attacker who knows the secret can forge arbitrary session cookies and impersonate any user, including admins.

**Status:** FIXED in this initiative — secret now read from `process.env.SESSION_SECRET`.

**Action required:** Generate a cryptographically random 64-character secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Set `SESSION_SECRET=<generated>` in the production `.env`.

---

#### T-2: No CSRF Protection — SEVERITY: MEDIUM
**Location:** All state-mutating endpoints (`POST /api/account/*`, `POST /api/auth/*`)

**Description:**
Session cookies with `SameSite=lax` provide _partial_ CSRF protection — lax allows the cookie to be sent on top-level navigations, but not on cross-origin AJAX/fetch. However, `SameSite=lax` does **not** protect against same-site attacks or some subdomain attacks.

In a gaming portal where multiple subdomains exist, this creates risk.

**Remediation:**
```bash
npm install csrf-csrf
```
Add `doubleCsrfProtection` middleware to all state-mutating routes.

---

#### T-3: Session Cookie Not Secure in Production — SEVERITY: MEDIUM
**Location:** `ran-backend/src/loaders/express.js`

**Description:**
`secure: false` is hardcoded. This means session cookies are sent over plain HTTP even in production, exposing them to network interception (man-in-the-middle attacks, coffee shop sniffing).

**Remediation:**
```js
secure: process.env.NODE_ENV === "production",
```

---

### R — Repudiation (Audit Trails)

#### R-1: Action Log in Same Infrastructure — SEVERITY: LOW
**Location:** `RG2Log` database, `logAction()` service

**Description:**
User and GM action logs are stored in the same SQL Server instance as user data. A compromised DBA or SQL injection vulnerability could allow log tampering.

**Strength:** Logs are append-only by design (INSERT only, no DELETE/UPDATE in logAction).

**Remediation (long-term):** Stream critical logs to an external immutable service (AWS CloudWatch, Datadog, Sentry breadcrumbs).

---

### I — Information Disclosure

#### I-1: Database Credentials in .env — SEVERITY: HIGH
**Location:** `ran-backend/.env`

**Description:**
Database host, username, and plaintext password are stored in `.env`. If this file is leaked (server misconfiguration, git accident, CI log exposure), all five databases are compromised.

**Remediation:**
- Use a secrets manager (HashiCorp Vault, AWS Secrets Manager, Azure Key Vault) in production
- Ensure `.env` is in `.gitignore` (verify — it already is excluded from the git index)
- Rotate the DB password immediately after any suspected exposure

---

#### I-2: Stack Traces in 500 Responses — SEVERITY: LOW
**Location:** `ran-backend/src/api/middlewares/error.middleware.js`

**Description:**
The error middleware returns `err.message` directly. For unhandled exceptions, this may expose file paths, query structure, or library internals.

**Remediation:**
```js
const isProd = process.env.NODE_ENV === "production";
res.status(err.status || 500).json({
  message: isProd ? "Internal Server Error" : (err.message || "Internal Server Error"),
});
```

---

#### I-3: Open Image Domain Policy — SEVERITY: LOW
**Location:** `ran-frontend/next.config.ts`

**Description:**
`hostname: "**"` allows Next.js Image Optimization to proxy any HTTP/HTTPS image URL. This could be abused as an open redirect for images or to expose server IP via SSRF.

**Remediation:** Restrict to known CDN domains:
```ts
remotePatterns: [
  { protocol: "https", hostname: "your-cdn.example.com" },
]
```

---

### D — Denial of Service

#### D-1: No Login Rate Limit — SEVERITY: HIGH
*(See S-2 — same finding, dual impact)*

Unlimited login requests also allow DoS against the SQL Server connection pool (max 10 connections per pool). High-volume attacks can exhaust the pool for all legitimate users.

**Remediation:** Same as S-2 — add rate limiting to `POST /api/auth/login`.

---

#### D-2: Character Rankings Not Guarded Against Abuse — SEVERITY: LOW
**Location:** `ran-backend/src/services/character.service.js`, `getCharacterRanking()`

**Description:**
Rankings are cached (5 min TTL) per key `{limit}:{classFilter}`. However, the endpoint accepts arbitrary `limit` values (capped at 500 in code). Each unique limit+filter combination creates a separate cache entry. Many unique combinations could bloat the in-memory `rankCache` Map.

**Remediation:** Whitelist allowed limit values (`10`, `50`, `100`, `500`) to bound cache size.

---

### E — Elevation of Privilege

#### E-1: No Second Factor for Admin Actions — SEVERITY: MEDIUM
**Location:** Admin panel (`/api/adminpanel/*`)

**Description:**
Staff access is granted solely by `UserType >= 50`. Once a staff session is established, all admin operations are available with no additional verification. A stolen or hijacked session immediately grants full admin capabilities.

**Remediation (long-term):** Require TOTP (e.g., `speakeasy` + `qrcode`) for admin panel access. Alternatively, require pincode re-entry for destructive admin operations.

---

#### E-2: Dead JWT Dependency — SEVERITY: LOW
**Location:** `ran-backend/package.json`

**Description:**
`jsonwebtoken` is installed but **never imported** in any source file. `JWT_SECRET` is in `.env` but unused. Dead code and unused dependencies expand the attack surface without adding value.

**Remediation:** Remove `jsonwebtoken` from `package.json`:
```bash
npm uninstall jsonwebtoken
```

---

#### E-3: File Upload Content Not Validated — SEVERITY: MEDIUM
**Location:** `ran-backend/src/api/middlewares/upload.middleware.js`

**Description:**
File validation uses `file.mimetype` (client-declared Content-Type). A malicious actor can upload a PHP/HTML/JS file with a `.jpg` extension and `image/jpeg` MIME type. While these files are served statically and not executed by Node.js, a misconfigured proxy could serve them with dangerous content types.

**Remediation:** Validate file magic bytes using the `file-type` library:
```bash
npm install file-type
```
```js
import { fileTypeFromBuffer } from "file-type";
const type = await fileTypeFromBuffer(file.buffer);
if (!["image/jpeg", "image/png", "image/webp"].includes(type?.mime)) {
  throw new Error("Invalid file content");
}
```

---

## Remediation Priority Matrix

| ID | Finding | Severity | Effort | Status |
|----|---------|----------|--------|--------|
| T-1 | Hardcoded session secret | HIGH | Done | ✅ Fixed |
| S-1 | MD5 password hashing | HIGH | High | ⚠️ Needs migration plan |
| S-2 | No login rate limit | HIGH | Low | ⚠️ Needs `express-rate-limit` on login |
| I-1 | DB credentials in .env | HIGH | Medium | ⚠️ Use secrets manager in production |
| D-1 | Login DoS via pool exhaustion | HIGH | Low | ⚠️ Same fix as S-2 |
| T-2 | No CSRF protection | MEDIUM | Medium | ⚠️ Add `csrf-csrf` |
| T-3 | Cookie not secure in production | MEDIUM | Low | ⚠️ One-line fix |
| E-1 | No 2FA for admin | MEDIUM | High | ⚠️ Long-term |
| E-3 | File content not validated | MEDIUM | Low | ⚠️ Add `file-type` |
| I-2 | Stack traces in 500s | LOW | Low | ⚠️ Env-gate error messages |
| I-3 | Open image domain | LOW | Low | ⚠️ Restrict `remotePatterns` |
| D-2 | Rankings cache DoS | LOW | Low | ⚠️ Whitelist limit values |
| R-1 | Logs same infrastructure | LOW | High | ⚠️ Long-term |
| E-2 | Unused jsonwebtoken | LOW | Low | ⚠️ `npm uninstall jsonwebtoken` |

---

## What is NOT Vulnerable

| Attack | Status | Reason |
|--------|--------|--------|
| SQL Injection | Not vulnerable | Parameterized queries throughout all service files |
| Session Fixation | Not vulnerable | `req.session.regenerate()` called on login |
| Password in Transit | Not vulnerable | HTTPS in production (verify at infra level) |
| XSS via API | Not vulnerable | JSON responses only; no HTML rendered server-side |
| Path Traversal (uploads) | Low risk | `multer` generates random filenames; no user-controlled paths |
