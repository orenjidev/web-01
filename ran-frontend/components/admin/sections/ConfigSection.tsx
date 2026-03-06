"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getServerConfig,
  saveConfigSection,
  uploadSliderImage,
} from "@/lib/data/admin.config.data";
import { usePublicConfig } from "@/context/PublicConfigContext";
import { en as enDefault } from "@/lib/i18n/locales/en";
import { th as thDefault } from "@/lib/i18n/locales/th";

/* ─────────────────────────────
   Small helpers
───────────────────────────── */

function FieldRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 border-b border-border last:border-0">
      {children}
    </div>
  );
}

function FieldLabel({ label, desc }: { label: string; desc?: string }) {
  return (
    <div className="min-w-0">
      <p className="text-sm font-medium">{label}</p>
      {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
    </div>
  );
}

function SaveBar({ onSave, saving }: { onSave: () => void; saving: boolean }) {
  return (
    <div className="flex justify-end pt-4">
      <Button size="sm" onClick={onSave} disabled={saving}>
        {saving ? "Saving…" : "Save Changes"}
      </Button>
    </div>
  );
}

/* ─────────────────────────────
   Section: Server Info (definitions)
───────────────────────────── */

function ServerInfoTab({
  data,
  onSave,
}: {
  data: any;
  onSave: (v: any) => Promise<void>;
}) {
  const [form, setForm] = useState({ ...data });
  const [highlightsText, setHighlightsText] = useState<string>(
    (data.highlights ?? []).join("\n"),
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({ ...data });
    setHighlightsText((data.highlights ?? []).join("\n"));
  }, [data]);

  const set = (k: string, v: string) => setForm((p: any) => ({ ...p, [k]: v }));

  async function handleSave() {
    setSaving(true);
    try {
      const highlights = highlightsText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      await onSave({ ...form, highlights });
      toast.success("Server info saved.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {[
        { key: "serverName", label: "Server Name" },
        { key: "serverWebsite", label: "Website URL" },
        { key: "serverMotto", label: "Motto" },
        { key: "ePointsName", label: "E-Points Name" },
        { key: "vPointsName", label: "V-Points Name" },
        { key: "footer", label: "Footer Text" },
      ].map(({ key, label }) => (
        <FieldRow key={key}>
          <FieldLabel label={label} />
          <Input
            className="w-64"
            value={form[key] ?? ""}
            onChange={(e) => set(key, e.target.value)}
          />
        </FieldRow>
      ))}
      <div className="py-2.5">
        <p className="text-sm font-medium mb-1">Highlights</p>
        <p className="text-xs text-muted-foreground mb-2">
          One bullet point per line. Shown on the server info card.
        </p>
        <Textarea
          className="text-sm min-h-35"
          value={highlightsText}
          onChange={(e) => setHighlightsText(e.target.value)}
          placeholder={
            "Official Ran GS Server - 2015\nOptimized Render (GPU Based)"
          }
        />
      </div>
      <SaveBar onSave={handleSave} saving={saving} />
    </div>
  );
}

/* ─────────────────────────────
   Section: Core Options
───────────────────────────── */

function CoreOptionsTab({
  data,
  onSave,
}: {
  data: any;
  onSave: (v: any) => Promise<void>;
}) {
  const [form, setForm] = useState({ ...data });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({ ...data });
  }, [data]);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(form);
      toast.success("Core options saved.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <FieldRow>
        <FieldLabel
          label="Maintenance Mode"
          desc="Blocks all non-staff access"
        />
        <Switch
          checked={!!form.maintenanceMode}
          onCheckedChange={(v) =>
            setForm((p: any) => ({ ...p, maintenanceMode: v }))
          }
        />
      </FieldRow>
      <FieldRow>
        <FieldLabel
          label="Enable Action Logs"
          desc="Logs user actions to the ActionLog table"
        />
        <Switch
          checked={!!form.enableLogs}
          onCheckedChange={(v) =>
            setForm((p: any) => ({ ...p, enableLogs: v }))
          }
        />
      </FieldRow>
      <FieldRow>
        <FieldLabel
          label="MD5 Passwords"
          desc="Legacy MD5 password encoding (disable only if migrated)"
        />
        <Switch
          checked={!!form.ismd5}
          onCheckedChange={(v) => setForm((p: any) => ({ ...p, ismd5: v }))}
        />
      </FieldRow>
      <FieldRow>
        <FieldLabel
          label="Default Language"
          desc="Site-wide default language for all users"
        />
        <Select
          value={form.defaultLanguage ?? "en"}
          onValueChange={(v) =>
            setForm((p: any) => ({ ...p, defaultLanguage: v }))
          }
        >
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="th">Thai</SelectItem>
          </SelectContent>
        </Select>
      </FieldRow>
      <SaveBar onSave={handleSave} saving={saving} />
    </div>
  );
}

/* ─────────────────────────────
   Section: Features
───────────────────────────── */

const FEATURE_META: { key: string; label: string; desc?: string }[] = [
  { key: "changePassword", label: "Change Password" },
  { key: "changePin", label: "Change PIN" },
  { key: "changeEmail", label: "Change Email" },
  { key: "topup", label: "Top-Up" },
  { key: "webMarket", label: "Web Market" },
  { key: "characterDelete", label: "Character Delete" },
  { key: "ticketSystem", label: "Ticket System" },
];

function FeaturesTab({
  data,
  onSave,
}: {
  data: any;
  onSave: (v: any) => Promise<void>;
}) {
  const [form, setForm] = useState({ ...data });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({ ...data });
  }, [data]);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(form);
      toast.success("Features saved.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {FEATURE_META.map(({ key, label, desc }) => (
        <FieldRow key={key}>
          <FieldLabel label={label} desc={desc} />
          <Switch
            checked={!!form[key]}
            onCheckedChange={(v) => setForm((p: any) => ({ ...p, [key]: v }))}
          />
        </FieldRow>
      ))}
      <SaveBar onSave={handleSave} saving={saving} />
    </div>
  );
}

/* ─────────────────────────────
   Section: Character System (generic: changeSchool / changeClass / resetStats)
───────────────────────────── */

function CharacterSystemTab({
  label,
  data,
  onSave,
}: {
  label: string;
  data: any;
  onSave: (v: any) => Promise<void>;
}) {
  const [form, setForm] = useState({ ...data });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({ ...data });
  }, [data]);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(form);
      toast.success(`${label} saved.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <FieldRow>
        <FieldLabel label="Enabled" />
        <Switch
          checked={!!form.enabled}
          onCheckedChange={(v) => setForm((p: any) => ({ ...p, enabled: v }))}
        />
      </FieldRow>
      <FieldRow>
        <FieldLabel label="Fee" />
        <Input
          type="number"
          className="w-28"
          value={form.fee ?? 0}
          onChange={(e) =>
            setForm((p: any) => ({ ...p, fee: Number(e.target.value) }))
          }
        />
      </FieldRow>
      <FieldRow>
        <FieldLabel label="Currency" />
        <Select
          value={form.currency ?? "ep"}
          onValueChange={(v) => setForm((p: any) => ({ ...p, currency: v }))}
        >
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ep">EP</SelectItem>
            <SelectItem value="vp">VP</SelectItem>
            <SelectItem value="gold">Gold</SelectItem>
          </SelectContent>
        </Select>
      </FieldRow>
      <SaveBar onSave={handleSave} saving={saving} />
    </div>
  );
}

/* ─────────────────────────────
   Section: Reborn
───────────────────────────── */

function RebornTab({
  data,
  onSave,
}: {
  data: any;
  onSave: (v: any) => Promise<void>;
}) {
  const [form, setForm] = useState<any>({ ...data, tiers: data.tiers ?? [] });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({ ...data, tiers: data.tiers ?? [] });
  }, [data]);

  function setTier(idx: number, field: string, value: number) {
    setForm((p: any) => {
      const tiers = [...p.tiers];
      tiers[idx] = { ...tiers[idx], [field]: value };
      return { ...p, tiers };
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(form);
      toast.success("Reborn saved.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <FieldRow>
        <FieldLabel label="Enabled" />
        <Switch
          checked={!!form.enabled}
          onCheckedChange={(v) => setForm((p: any) => ({ ...p, enabled: v }))}
        />
      </FieldRow>
      <FieldRow>
        <FieldLabel label="Currency" />
        <Select
          value={form.currency ?? "gold"}
          onValueChange={(v) => setForm((p: any) => ({ ...p, currency: v }))}
        >
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ep">EP</SelectItem>
            <SelectItem value="vp">VP</SelectItem>
            <SelectItem value="gold">Gold</SelectItem>
          </SelectContent>
        </Select>
      </FieldRow>
      <FieldRow>
        <FieldLabel label="Max Reborn" />
        <Input
          type="number"
          className="w-28"
          value={form.maxReborn ?? 50}
          onChange={(e) =>
            setForm((p: any) => ({ ...p, maxReborn: Number(e.target.value) }))
          }
        />
      </FieldRow>

      {/* Tier table */}
      <div className="mt-4">
        <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">
          Tiers
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs text-muted-foreground">
                <th className="text-left pb-2">Tier</th>
                <th className="text-left pb-2">Range</th>
                <th className="text-left pb-2">Lvl Req</th>
                <th className="text-left pb-2">Fee</th>
                <th className="text-left pb-2">Stat Reward</th>
              </tr>
            </thead>
            <tbody>
              {form.tiers.map((tier: any, idx: number) => (
                <tr key={idx} className="border-b last:border-0">
                  <td className="py-2 pr-2 text-muted-foreground">
                    #{idx + 1}
                  </td>
                  <td className="py-2 pr-2 text-muted-foreground">
                    {tier.from}–{tier.to}
                  </td>
                  <td className="py-2 pr-2">
                    <Input
                      type="number"
                      className="w-20 h-7 text-xs"
                      value={tier.levelReq}
                      onChange={(e) =>
                        setTier(idx, "levelReq", Number(e.target.value))
                      }
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <Input
                      type="number"
                      className="w-20 h-7 text-xs"
                      value={tier.fee}
                      onChange={(e) =>
                        setTier(idx, "fee", Number(e.target.value))
                      }
                    />
                  </td>
                  <td className="py-2">
                    <Input
                      type="number"
                      className="w-20 h-7 text-xs"
                      value={tier.statReward}
                      onChange={(e) =>
                        setTier(idx, "statReward", Number(e.target.value))
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <SaveBar onSave={handleSave} saving={saving} />
    </div>
  );
}

/* ─────────────────────────────
   Section: Shop
───────────────────────────── */

function ShopTab({
  data,
  onSave,
}: {
  data: any;
  onSave: (v: any) => Promise<void>;
}) {
  const [form, setForm] = useState({ ...data });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({ ...data });
  }, [data]);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(form);
      toast.success("Shop config saved.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {[
        { key: "enabled", label: "Shop Enabled" },
        { key: "voteShop", label: "Vote Shop" },
        { key: "premiumShop", label: "Premium Shop" },
      ].map(({ key, label }) => (
        <FieldRow key={key}>
          <FieldLabel label={label} />
          <Switch
            checked={!!form[key]}
            onCheckedChange={(v) => setForm((p: any) => ({ ...p, [key]: v }))}
          />
        </FieldRow>
      ))}
      <SaveBar onSave={handleSave} saving={saving} />
    </div>
  );
}

/* ─────────────────────────────
   Section: Classes
───────────────────────────── */

const CLASS_LIST = [
  "brawler",
  "swordsman",
  "archer",
  "shaman",
  "extreme",
  "gunner",
  "assassin",
  "magician",
];

function ClassesTab({
  data,
  onSave,
}: {
  data: any;
  onSave: (v: any) => Promise<void>;
}) {
  const [form, setForm] = useState({ ...data });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({ ...data });
  }, [data]);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(form);
      toast.success("Classes saved.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {CLASS_LIST.map((cls) => (
        <FieldRow key={cls}>
          <FieldLabel label={cls.charAt(0).toUpperCase() + cls.slice(1)} />
          <Switch
            checked={!!form[cls]}
            onCheckedChange={(v) => setForm((p: any) => ({ ...p, [cls]: v }))}
          />
        </FieldRow>
      ))}
      <SaveBar onSave={handleSave} saving={saving} />
    </div>
  );
}

/* ─────────────────────────────
   Section: Social
───────────────────────────── */

function SocialTab({
  data,
  onSave,
}: {
  data: any;
  onSave: (v: any) => Promise<void>;
}) {
  const [form, setForm] = useState({ ...data });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({ ...data });
  }, [data]);

  const set = (k: string, v: string | boolean) =>
    setForm((p: any) => ({ ...p, [k]: v }));

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(form);
      toast.success("Social links saved.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <FieldRow>
        <FieldLabel label="Social Links Enabled" />
        <Switch
          checked={!!form.enabled}
          onCheckedChange={(v) => set("enabled", v)}
        />
      </FieldRow>
      {[
        { key: "facebook", label: "Facebook" },
        { key: "x", label: "X (Twitter)" },
        { key: "youtube", label: "YouTube" },
        { key: "twitch", label: "Twitch" },
        { key: "steam", label: "Steam" },
      ].map(({ key, label }) => (
        <FieldRow key={key}>
          <FieldLabel label={label} />
          <Input
            className="w-64"
            placeholder="https://…"
            value={form[key] ?? ""}
            onChange={(e) => set(key, e.target.value)}
          />
        </FieldRow>
      ))}
      <SaveBar onSave={handleSave} saving={saving} />
    </div>
  );
}

/* ─────────────────────────────
   Section: UI Limits
───────────────────────────── */

function UiHelperTab({
  data,
  onSave,
}: {
  data: any;
  onSave: (v: any) => Promise<void>;
}) {
  const [form, setForm] = useState({ ...data });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({ ...data });
  }, [data]);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(form);
      toast.success("UI limits saved.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {[
        { key: "max_topnews", label: "Max Top News" },
        { key: "max_toprank", label: "Max Top Rank" },
        { key: "max_rankall", label: "Max Rank All" },
      ].map(({ key, label }) => (
        <FieldRow key={key}>
          <FieldLabel label={label} />
          <Input
            type="number"
            className="w-28"
            value={form[key] ?? 0}
            onChange={(e) =>
              setForm((p: any) => ({ ...p, [key]: Number(e.target.value) }))
            }
          />
        </FieldRow>
      ))}
      <SaveBar onSave={handleSave} saving={saving} />
    </div>
  );
}

/* ─────────────────────────────
   Section: Convert Feature
───────────────────────────── */

function ConvertTab({
  data,
  onSave,
}: {
  data: any;
  onSave: (v: any) => Promise<void>;
}) {
  const [form, setForm] = useState<any>({
    vp2ep: { ...data.vp2ep },
    ep2vp: { ...data.ep2vp },
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({ vp2ep: { ...data.vp2ep }, ep2vp: { ...data.ep2vp } });
  }, [data]);

  function setField(dir: "vp2ep" | "ep2vp", k: string, v: boolean | number) {
    setForm((p: any) => ({ ...p, [dir]: { ...p[dir], [k]: v } }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(form);
      toast.success("Convert settings saved.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {(["vp2ep", "ep2vp"] as const).map((dir) => (
        <div key={dir} className="mb-4">
          <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">
            {dir === "vp2ep" ? "VP → EP" : "EP → VP"}
          </p>
          <FieldRow>
            <FieldLabel label="Enabled" />
            <Switch
              checked={!!form[dir].enabled}
              onCheckedChange={(v) => setField(dir, "enabled", v)}
            />
          </FieldRow>
          <FieldRow>
            <FieldLabel label="Minimum Amount" />
            <Input
              type="number"
              className="w-28"
              value={form[dir].min ?? 0}
              onChange={(e) => setField(dir, "min", Number(e.target.value))}
            />
          </FieldRow>
          <FieldRow>
            <FieldLabel label="Rate" />
            <Input
              type="number"
              className="w-28"
              value={form[dir].rate ?? 1}
              onChange={(e) => setField(dir, "rate", Number(e.target.value))}
            />
          </FieldRow>
        </div>
      ))}
      <SaveBar onSave={handleSave} saving={saving} />
    </div>
  );
}

/* ─────────────────────────────
   Section: Voting System
───────────────────────────── */

function VotingTab({
  data,
  onSave,
}: {
  data: any;
  onSave: (v: any) => Promise<void>;
}) {
  const [form, setForm] = useState({ ...data });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({ ...data });
  }, [data]);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(form);
      toast.success("Voting system saved.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <FieldRow>
        <FieldLabel label="Enabled" />
        <Switch
          checked={!!form.enabled}
          onCheckedChange={(v) => setForm((p: any) => ({ ...p, enabled: v }))}
        />
      </FieldRow>
      <FieldRow>
        <FieldLabel label="Level Requirement" />
        <Input
          type="number"
          className="w-28"
          value={form.levelRequirement ?? 200}
          onChange={(e) =>
            setForm((p: any) => ({
              ...p,
              levelRequirement: Number(e.target.value),
            }))
          }
        />
      </FieldRow>
      <FieldRow>
        <FieldLabel label="Vote Interval (hours)" />
        <Input
          type="number"
          className="w-28"
          value={form.voteIntervalHours ?? 12}
          onChange={(e) =>
            setForm((p: any) => ({
              ...p,
              voteIntervalHours: Number(e.target.value),
            }))
          }
        />
      </FieldRow>
      <FieldRow>
        <FieldLabel label="Reward" />
        <Input
          type="number"
          className="w-28"
          value={form.reward ?? 2}
          onChange={(e) =>
            setForm((p: any) => ({ ...p, reward: Number(e.target.value) }))
          }
        />
      </FieldRow>
      <SaveBar onSave={handleSave} saving={saving} />
    </div>
  );
}

/* ─────────────────────────────
   Section: System Requirements
───────────────────────────── */

interface SysReqRow {
  component: string;
  min: string;
  rec: string;
}

function SystemRequirementsTab({
  data,
  onSave,
}: {
  data: any;
  onSave: (v: any) => Promise<void>;
}) {
  const [rows, setRows] = useState<SysReqRow[]>(data.rows ?? []);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setRows(data.rows ?? []);
  }, [data]);

  function updateRow(idx: number, field: keyof SysReqRow, value: string) {
    setRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)),
    );
  }

  function addRow() {
    setRows((prev) => [...prev, { component: "", min: "", rec: "" }]);
  }

  function removeRow(idx: number) {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({ rows });
      toast.success("System requirements saved.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="space-y-2">
        {rows.map((row, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <Input
              className="w-36 shrink-0 text-xs h-8"
              placeholder="Component"
              value={row.component}
              onChange={(e) => updateRow(idx, "component", e.target.value)}
            />
            <Input
              className="flex-1 min-w-0 text-xs h-8"
              placeholder="Minimum"
              value={row.min}
              onChange={(e) => updateRow(idx, "min", e.target.value)}
            />
            <Input
              className="flex-1 min-w-0 text-xs h-8"
              placeholder="Recommended (leave blank to span both columns)"
              value={row.rec}
              onChange={(e) => updateRow(idx, "rec", e.target.value)}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => removeRow(idx)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
        {rows.length === 0 && (
          <p className="text-xs text-muted-foreground py-1">
            No rows. Add one below.
          </p>
        )}
      </div>
      <Button
        variant="outline"
        size="sm"
        className="mt-2 h-7 text-xs gap-1.5"
        onClick={addRow}
      >
        <Plus className="h-3.5 w-3.5" />
        Add Row
      </Button>
      <SaveBar onSave={handleSave} saving={saving} />
    </div>
  );
}

/* ─────────────────────────────
   Section: Slider Config
───────────────────────────── */

interface Slide {
  src: string;
  caption: string;
  enabled: boolean;
  link: string;
}

function SlideList({
  label,
  slides,
  onChange,
}: {
  label: string;
  slides: Slide[];
  onChange: (slides: Slide[]) => void;
}) {
  const [uploading, setUploading] = useState<number | null>(null);

  function updateSlide(
    idx: number,
    field: keyof Slide,
    value: string | boolean,
  ) {
    const next = slides.map((s, i) =>
      i === idx ? { ...s, [field]: value } : s,
    );
    onChange(next);
  }

  function addSlide() {
    onChange([...slides, { src: "", caption: "", enabled: true, link: "" }]);
  }

  function removeSlide(idx: number) {
    onChange(slides.filter((_, i) => i !== idx));
  }

  async function handleFileChange(
    idx: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploading(idx);
    try {
      const url = await uploadSliderImage(file);
      updateSlide(idx, "src", url);
      toast.success("Image uploaded.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(null);
    }
  }

  return (
    <div className="mb-6 last:mb-0">
      <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">
        {label}
      </p>
      <div className="space-y-2">
        {slides.map((slide, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2 p-2 rounded-lg border border-border bg-muted/20"
          >
            <Switch
              checked={slide.enabled}
              onCheckedChange={(v) => updateSlide(idx, "enabled", v)}
              className="shrink-0"
            />
            {/* Thumbnail preview */}
            <div className="shrink-0 w-14 h-9 rounded border border-border bg-muted overflow-hidden flex items-center justify-center">
              {slide.src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={slide.src}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-[10px] text-muted-foreground">
                  No img
                </span>
              )}
            </div>
            <Input
              className="flex-1 min-w-0 text-xs h-8"
              placeholder="Image URL or /images/slider/slide.jpg"
              value={slide.src}
              onChange={(e) => updateSlide(idx, "src", e.target.value)}
            />
            <Input
              className="w-36 shrink-0 text-xs h-8"
              placeholder="Caption"
              value={slide.caption}
              onChange={(e) => updateSlide(idx, "caption", e.target.value)}
            />
            <Input
              className="w-40 shrink-0 text-xs h-8"
              placeholder="Link URL (optional)"
              value={slide.link ?? ""}
              onChange={(e) => updateSlide(idx, "link", e.target.value)}
            />
            {/* Upload button */}
            <label className="shrink-0">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                disabled={uploading !== null}
                onChange={(e) => handleFileChange(idx, e)}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 pointer-events-none"
                disabled={uploading !== null}
                aria-label="Upload image"
                asChild
              >
                <span>
                  {uploading === idx ? (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <Upload className="h-3.5 w-3.5" />
                  )}
                </span>
              </Button>
            </label>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => removeSlide(idx)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
        {slides.length === 0 && (
          <p className="text-xs text-muted-foreground py-1">
            No slides. Add one below.
          </p>
        )}
      </div>
      <Button
        variant="outline"
        size="sm"
        className="mt-2 h-7 text-xs gap-1.5"
        onClick={addSlide}
      >
        <Plus className="h-3.5 w-3.5" />
        Add Slide
      </Button>
    </div>
  );
}

function SlidesTab({
  data,
  onSave,
}: {
  data: any;
  onSave: (v: any) => Promise<void>;
}) {
  const [bannerSlides, setBannerSlides] = useState<Slide[]>(
    data.bannerSlides ?? [],
  );
  const [contentSlides, setContentSlides] = useState<Slide[]>(
    data.contentSlides ?? [],
  );
  const [saving, setSaving] = useState(false);
  const { refresh } = usePublicConfig();

  useEffect(() => {
    setBannerSlides(data.bannerSlides ?? []);
    setContentSlides(data.contentSlides ?? []);
  }, [data]);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({ bannerSlides, contentSlides });
      await refresh();
      toast.success("Sliders saved.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <SlideList
        label="Banner Slides (top hero)"
        slides={bannerSlides}
        onChange={setBannerSlides}
      />
      <SlideList
        label="Content Slides (middle section)"
        slides={contentSlides}
        onChange={setContentSlides}
      />
      <SaveBar onSave={handleSave} saving={saving} />
    </div>
  );
}

/* ─────────────────────────────
   Section: Locales Editor
───────────────────────────── */

const BUILTIN_LOCALES: Record<string, any> = { en: enDefault, th: thDefault };
const BUILTIN_DISPLAY_NAMES: Record<string, string> = {
  en: "English",
  th: "ภาษาไทย",
};

interface LocaleMeta {
  enabled: boolean;
  displayName: string;
}

function flattenLocale(
  obj: any,
  prefix = "",
): Array<{ key: string; value: string }> {
  const pairs: Array<{ key: string; value: string }> = [];
  for (const [k, v] of Object.entries(obj ?? {})) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      pairs.push(...flattenLocale(v, fullKey));
    } else {
      pairs.push({ key: fullKey, value: String(v ?? "") });
    }
  }
  return pairs;
}

function setNestedValue(obj: any, dotKey: string, value: string): any {
  const parts = dotKey.split(".");
  const result = { ...obj };
  let cur: any = result;
  for (let i = 0; i < parts.length - 1; i++) {
    cur[parts[i]] = { ...(cur[parts[i]] ?? {}) };
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
  return result;
}

/** Seed built-in locales into raw DB data so the admin always sees en/th */
function seedBuiltins(
  rawLocales: Record<string, any>,
  rawMeta: Record<string, LocaleMeta>,
) {
  const locales = { ...rawLocales };
  const meta = { ...rawMeta };
  for (const [code, translations] of Object.entries(BUILTIN_LOCALES)) {
    if (!locales[code]) locales[code] = translations;
    if (!meta[code])
      meta[code] = {
        enabled: true,
        displayName: BUILTIN_DISPLAY_NAMES[code] ?? code.toUpperCase(),
      };
  }
  return { locales, meta };
}

function LocalesEditorTab({
  data,
  onSave,
}: {
  data: any;
  onSave: (v: any) => Promise<void>;
}) {
  // Separate locale strings from _meta, seeding built-ins if absent
  const [locales, setLocales] = useState<Record<string, any>>(() => {
    const { _meta, ...rest } = data ?? {};
    return seedBuiltins(rest, _meta ?? {}).locales;
  });
  const [localeMeta, setLocaleMeta] = useState<Record<string, LocaleMeta>>(
    () => {
      const { _meta, ...rest } = data ?? {};
      return seedBuiltins(rest, _meta ?? {}).meta;
    },
  );
  const [activeLang, setActiveLang] = useState<string>("en");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [newLangCode, setNewLangCode] = useState("");
  const [showAddLang, setShowAddLang] = useState(false);
  const { refresh } = usePublicConfig();

  useEffect(() => {
    const { _meta, ...rest } = data ?? {};
    const seeded = seedBuiltins(rest, _meta ?? {});
    setLocales(seeded.locales);
    setLocaleMeta(seeded.meta);
  }, [data]);

  const langs = Object.keys(locales);
  const currentLocale = locales[activeLang] ?? {};
  const activeMeta = localeMeta[activeLang];

  const allPairs = flattenLocale(currentLocale);
  const filtered = search
    ? allPairs.filter(
        (p) =>
          p.key.toLowerCase().includes(search.toLowerCase()) ||
          p.value.toLowerCase().includes(search.toLowerCase()),
      )
    : allPairs;

  const grouped = filtered.reduce<
    Record<string, Array<{ key: string; value: string }>>
  >((acc, pair) => {
    const section = pair.key.split(".")[0];
    if (!acc[section]) acc[section] = [];
    acc[section].push(pair);
    return acc;
  }, {});

  function updatePair(key: string, value: string) {
    setLocales((prev) => ({
      ...prev,
      [activeLang]: setNestedValue(currentLocale, key, value),
    }));
  }

  function setMeta(lang: string, patch: Partial<LocaleMeta>) {
    setLocaleMeta((prev) => ({
      ...prev,
      [lang]: {
        ...{ enabled: true, displayName: lang.toUpperCase() },
        ...prev[lang],
        ...patch,
      },
    }));
  }

  function importFromBuiltin(lang: string) {
    const locale = BUILTIN_LOCALES[lang];
    if (locale) {
      setLocales((prev) => ({ ...prev, [lang]: locale }));
      if (!localeMeta[lang]) {
        setMeta(lang, {
          enabled: true,
          displayName: BUILTIN_DISPLAY_NAMES[lang] ?? lang.toUpperCase(),
        });
      }
      toast.success(`Imported built-in ${lang.toUpperCase()} locale.`);
    } else {
      toast.error(
        `No built-in locale for "${lang}". Start editing from scratch.`,
      );
    }
  }

  function addLanguage() {
    const code = newLangCode.trim().toLowerCase();
    if (!code) return;
    if (locales[code]) {
      toast.error(`Language "${code}" already exists.`);
      return;
    }
    const seed =
      BUILTIN_LOCALES[code] ?? locales["en"] ?? Object.values(locales)[0] ?? {};
    setLocales((prev) => ({ ...prev, [code]: seed }));
    setMeta(code, {
      enabled: true,
      displayName: BUILTIN_DISPLAY_NAMES[code] ?? code.toUpperCase(),
    });
    setActiveLang(code);
    setShowAddLang(false);
    setNewLangCode("");
    toast.success(`Added language "${code.toUpperCase()}".`);
  }

  function removeLanguage(lang: string) {
    if (lang === "en") {
      toast.error("Cannot remove the English locale.");
      return;
    }
    setLocales((prev) => {
      const next = { ...prev };
      delete next[lang];
      return next;
    });
    setLocaleMeta((prev) => {
      const next = { ...prev };
      delete next[lang];
      return next;
    });
    if (activeLang === lang) setActiveLang("en");
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({ _meta: localeMeta, ...locales });
      await refresh();
      toast.success("Locales saved.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed.");
    } finally {
      setSaving(false);
    }
  }

  const hasCurrentLocale = !!locales[activeLang];

  return (
    <div className="space-y-4">
      {/* Language tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {langs.map((lang) => {
          const meta = localeMeta[lang];
          const isEnabled = meta?.enabled !== false;
          return (
            <div key={lang} className="flex items-center gap-0.5">
              <button
                onClick={() => setActiveLang(lang)}
                className={`px-3 py-1 rounded-l text-xs font-medium transition-colors ${
                  activeLang === lang
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80 text-foreground"
                } ${!isEnabled ? "opacity-50" : ""}`}
                title={
                  !isEnabled
                    ? `${lang.toUpperCase()} (disabled)`
                    : lang.toUpperCase()
                }
              >
                {lang.toUpperCase()}
                {!isEnabled && (
                  <span className="ml-1 text-[9px] opacity-70">OFF</span>
                )}
              </button>
              {lang !== "en" && (
                <button
                  onClick={() => removeLanguage(lang)}
                  className={`px-1.5 py-1 rounded-r text-xs transition-colors ${
                    activeLang === lang
                      ? "bg-primary/70 text-primary-foreground hover:bg-destructive"
                      : "bg-muted hover:bg-destructive hover:text-destructive-foreground text-muted-foreground"
                  }`}
                  title={`Remove ${lang.toUpperCase()}`}
                >
                  ✕
                </button>
              )}
              {lang === "en" && (
                <span className="px-1 py-1 rounded-r bg-muted text-xs text-transparent select-none">
                  ✕
                </span>
              )}
            </div>
          );
        })}

        {showAddLang ? (
          <div className="flex items-center gap-1">
            <Input
              className="h-7 text-xs w-20"
              placeholder="e.g. ph"
              value={newLangCode}
              onChange={(e) => setNewLangCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addLanguage();
                if (e.key === "Escape") {
                  setShowAddLang(false);
                  setNewLangCode("");
                }
              }}
              autoFocus
            />
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs px-2"
              onClick={addLanguage}
            >
              Add
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs px-2"
              onClick={() => {
                setShowAddLang(false);
                setNewLangCode("");
              }}
            >
              ✕
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1"
            onClick={() => setShowAddLang(true)}
          >
            <Plus className="h-3 w-3" /> Add Language
          </Button>
        )}
      </div>

      {/* Active language settings bar */}
      {langs.length > 0 && (
        <div className="flex items-center gap-4 p-2.5 rounded-lg bg-muted/40 border border-border text-xs">
          <div className="flex items-center gap-2 shrink-0">
            <Switch
              checked={activeMeta?.enabled !== false}
              onCheckedChange={(v) => setMeta(activeLang, { enabled: v })}
              disabled={activeLang === "en"}
            />
            <span className="text-muted-foreground">
              {activeLang === "en"
                ? "English is always enabled"
                : activeMeta?.enabled !== false
                  ? "Visible to users in language switcher"
                  : "Hidden from users (draft mode)"}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-muted-foreground shrink-0">
              Display name:
            </span>
            <Input
              className="h-6 text-xs flex-1 max-w-40"
              placeholder={activeLang.toUpperCase()}
              value={activeMeta?.displayName ?? ""}
              onChange={(e) =>
                setMeta(activeLang, { displayName: e.target.value })
              }
            />
            <span className="text-[10px] text-muted-foreground">
              shown in the language switcher
            </span>
          </div>
        </div>
      )}

      {/* Seed / search bar */}
      {!hasCurrentLocale ? (
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground flex-1">
            No locale data for <strong>{activeLang.toUpperCase()}</strong>.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => importFromBuiltin(activeLang)}
          >
            Import Built-in Defaults
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Input
            className="h-7 text-xs flex-1 max-w-sm"
            placeholder="Search keys or values…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs shrink-0"
            onClick={() => importFromBuiltin(activeLang)}
          >
            Re-import Defaults
          </Button>
          <span className="text-xs text-muted-foreground shrink-0">
            {filtered.length} strings
          </span>
        </div>
      )}

      {/* Key-value editor */}
      {hasCurrentLocale && (
        <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
          {Object.entries(grouped).map(([section, pairs]) => (
            <div key={section}>
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-1.5 sticky top-0 bg-card py-0.5 z-10">
                {section}
              </p>
              <div className="space-y-1">
                {pairs.map(({ key, value }) => {
                  const displayKey = key.slice(section.length + 1) || key;
                  return (
                    <div key={key} className="flex items-center gap-2">
                      <span
                        className="text-[11px] text-muted-foreground font-mono w-56 shrink-0 truncate"
                        title={key}
                      >
                        {displayKey}
                      </span>
                      <Input
                        className="flex-1 text-xs h-7"
                        value={value}
                        onChange={(e) => updatePair(key, e.target.value)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {Object.keys(grouped).length === 0 && (
            <p className="text-xs text-muted-foreground py-4 text-center">
              No matching keys.
            </p>
          )}
        </div>
      )}

      <SaveBar onSave={handleSave} saving={saving} />
    </div>
  );
}

/* ─────────────────────────────
   Main ConfigSection component
───────────────────────────── */

export function ConfigSection() {
  const [config, setConfig] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getServerConfig()
      .then(setConfig)
      .catch(() => toast.error("Failed to load server config."))
      .finally(() => setLoading(false));
  }, []);

  function makeSaver(section: string) {
    return async (value: any) => {
      await saveConfigSection(section, value);
      setConfig((prev) => (prev ? { ...prev, [section]: value } : prev));
    };
  }

  if (loading) {
    return (
      <div className="p-6 space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (!config) {
    return (
      <p className="p-6 text-sm text-muted-foreground">
        Failed to load config.
      </p>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Server Configuration</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Changes take effect immediately — no server restart required.
        </p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="character">Character</TabsTrigger>
          <TabsTrigger value="economy">Economy</TabsTrigger>
          <TabsTrigger value="display">Display</TabsTrigger>
          <TabsTrigger value="locales">Locales</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-0 grid grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Server Info</CardTitle>
            </CardHeader>
            <CardContent>
              <ServerInfoTab
                data={config.definitions ?? {}}
                onSave={makeSaver("definitions")}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Core Options</CardTitle>
            </CardHeader>
            <CardContent>
              <CoreOptionsTab
                data={config.coreOptions ?? {}}
                onSave={makeSaver("coreOptions")}
              />
            </CardContent>
          </Card>
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle className="text-sm">Features</CardTitle>
            </CardHeader>
            <CardContent>
              <FeaturesTab
                data={config.features ?? {}}
                onSave={makeSaver("features")}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="character" className="mt-0 grid grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Change School</CardTitle>
            </CardHeader>
            <CardContent>
              <CharacterSystemTab
                label="Change School"
                data={config.changeSchool ?? {}}
                onSave={makeSaver("changeSchool")}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Change Class</CardTitle>
            </CardHeader>
            <CardContent>
              <CharacterSystemTab
                label="Change Class"
                data={config.changeClass ?? {}}
                onSave={makeSaver("changeClass")}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Reset Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <CharacterSystemTab
                label="Reset Stats"
                data={config.resetStats ?? {}}
                onSave={makeSaver("resetStats")}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Reborn</CardTitle>
            </CardHeader>
            <CardContent>
              <RebornTab
                data={config.reborn ?? {}}
                onSave={makeSaver("reborn")}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="economy" className="mt-0 grid grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Shop</CardTitle>
            </CardHeader>
            <CardContent>
              <ShopTab data={config.shop ?? {}} onSave={makeSaver("shop")} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Voting System</CardTitle>
            </CardHeader>
            <CardContent>
              <VotingTab
                data={config.votingSystem ?? {}}
                onSave={makeSaver("votingSystem")}
              />
            </CardContent>
          </Card>
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle className="text-sm">Currency Convert</CardTitle>
            </CardHeader>
            <CardContent>
              <ConvertTab
                data={config.convertfeature ?? {}}
                onSave={makeSaver("convertfeature")}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locales" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Locale Strings Editor</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Edit UI text for each language. Changes take effect immediately
                after saving — no rebuild required. Use "Import Built-in
                Defaults" to seed from the static locale files.
              </p>
            </CardHeader>
            <CardContent>
              <LocalesEditorTab
                data={config.locales ?? {}}
                onSave={makeSaver("locales")}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="display" className="mt-0 grid grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Classes</CardTitle>
            </CardHeader>
            <CardContent>
              <ClassesTab
                data={config.classes ?? {}}
                onSave={makeSaver("classes")}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">UI Limits</CardTitle>
            </CardHeader>
            <CardContent>
              <UiHelperTab
                data={config.uihelper ?? {}}
                onSave={makeSaver("uihelper")}
              />
            </CardContent>
          </Card>
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle className="text-sm">Social Links</CardTitle>
            </CardHeader>
            <CardContent>
              <SocialTab
                data={config.social ?? {}}
                onSave={makeSaver("social")}
              />
            </CardContent>
          </Card>
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle className="text-sm">Sliders</CardTitle>
            </CardHeader>
            <CardContent>
              <SlidesTab
                data={config.sliderConfig ?? {}}
                onSave={makeSaver("sliderConfig")}
              />
            </CardContent>
          </Card>
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle className="text-sm">System Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <SystemRequirementsTab
                data={config.systemRequirements ?? {}}
                onSave={makeSaver("systemRequirements")}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
