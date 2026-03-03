# RNGDEV Ran Online Backend

Backend API server for **RNGDEV Ran Online**, providing authentication, account management, character services, shop, tickets, top-up, and admin features.

Built with **Node.js**, **Express**, **MSSQL**, and **session-based authentication**.

---

## 📦 Tech Stack

- Node.js (ESM)
- Express
- MSSQL (mssql)
- express-session
- Multi-database architecture
- Centralized message system (MSG)
- Role-based access control
- Transaction-safe operations
- In-memory cache layers

---

## 🧠 Core Design Principles

### Message-First Architecture
All user-facing messages are resolved through:

```js
getMessage(lang)
```

No hardcoded strings in controllers or services.

---

### Controller / Service Separation

| Layer | Responsibility |
|------|---------------|
| Controller | HTTP request/response only |
| Service | Business logic, validation, MSG |
| Guard/Repo | Pure logic, throws error codes |

---

### Export Safety Rules
- Never remove or rename exported service functions
- Prevents runtime crashes caused by missing exports

---

## 🔐 Authentication & Authorization

Session-based authentication using express-session.

### Middleware

| Middleware | Description |
|----------|-------------|
| requireAuth | Login required |
| requireStaff | UserType >= 50 |
| IsShopEnabled | Shop toggle |
| IsTopUpEnabled | Top-up toggle |
| requireTicketSystem | Ticket system toggle |

---

## 🧾 API Response Contract

### Success
```json
{ "ok": true, "message": "Localized message", "data": {} }
```

### Error
```json
{ "ok": false, "message": "Localized message" }
```

---

## 📂 Project Structure

```
src/
├── config/
├── constants/
├── controllers/
├── loaders/
├── repositories/
├── services/
│   ├── cache/
│   ├── guard/
│   ├── util/
├── middlewares/
└── index.js
```

---

## 🔑 Feature Modules

- Authentication
- Account management
- Character system
- Shop system
- Ticket system
- Top-up system
- Admin tools

---

## 💾 Databases

| DB | Purpose |
|----|--------|
| User DB | Accounts, credentials |
| Game DB | Characters, rankings |
| Web DB | Tickets, news |
| Shop DB | Shop items, purchases |

---

## 🛡️ Safety

- MSSQL transactions
- Offline character guards
- Dual-DB shop purchase locking
- Centralized action logging

---

## 🌍 Localization

- Accept-Language header
- Default: en
- Expandable without code changes

---

## ⚙️ Configuration

Feature toggles via baseServerConfig.

---

## 🚀 Run

```bash
npm install
npm run dev
```

---

## ⚠️ Rules

- No raw error messages to client
- No hardcoded strings outside MSG
- No service export removal
- No logic in controllers

---

## ✅ Status

Backend refactor complete. Ready for frontend integration.
