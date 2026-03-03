# API Endpoints Reference

> Base URL: `/api`

---

## Auth (`/api/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Authenticate user and create session |
| POST | `/api/auth/register` | Register new user account |
| POST | `/api/auth/forgotpass` | Reset password using pincode |
| POST | `/api/auth/logout` | Destroy session and clear auth cookie |

---

## Account (`/api/account`) — Requires Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/account/me` | Get authenticated user details |
| POST | `/api/account/change-password` | Change user password |
| POST | `/api/account/change-pincode` | Change user PIN code |
| POST | `/api/account/change-email` | Change user email address |

---

## Character (`/api/character`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/character/rankings` | Public | Character rankings with optional filtering |
| GET | `/api/character/my-character` | User | Get all characters of authenticated user |
| POST | `/api/character/change-school` | User | Change character school |
| POST | `/api/character/reset-stats` | User | Reset character stat points |
| POST | `/api/character/reborn` | User | Perform character reborn |
| GET | `/api/character/reborn-preview` | User | Preview reborn changes |
| POST | `/api/character/change-class` | User | Change character class |
| POST | `/api/character/delete` | User | Delete a character |

---

## Shop (`/api/shop`) — Requires Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/shop/categories` | Get all shop categories |
| GET | `/api/shop/items` | Get shop items by category |
| GET | `/api/shop` | Get full shop structure |
| GET | `/api/shop/purchase-history` | Get user's purchase history |
| POST | `/api/shop/purchase` | Purchase a shop item |

---

## Top-Up (`/api/topup`)

**User Routes (Requires Auth):**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/topup/history` | Get user's top-up history |
| GET | `/api/topup/check` | Validate top-up code |
| POST | `/api/topup/redeem` | Redeem top-up code |

**Staff Routes:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/topup/admin/list` | List generated top-up codes |
| POST | `/api/topup/admin/generate` | Generate new top-up codes |

---

## Tickets (`/api/tickets`)

**Public:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tickets/categories` | Get ticket categories |

**User Routes (Requires Auth):**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tickets/create` | Create support ticket (with file upload) |
| GET | `/api/tickets/my-tickets` | Get user's own tickets |
| GET | `/api/tickets/:ticketId` | Get ticket details |
| POST | `/api/tickets/:ticketId/reply` | Reply to ticket (with file upload) |

**Staff Routes:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tickets/staff/all` | Get all tickets for staff review |
| GET | `/api/tickets/staff/list` | Get available staff members |
| GET | `/api/tickets/staff/:ticketId` | Get ticket details (staff access) |
| PUT | `/api/tickets/staff/:ticketId/status` | Update ticket status |
| PUT | `/api/tickets/staff/:ticketId/assign` | Assign ticket to staff |
| POST | `/api/tickets/staff/:ticketId/reply` | Staff reply to ticket |

---

## News (`/api/news`) — Public

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/news` | List news entries (optional pinned filter) |
| GET | `/api/news/categories` | List news categories |
| GET | `/api/news/:id` | Get specific news entry |

---

## Downloads (`/api/download`) — Public

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/download` | List downloadable files (optional type filter) |
| GET | `/api/download/types` | List download types |
| GET | `/api/download/:id` | Get specific download entry |

---

## Public Config (`/api/public`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/public/config` | Get server config and feature flags |
| GET | `/api/public/stats` | Get public server stats (activePlayers, totalAccounts, totalCharacters) — no auth required |

---

## Health Check (`/api/healthcheck`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/healthcheck/` | Service health and uptime status |

---

## Items (`/api/items`) — Public

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/items/:mid/:sid` | Get static item metadata by ID |

---

## Admin (`/api/admin`) — Requires Staff Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/download` | Create downloadable resource |
| POST | `/api/admin/edit-download` | Update download entry |
| POST | `/api/admin/news` | Create news entry |
| POST | `/api/admin/edit-news` | Update news entry |
| POST | `/api/admin/shop/category` | Create shop category |
| PUT | `/api/admin/shop/category/:categoryNum` | Update shop category |
| POST | `/api/admin/shop/item` | Create shop item |
| PUT | `/api/admin/shop/item/:productNum` | Update shop item |

---

## Debug (`/api/debug`) — Public

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/debug/session` | Get current session info |

---

## GM Tool (`/api/gmtool`) — Requires Auth + GM Access

### User Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/gmtool/users` | Search/list user accounts |
| POST | `/api/gmtool/users` | Create new user account |
| GET | `/api/gmtool/users/:userNum` | Get full account info |
| PUT | `/api/gmtool/users/:userNum` | Update user account |
| POST | `/api/gmtool/users/:userNum/block` | Block user account |
| POST | `/api/gmtool/users/:userNum/chat-block` | Restrict user chat |
| POST | `/api/gmtool/users/:userNum/force-offline` | Force user offline |
| GET | `/api/gmtool/users/:userNum/login-logs` | Get login history |
| DELETE | `/api/gmtool/users/:userNum/login-logs` | Clear login history |
| GET | `/api/gmtool/users/:userNum/characters` | Get user's characters |
| GET | `/api/gmtool/users/:userNum/referrals` | Get referral history |
| GET | `/api/gmtool/users/:userId/bank` | Get pending bank items |
| POST | `/api/gmtool/users/:userId/bank` | Insert item into bank |
| POST | `/api/gmtool/users/:userId/bank/clear` | Mark all bank items taken |
| POST | `/api/gmtool/users/:userId/bank/:purKey/taken` | Mark single bank item taken |

### Top-Up Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/gmtool/topups` | List all unused top-up codes |
| POST | `/api/gmtool/topups/generate` | Generate new top-up codes |
| POST | `/api/gmtool/topups/:idx/use` | Mark top-up code as used |

### PCID Blocking

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/gmtool/pcid` | List all blocked PC identifiers |
| POST | `/api/gmtool/pcid` | Add PCID to block list |
| DELETE | `/api/gmtool/pcid/:idx` | Remove PCID block entry |

### Character Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/gmtool/character/search` | Search characters (name/ChaNum/UserNum) |
| GET | `/api/gmtool/character/:chaNum` | Get full CHARINFO container |
| PATCH | `/api/gmtool/character/:chaNum` | Update character data (partial) |
| GET | `/api/gmtool/character/:chaNum/skills` | Get character skills (binary blob) |
| PUT | `/api/gmtool/character/:chaNum/skills` | Update character skills |
| GET | `/api/gmtool/character/:chaNum/puton` | Get equipped items |
| POST | `/api/gmtool/character/:chaNum/puton/save` | Save equipped items |

### Shop Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/gmtool/shop/categories` | Get all shop categories |
| POST | `/api/gmtool/shop/categories` | Create shop category |
| PATCH | `/api/gmtool/shop/categories/:idx` | Update shop category |
| GET | `/api/gmtool/shop/items` | Get all shop items |
| POST | `/api/gmtool/shop/items` | Create shop item |
| PATCH | `/api/gmtool/shop/items/:productNum` | Update shop item |
| DELETE | `/api/gmtool/shop/items/:productNum` | Disable shop item |
| GET | `/api/gmtool/shop/mystery/items` | Get mystery shop items |
| POST | `/api/gmtool/shop/mystery/items` | Create mystery shop item |
| PATCH | `/api/gmtool/shop/mystery/items/:productId` | Update mystery item |
| DELETE | `/api/gmtool/shop/mystery/items/:productId` | Disable mystery item |
| GET | `/api/gmtool/shop/mystery/user/:userNum` | Load user mystery shop blob |
| POST | `/api/gmtool/shop/mystery/user/:userNum` | Save user mystery shop blob |

### GM Action Log

> Logs every GM tool and admin panel request automatically via middleware. Stored in `ActionLogGM` table.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/gmtool/actionlog` | Query GM action logs with filtering and pagination |
| GET | `/api/gmtool/actionlog/action-types` | Get distinct action types for filter dropdowns |

**Query Parameters for `/api/gmtool/actionlog`:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `gmUserNum` | number | Filter by GM user numeric ID |
| `actionType` | string | e.g. `UPDATE_CHARACTER`, `BLOCK_USER`, `CREATE_SHOP_ITEM` |
| `entityType` | string | e.g. `CHARACTER`, `USER`, `SHOP_ITEM`, `DASHBOARD` |
| `entityId` | string | Specific entity ID |
| `httpMethod` | string | `GET`, `POST`, `PATCH`, `PUT`, `DELETE` |
| `dateFrom` | ISO string | Start of date range |
| `dateTo` | ISO string | End of date range |
| `search` | string | Free text on Description or HttpPath |
| `page` | number | Page number (default: 1) |
| `limit` | number | Rows per page (default: 50, max: 100) |

---

## GM Item (`/api/gmItem`) — Requires Auth + GM Access

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/gmItem/character/:chaNum` | Get character inventory items |

---

## Admin Panel (`/api/adminpanel`) — Requires Staff Auth

### Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/adminpanel/dashboard` | Dashboard overview data |
| GET | `/api/adminpanel/dashboard/trend` | Dashboard trend data |
| GET | `/api/adminpanel/dashboard/stat-per-school` | Stats per school |
| GET | `/api/adminpanel/dashboard/stat-per-class` | Stats per class |

### Character

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/adminpanel/character/search` | Search characters |
| GET | `/api/adminpanel/character/:chaNum` | Get character details |
| PATCH | `/api/adminpanel/character/:chaNum` | Update character data |

### Shop

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/adminpanel/shop/categories` | Get shop categories |
| POST | `/api/adminpanel/shop/categories` | Create category |
| PATCH | `/api/adminpanel/shop/categories/:idx` | Update category |
| GET | `/api/adminpanel/shop/items` | Get shop items |
| POST | `/api/adminpanel/shop/items` | Create shop item |
| PATCH | `/api/adminpanel/shop/items/:productNum` | Update shop item |
| DELETE | `/api/adminpanel/shop/items/:productNum` | Disable shop item |
| GET | `/api/adminpanel/shop/mystery/items` | Get mystery items |
| POST | `/api/adminpanel/shop/mystery/items` | Create mystery item |
| PATCH | `/api/adminpanel/shop/mystery/items/:productId` | Update mystery item |
| DELETE | `/api/adminpanel/shop/mystery/items/:productId` | Disable mystery item |
| GET | `/api/adminpanel/shop/mystery/user/:userNum` | Get user mystery data |
| POST | `/api/adminpanel/shop/mystery/user/:userNum` | Save user mystery data |

### User Action Log

> Logs user-facing actions (login, purchases, character changes, tickets, account updates). Stored in `ActionLog` table. Separate from GM Action Log.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/adminpanel/actionlog` | Query user action logs with filtering and pagination |
| GET | `/api/adminpanel/actionlog/action-types` | Get distinct action types for filter dropdowns |

**Query Parameters for `/api/adminpanel/actionlog`:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `userId` | number | Filter by user numeric ID |
| `actionType` | string | e.g. `LOGIN`, `LOGIN_FAILED`, `SHOP_PURCHASE`, `TOPUP_REDEEM`, `CHANGE_SCHOOL`, `REBORN`, `DELETE_CHARACTER`, `CREATE`, `UPDATE`, `REPLY`, `ASSIGN` |
| `entityType` | string | e.g. `USER`, `CHARACTER`, `SHOP`, `ACCOUNT`, `TICKET`, `DOWNLOAD`, `NEWS` |
| `entityId` | string | Specific entity ID |
| `success` | `"true"` / `"false"` | Filter by outcome — useful for finding all failed login attempts |
| `ipAddress` | string | Exact IP address match |
| `dateFrom` | ISO string | Start of date range |
| `dateTo` | ISO string | End of date range |
| `search` | string | Free text search on Description field |
| `page` | number | Page number (default: 1) |
| `limit` | number | Rows per page (default: 50, max: 200) |

---

## Auth Levels

| Level | Description |
|-------|-------------|
| **Public** | No authentication required |
| **User** | Requires authenticated session (Bearer token) |
| **Staff** | Requires `userType >= 50` |
| **GM Access** | Requires Auth + GM Tool permission check |


##
Guide: Adding a New Feature to the Server Config
Follow these 5 steps every time you want to add a new toggleable feature.

Step 1 — Add the default value to server.config.js
This is the source of truth for defaults and the shape of the section.


// ran-backend/src/config/server.config.js
export const baseServerConfig = {
  // ... existing sections ...

  myNewFeature: {         // <-- new top-level section (or field in an existing section)
    enabled: true,
    someOption: "default",
  },
};
If it's a boolean flag that belongs to an existing section (like features), just add the field there — no new section needed.

Step 2 — Whitelist the section key in serverConfig.service.js
Only sections listed here are read from / written to the DB.


// ran-backend/src/services/serverConfig.service.js
const DB_SECTIONS = [
  // ... existing keys ...
  "myNewFeature",   // <-- add this if it's a new top-level section
];
If your field was added inside an existing section (e.g. features.myFlag), skip this step — the whole features object is already in DB_SECTIONS.

Step 3 — Expose it via the public config endpoint (if players need to see it)

// ran-backend/src/api/controllers/publicConfig.controller.js
export function getPublicConfig(req, res) {
  res.json({
    // ... existing fields ...

    myNewFeature: {
      enabled: baseServerConfig.myNewFeature.enabled,
      someOption: baseServerConfig.myNewFeature.someOption,
    },
  });
}
Skip this step for staff-only / server-internal settings.

Step 4 — Add the TypeScript type to the frontend interface

// ran-frontend/lib/data/publicConfig.data.ts
export interface PublicConfig {
  // ... existing fields ...

  myNewFeature: {
    enabled: boolean;
    someOption: string;
  };
}
Then use it in any page with the existing hook — no extra setup:


const { config } = usePublicConfig();
if (!config?.myNewFeature?.enabled) return <FeatureDisabled />;
Step 5 — Add an edit UI in the Admin Config panel
Add a new tab function in ConfigSection.tsx following the exact same pattern as existing tabs like FeaturesTab or ShopTab:


function MyNewFeatureTab({ data, onSave }: { data: any; onSave: (v: any) => Promise<void> }) {
  const [form, setForm] = useState({ ...data });
  const [saving, setSaving] = useState(false);
  // ... switches / inputs for each field ...
  return (
    <>
      {/* your FieldRow / Switch / Input elements */}
      <SaveBar onSave={handleSave} saving={saving} />
    </>
  );
}
Then register it in the <Tabs> in ConfigSection:


<TabsTrigger value="myNewFeature">My Feature</TabsTrigger>
// ...
<TabsContent value="myNewFeature">
  {cfg.myNewFeature && (
    <MyNewFeatureTab data={cfg.myNewFeature} onSave={(v) => save("myNewFeature", v)} />
  )}
</TabsContent>
Summary Checklist
#	File	What to do
1	server.config.js	Add default value
2	serverConfig.service.js DB_SECTIONS	Whitelist new top-level key (if applicable)
3	publicConfig.controller.js	Expose field publicly (if players need it)
4	publicConfig.data.ts	Add TypeScript type, use usePublicConfig() in pages
5	ConfigSection.tsx	Add admin edit tab
Summary of Code Changes
Auto-create tables (setup.service.js — new file): Creates 8 OrenjiWeb tables on startup using IF NOT EXISTS guards — completely safe on an existing DB: ActionLog, TicketCategories (+ 5 default categories seeded), Tickets, TicketReplies, TicketAttachments, TicketHistory, News, DownloadLinks, ServerConfig.

server.js: Now calls await setupWebPoolTables() before await loadServerConfig() so all tables are guaranteed to exist before any service runs.

footer.tsx: No longer has hardcoded GAME_NAME = "RAN Online". The brand name, tagline, and copyright line are all derived from publicConfig:

Brand name → config.serverName (falls back to "RAN Online")
Tagline → config.serverMotto (falls back to the old hardcoded string)
Copyright → config.footertext if set, otherwise auto-generates © {year} {serverName}. All rights reserved.