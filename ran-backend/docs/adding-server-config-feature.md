# Adding a New Feature to the Server Config

This guide covers the exact steps needed to add a new toggleable feature to the DB-backed
server configuration system — from the backend default value all the way to the admin panel
edit UI and frontend feature gate.

---

## How the Config System Works

`baseServerConfig` in `src/config/server.config.js` is the **source of truth for defaults**.
On every startup, `loadServerConfig()` reads any rows saved in the `dbo.ServerConfig` DB table
and merges them **in-place** into `baseServerConfig` using `Object.assign`. Because the merge is
in-place, all 15+ existing consumers that already `import { baseServerConfig }` automatically
see the live DB values with zero import changes.

When a staff member saves a section from the admin panel, the value is written to the DB **and**
applied to the in-memory object immediately — no server restart required.

---

## Step-by-Step

### Step 1 — Add the default value to `server.config.js`

This is the only place defaults live. Define the exact shape and sensible defaults here.

```js
// src/config/server.config.js
export const baseServerConfig = {
  // ... existing sections ...

  // Option A: new top-level section
  myNewFeature: {
    enabled: true,
    someOption: "default",
  },

  // Option B: new field inside an existing section (e.g. features)
  features: {
    // ... existing fields ...
    myFlag: true,   // <-- just add here; no new DB section needed
  },
};
```

---

### Step 2 — Whitelist the section key in `serverConfig.service.js`

Only keys listed in `DB_SECTIONS` are persisted to / loaded from the database.

```js
// src/services/serverConfig.service.js
const DB_SECTIONS = [
  // ... existing keys ...
  "myNewFeature",   // <-- add only if it's a NEW top-level section
];
```

> **If you added a field inside an existing section** (Option B above), skip this step.
> The whole parent section (e.g. `features`) is already in `DB_SECTIONS`.

---

### Step 3 — Expose it via the public config endpoint *(player-facing features only)*

Skip this step for staff-only or server-internal settings.

```js
// src/api/controllers/publicConfig.controller.js
export function getPublicConfig(req, res) {
  res.json({
    // ... existing fields ...

    myNewFeature: {
      enabled: baseServerConfig.myNewFeature.enabled,
      someOption: baseServerConfig.myNewFeature.someOption,
    },
  });
}
```

---

### Step 4 — Add the TypeScript type in the frontend

```ts
// ran-frontend/lib/data/publicConfig.data.ts
export interface PublicConfig {
  // ... existing fields ...

  myNewFeature: {
    enabled: boolean;
    someOption: string;
  };
}
```

Then gate any page or component with the existing hook — no extra setup required:

```tsx
const { config } = usePublicConfig();

if (!config?.myNewFeature?.enabled) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center text-center py-12 space-y-4">
        <Ban size={56} className="opacity-50" />
        <h1 className="text-xl font-semibold">Feature Unavailable</h1>
        <p className="text-muted-foreground text-sm">
          This feature is currently disabled.
        </p>
      </CardContent>
    </Card>
  );
}
```

Also hide any navbar / footer links that point to the disabled feature:

```tsx
// navbar.tsx or footer.tsx
{config?.myNewFeature?.enabled !== false && (
  <Link href="/my-feature">My Feature</Link>
)}
```

---

### Step 5 — Add an edit tab in the Admin Config panel

Open `ran-frontend/components/admin/sections/ConfigSection.tsx` and follow the same pattern
as existing tabs.

**a) Create the tab component:**

```tsx
function MyNewFeatureTab({ data, onSave }: { data: any; onSave: (v: any) => Promise<void> }) {
  const [form, setForm] = useState({ ...data });
  const [saving, setSaving] = useState(false);

  useEffect(() => { setForm({ ...data }); }, [data]);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(form);
      toast.success("Saved.");
    } catch {
      toast.error("Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* Boolean toggle example */}
      <FieldRow>
        <FieldLabel label="Enable My Feature" desc="Turn on / off globally" />
        <Switch
          checked={form.enabled}
          onCheckedChange={(v) => setForm((p: any) => ({ ...p, enabled: v }))}
        />
      </FieldRow>

      {/* Text input example */}
      <FieldRow>
        <FieldLabel label="Some Option" />
        <Input
          className="w-56 text-sm"
          value={form.someOption ?? ""}
          onChange={(e) => setForm((p: any) => ({ ...p, someOption: e.target.value }))}
        />
      </FieldRow>

      <SaveBar onSave={handleSave} saving={saving} />
    </>
  );
}
```

**b) Register the tab in `<Tabs>` inside `ConfigSection`:**

```tsx
// In the TabsList:
<TabsTrigger value="myNewFeature">My Feature</TabsTrigger>

// In the TabsContent area:
<TabsContent value="myNewFeature">
  {cfg.myNewFeature && (
    <MyNewFeatureTab
      data={cfg.myNewFeature}
      onSave={(v) => save("myNewFeature", v)}
    />
  )}
</TabsContent>
```

---

## Quick Checklist

| # | File | Action |
|---|------|--------|
| 1 | `src/config/server.config.js` | Add default value with correct shape |
| 2 | `src/services/serverConfig.service.js` | Add key to `DB_SECTIONS` *(new top-level section only)* |
| 3 | `src/api/controllers/publicConfig.controller.js` | Expose field publicly *(player-facing only)* |
| 4 | `ran-frontend/lib/data/publicConfig.data.ts` | Add TypeScript type |
| 4 | Any affected page/component | Gate with `usePublicConfig()` check |
| 4 | `navbar.tsx` / `footer.tsx` | Conditionally hide links |
| 5 | `ran-frontend/components/admin/sections/ConfigSection.tsx` | Add edit tab |

---

## Tips

- **No restart needed** for config changes — the in-memory object is mutated immediately when
  the admin saves. The change takes effect on the very next incoming request.
- **Graceful fallback** — if the DB is unreachable at startup, the static defaults from
  `server.config.js` remain active. The server still boots.
- **Staff-only vs public** — only expose values in `publicConfig.controller.js` that the
  frontend legitimately needs. Internal/structural settings (e.g. rate limits, logging flags)
  should stay server-side only.
- **Section granularity** — saving writes the **entire section** as one JSON blob. Keep related
  settings grouped in the same top-level section so one Save button covers them all.
