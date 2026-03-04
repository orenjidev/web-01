# Architecture Reference — ran-cp00

> Auto-generated from reverse-engineering the codebase. Keep this file updated when adding new services, routes, or tables.

---

## Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Node.js (ESM), Express 5, MSSQL 12 |
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript |
| **Auth** | Session-based (express-session), HTTP-only cookies |
| **Databases** | Microsoft SQL Server (5 databases) |
| **Config** | In-memory defaults + DB-backed overrides (hot reload) |

---

## Database Schema

### 5 Databases

| Env Var | DB Name | Purpose |
|---------|---------|---------|
| `DB_NAME_USER` | `RG2User` | User accounts (`UserInfo`) |
| `DB_NAME_GAME` | `RG2Game` | Game data (`ChaInfo`, `ChaBattleStat`) |
| `DB_NAME_SHOP` | `RG2Shop` | Shop purchases |
| `DB_NAME_LOG` | `RG2Log` | Action & GM logs |
| `DB_NAME_WEB` | `OrenjiWeb` | Web portal: tickets, news, downloads, server config |

### `RG2User.dbo.UserInfo`

| Column | Type | Notes |
|--------|------|-------|
| `UserNum` | INT | Primary key, auto-increment |
| `UserID` | VARCHAR | Username (4–12 chars, alphanumeric + `_.-`) |
| `UserPass` | VARCHAR | Password — MD5 uppercase truncated (19 chars) when `IsMD5=true` |
| `UserPass2` | VARCHAR | Pincode (same encoding as password) |
| `UserEmail` | VARCHAR | Email address (must be unique) |
| `UserAvailable` | TINYINT | `0` = disabled, `1` = enabled |
| `UserBlock` | TINYINT | `0` = active, `1` = blocked |
| `UserType` | INT | `0` = regular user, `50+` = staff, higher = admin |
| `ChaRemain` | INT | Character creation slots remaining |
| `UserPoint` | INT | E-Points (EP) balance |
| `UserPoint2` | INT | V-Points (VP) balance |
| `LastLoginDate` | DATETIME | Last successful login timestamp |

### `RG2Game.dbo.ChaInfo`

| Column | Type | Notes |
|--------|------|-------|
| `ChaNum` | INT | Primary key |
| `UserNum` | INT | FK → `UserInfo.UserNum` |
| `ChaName` | VARCHAR | Character name |
| `ChaClass` | INT | Class ID (maps to classMap.js) |
| `ChaSchool` | INT | `0`=SG, `1`=MP, `2`=PNX |
| `ChaLevel` | INT | Character level |
| `ChaEXP` | BIGINT | Experience points |
| `ChaMoney` | BIGINT | Gold |
| `ChaOnline` | BIT | Online status |
| `ChaDeleted` | BIT | Soft delete flag |
| `ChaDeletedDate` | DATETIME | Deletion timestamp |
| `ChaReborn` | INT | Reborn count |
| `ChaPower` | INT | Strength stat |
| `ChaDex` | INT | Dexterity stat |
| `ChaSpirit` | INT | Spirit stat |
| `ChaStrong` | INT | Strong stat |
| `ChaStrength` | INT | Strength stat 2 |
| `ChaIntel` | INT | Intelligence stat |
| `ChaStRemain` | INT | Unallocated stat points |
| `ChaSkillSlot` | nullable | Set to NULL on class change |

### `RG2Game.dbo.ChaBattleStat`

| Column | Type | Notes |
|--------|------|-------|
| `ChaNum` | INT | FK → `ChaInfo.ChaNum` |
| `PVPKills` | INT | PVP kill count |
| `PVPDeaths` | INT | PVP death count |

### `OrenjiWeb.dbo.ServerConfig`

| Column | Type | Notes |
|--------|------|-------|
| `ConfigKey` | NVARCHAR(100) | Section name (e.g. `"features"`) |
| `ConfigValue` | NVARCHAR(MAX) | JSON-serialized section object |
| `UpdatedAt` | DATETIME | Last update timestamp |

### `OrenjiWeb.dbo.Tickets`

| Column | Type | Notes |
|--------|------|-------|
| `TicketID` | INT | PK |
| `UserNum` | INT | FK → UserInfo |
| `CategoryID` | INT | FK → TicketCategories |
| `Subject` | NVARCHAR | Ticket subject |
| `Description` | NVARCHAR(MAX) | Initial description |
| `Status` | VARCHAR | `Open`, `In Progress`, `Resolved`, `Closed` |
| `Priority` | VARCHAR | `Low`, `Medium`, `High` |
| `CharacterName` | VARCHAR | Optional: in-game character name |
| `GameID` | VARCHAR | Optional: userid |
| `AssignedToStaffUserNum` | INT | Assigned staff member |
| `CreatedAt` | DATETIME | — |
| `UpdatedAt` | DATETIME | Updated on each reply |

### `OrenjiWeb.dbo.TicketReplies`

| Column | Type | Notes |
|--------|------|-------|
| `ReplyID` | INT | PK |
| `TicketID` | INT | FK → Tickets |
| `UserNum` | INT | FK → UserInfo |
| `Message` | NVARCHAR(MAX) | Reply content |
| `IsStaffReply` | BIT | `1` if staff response |
| `CreatedAt` | DATETIME | — |

### `OrenjiWeb.dbo.TicketAttachments`

| Column | Type | Notes |
|--------|------|-------|
| `AttachmentID` | INT | PK |
| `TicketID` | INT | FK → Tickets |
| `ReplyID` | INT | nullable — null = ticket-level attachment |
| `FileName` | VARCHAR | Original filename |
| `FilePath` | VARCHAR | Stored filename (in `/uploads`) |
| `FileSize` | INT | File size in bytes |
| `FileType` | VARCHAR | MIME type |
| `UploadedByUserNum` | INT | FK → UserInfo |
| `UploadedAt` | DATETIME | — |

### `RG2Log.dbo.ActionLog` (user action log)

| Column | Type | Notes |
|--------|------|-------|
| `LogID` | INT | PK |
| `UserNum` | INT | FK → UserInfo (nullable for anonymous) |
| `ActionType` | VARCHAR | `LOGIN`, `LOGIN_FAILED`, `CREATE`, `UPDATE`, `DELETE`, `REPLY`, etc. |
| `EntityType` | VARCHAR | `USER`, `CHARACTER`, `TICKET`, etc. |
| `EntityId` | VARCHAR | Affected entity ID (format: `UserNum:UserID` for users) |
| `Description` | NVARCHAR | Human-readable description |
| `IPAddress` | VARCHAR | Client IP |
| `UserAgent` | VARCHAR | Client user agent |
| `Success` | BIT | `1` on success |
| `CreatedAt` | DATETIME | — |

### `RG2Log.dbo.GmActionLog` (admin/GM action log)

| Column | Type | Notes |
|--------|------|-------|
| `LogID` | INT | PK |
| `GmUserNum` | INT | FK → UserInfo |
| `GmUserID` | VARCHAR | GM username |
| `GmUserType` | INT | User type at time of action |
| `ActionType` | VARCHAR | Action classification |
| `HttpMethod` | VARCHAR | HTTP verb |
| `HttpPath` | VARCHAR | Route path |
| `EntityType` | VARCHAR | Affected entity type |
| `EntityID` | VARCHAR | Affected entity ID |
| `Description` | NVARCHAR | Human-readable |
| `RequestBody` | NVARCHAR(MAX) | Sanitized request payload |
| `MetadataJson` | NVARCHAR(MAX) | Additional context |
| `IPAddress` | VARCHAR | Client IP |
| `UserAgent` | VARCHAR | — |
| `Success` | BIT | — |
| `ResponseStatus` | INT | HTTP response code |
| `CreatedAt` | DATETIME | — |

---

## API Route Map

Base path: `/api`

### Auth — `/api/auth` (Public)
| Method | Path | Rate Limit | Notes |
|--------|------|-----------|-------|
| POST | `/login` | — | Validates body size (exactly 2 keys) |
| POST | `/register` | 5 req/15 min | 5–7 body keys required |
| POST | `/forgotpass` | — | Resets password via pincode |
| POST | `/logout` | — | Destroys session |

### Account — `/api/account` (requireAuth)
| Method | Path | Feature Gate |
|--------|------|-------------|
| GET | `/me` | — |
| POST | `/change-password` | `features.changePassword` |
| POST | `/change-pincode` | `features.changePin` |
| POST | `/change-email` | `features.changeEmail` |
| POST | `/convert-points` | `convertfeature.{direction}.enabled` |

### Character — `/api/character`
| Method | Path | Auth |
|--------|------|------|
| GET | `/rankings` | Public |
| GET | `/my-character` | requireAuth |
| POST | `/change-school` | requireAuth + `changeSchool.enabled` |
| POST | `/reset-stats` | requireAuth + `resetStats.enabled` |
| POST | `/reborn` | requireAuth + `reborn.enabled` |
| GET | `/reborn-preview` | requireAuth |
| POST | `/change-class` | requireAuth + `changeClass.enabled` |
| POST | `/delete` | requireAuth + `characterDelete` feature |

### Public — `/api/public` (No auth)
| Method | Path | Notes |
|--------|------|-------|
| GET | `/config` | Returns `PublicConfig` shape — features, slider, social, gameoptions |
| GET | `/stats` | Live account/character counts |

### Shop — `/api/shop` (requireShopEnabled)
| Method | Path | Auth |
|--------|------|------|
| GET | `/categories` | Public |
| GET | `/items` | Public |
| GET | `/` | Public |
| GET | `/purchase-history` | requireAuth |
| POST | `/purchase` | requireAuth |

### Tickets — `/api/tickets` (requireAuth + requireTicketSystem)
| Method | Path |
|--------|------|
| GET | `/` |
| POST | `/` |
| GET | `/:ticketId` |
| POST | `/:ticketId/reply` |
| (Staff) various | — |

### Admin — `/api/admin` (requireStaff)
| Method | Path |
|--------|------|
| POST | `/download` |
| POST | `/edit-download` |
| POST | `/news` |
| POST | `/edit-news` |
| POST/PUT | `/shop/category[/:id]` |
| POST/PUT | `/shop/item[/:id]` |

### Admin Panel — `/api/adminpanel` (requireStaff)
Sub-routers: `/dashboard`, `/character`, `/shop`, `/actionlog`, `/server-config`

### Other
| Path | Auth | Notes |
|------|------|-------|
| `/api/topup` | requireTopUpEnabled | Prepaid code redemption |
| `/api/news` | Public | News listings |
| `/api/download` | Public | Download links |
| `/api/gmtool` | GM module auth | GM tool operations |
| `/api/healthcheck` | Public | Service health |
| `/api/debug` | — | Diagnostics |

---

## Service Responsibilities

| Service | Purpose |
|---------|---------|
| `auth.service.js` | Login, register, forgot-password |
| `account.service.js` | Change password/pin/email, convert points, get account info |
| `character.service.js` | Rankings (cached), character CRUD, school/class/reborn changes |
| `ticket.service.js` | Ticket creation, replies, status updates (user + staff) |
| `admin.service.js` | Download/news/shop management (admin CRUD) |
| `serverConfig.service.js` | Hot-reload config from DB; `DB_SECTIONS` management |
| `actionlog.service.js` | Write user action logs to `RG2Log` |
| `actionLogGM.service.js` | Write GM action logs + middleware |
| `shop.service.js` | Shop item listing, purchase processing |
| `topup.service.js` | Prepaid top-up code redemption |
| `news.service.js` | News CRUD |
| `download.service.js` | Download link CRUD |
| `items.service.js` | Item catalog from JSON cache |
| `setup.service.js` | Bootstrap DB tables on startup |
| `dashboard.service.js` | Admin dashboard stats |

---

## Authentication Flow

```
Client request (with session cookie)
    │
    ▼
Express middleware chain (loaders/express.js)
    │ session() ← reads/writes req.session via cookie
    │ ctx hydration ← req.ctx = { user, ip, lang, userAgent }
    │
    ▼
Route handler
    │
    ├─ [requireAuth] → checks req.session.user → 401 if missing → rebuilds req.ctx
    ├─ [requireStaff] → requireAuth + user.type >= 50 → 403 if insufficient
    └─ [feature gates] → check baseServerConfig flags → 403 if disabled
    │
    ▼
Controller (api/controllers/)
    │ maps HTTP → service call
    │
    ▼
Service (services/)
    │ validates body → queries DB → logAction → returns { ok, message, data }
    │
    ▼
Controller maps ok/!ok → HTTP status + JSON response
```

### Session Details
- **Library**: `express-session` v1.19
- **Cookie name**: `process.env.COOKIE` (e.g. `rng-web-dev`)
- **Secret**: `process.env.SESSION_SECRET` (⚠️ was hardcoded — now via env)
- **Duration**: 2 hours (`maxAge: 1000 * 60 * 60 * 2`)
- **HttpOnly**: `true`
- **SameSite**: `lax`
- **Secure**: `false` (⚠️ should be `true` in production — see THREAT_MODEL.md)
- **Fixation protection**: `req.session.regenerate()` called on login

### Login Session Data (`req.session.user`)
```js
{
  userid: string,   // UserID from UserInfo
  userNum: number,  // UserNum from UserInfo
  type: number,     // UserType from UserInfo
}
```

---

## Configuration System

### Hierarchy
1. **Defaults** — `src/config/server.config.js` (hardcoded JS object `baseServerConfig`)
2. **DB overrides** — `OrenjiWeb.dbo.ServerConfig` table (JSON per section)
3. **Merge** — on startup, `loadServerConfig()` reads DB rows and `Object.assign(baseServerConfig[key], dbMap[key])` for each `DB_SECTIONS` entry

### DB-Managed Sections (`DB_SECTIONS`)
```
coreOptions, features, definitions, changeSchool, changeClass, resetStats,
reborn, convertfeature, votingSystem, shop, uihelper, classes, social,
sliderConfig, systemRequirements
```

### Hot Reload
`updateConfigSection(key, value)` does a SQL MERGE (upsert) + updates in-memory `baseServerConfig[key]` simultaneously. No server restart required.

### Public Config Shape (`GET /api/public/config`)
Returned to frontend — includes: `serverName`, `serverMotto`, `features`, `shop`, `gameoptions`, `sliderConfig`, `systemRequirements`, `social`.

---

## Frontend Context Hierarchy

```
<AuthProvider>                 ← user session state, refresh(), logout()
  <PublicConfigProvider>       ← server config fetched once, refresh() after admin saves
    <LanguageProvider>         ← "en"/"th", reads localStorage, falls back to defaultLanguage
      <TooltipProvider>
        <ModalProvider>        ← login/register/forgot modal state machine
          {page}
        </ModalProvider>
      </TooltipProvider>
    </LanguageProvider>
  </PublicConfigProvider>
</AuthProvider>
```

### Auth Context (`context/AuthContext.tsx`)
```ts
{ user: Account | null; loading: boolean; refresh(); clear(); logout() }
```
- `refresh()` → `GET /api/account/me`
- `logout()` → `POST /api/auth/logout` + clears state

---

## Known Tech Debt

| Issue | Severity | See |
|-------|----------|-----|
| MD5 password hashing (`ismd5: true`) | HIGH | `THREAT_MODEL.md` |
| Session cookie `secure: false` in all envs | MEDIUM | `THREAT_MODEL.md` |
| No rate limit on `POST /api/auth/login` | HIGH | `THREAT_MODEL.md` |
| No CSRF protection | MEDIUM | `THREAT_MODEL.md` |
| `console.log(character)` left in `getRebornPreview` | LOW | `character.service.js:412` |
| Unused `jsonwebtoken` dependency | LOW | `ran-backend/package.json` |
| Unused `yamljs` dependency | LOW | `ran-backend/package.json` |
| `swagger-ui-express` installed but commented out | LOW | `ran-backend/package.json` |
