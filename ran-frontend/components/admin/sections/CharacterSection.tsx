"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  searchCharacters,
  getCharacterDetail,
  updateCharacter,
  getCharacterSkills,
  getCharacterPutonItems,
  type CharacterSearchRow,
  type CharacterDetail,
  type CharacterItem,
  type CharacterSkills,
} from "@/lib/data/admin.character.data";
import { classMap } from "@/lib/data/character.data";
import { usePublicConfig } from "@/context/PublicConfigContext";

/* ─────────────────────────────
   Constants
───────────────────────────── */

// Reverse map: bitmask value → class group key (e.g. 1 → "brawler", 64 → "brawler")
const CLASS_TO_GROUP: Record<number, string> = Object.fromEntries(
  Object.entries(classMap).flatMap(([group, values]) => values.map((v) => [v, group]))
);

export const CLASS_NAMES: Record<number, string> = {
  1: "Brawler Male",
  2: "Swordsman Male",
  4: "Archer Female",
  8: "Shaman Female",
  16: "Extreme Male",
  32: "Extreme Female",
  64: "Brawler Female",
  128: "Swordsman Female",
  256: "Archer Male",
  512: "Shaman Male",
  1024: "Gunner Male",
  2048: "Gunner Female",
  4096: "Assassin Male",
  8192: "Assassin Female",
  16384: "Magician Male",
  32768: "Magician Female",
  65536: "Etc Male",
  131072: "Etc Female",
  262144: "Shaper Male",
  524288: "Shaper Female",
};
export const SCHOOL_NAMES: Record<number, string> = {
  0: "Sacred Gate",
  1: "Mystic Peak",
  2: "Phoenix",
};
export const EQUIP_SLOT_NAMES: Record<number, string> = {
  0: "Head",
  1: "Upper",
  2: "Lower",
  3: "Hand",
  4: "Foot",
  5: "R-Hand",
  6: "L-Hand",
  7: "Necklace",
  8: "Bracelet",
  9: "R-Finger",
  10: "L-Finger",
  11: "R-Hand_S",
  12: "L-Hand_S",
  13: "Vehicle",
  14: "Belt",
  15: "Decoration",
  16: "Earring",
  17: "R-Accessory",
  18: "L-Accessory",
  19: "Rune",
  20: "Artifact",
  21: "Jewel",
  22: "HoldSlot",
  23: "OutFit Head",
  24: "OutFit Upper",
  25: "OutFit Lower",
  26: "OutFit Hand",
  27: "OutFit Foot",
  28: "OutFit R-Hand",
  29: "OutFit L-Hand",
  30: "OutFit Necklace",
  31: "OutFit Bracelet",
  32: "OutFit R-Finger",
  33: "OutFit L-Finger",
  34: "OutFit R-Hand_S",
  35: "OutFit L-Hand_S",
  36: "OutFit Vehicle",
  37: "OutFit Belt",
  38: "OutFit Decoration",
  39: "OutFit Earring",
  40: "OutFit R-Accessory",
  41: "OutFit L-Accessory",
  42: "OutFit Rune",
  43: "OutFit Artifact",
  44: "OutFit Jewel",
};

/* ─────────────────────────────
   Equipment Item Row
───────────────────────────── */

function ItemRow({
  item,
  showSlot = false,
}: {
  item: CharacterItem;
  showSlot?: boolean;
}) {
  const id = `${item.nativeId?.mainId ?? "?"}-${item.nativeId?.subId ?? "?"}`;
  return (
    <tr className="border-b border-border/50 last:border-0 hover:bg-muted/30 text-sm">
      {showSlot && (
        <td className="px-3 py-1.5 text-xs text-muted-foreground">
          {EQUIP_SLOT_NAMES[item.slot] ?? `Slot ${item.slot}`}
        </td>
      )}
      <td className="px-3 py-1.5 font-medium">
        {item.itemName ?? (
          <span className="text-muted-foreground italic">Unknown</span>
        )}
      </td>
      <td className="px-3 py-1.5 font-mono text-xs text-muted-foreground">
        {id}
      </td>
      <td className="px-3 py-1.5 text-right text-xs text-muted-foreground">
        {item.remain > 0 ? item.remain : "∞"}
      </td>
      <td className="px-3 py-1.5 text-right text-xs text-muted-foreground">
        {item.durability}
      </td>
    </tr>
  );
}

/* ─────────────────────────────
   Tabs: Edit / Skills / Equipment / Inventory
───────────────────────────── */

type DetailTab = "edit" | "skills" | "equipment" | "inventory";

export function CharacterDetailDialog({
  chaNum,
  onClose,
}: {
  chaNum: number | null;
  onClose: () => void;
}) {
  const { config } = usePublicConfig();
  const enabledClasses = config?.gameoptions?.classes ?? {};
  const filteredClassEntries = Object.entries(CLASS_NAMES).filter(([num]) => {
    const group = CLASS_TO_GROUP[Number(num)];
    return !group || enabledClasses[group as keyof typeof enabledClasses] !== false;
  });

  const [detail, setDetail] = useState<CharacterDetail | null>(null);
  const [skills, setSkills] = useState<CharacterSkills | null>(null);
  const [equipment, setEquipment] = useState<CharacterItem[]>([]);

  const [loadingBase, setLoadingBase] = useState(false);
  const [loadingTab, setLoadingTab] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<DetailTab>("edit");

  const [editFields, setEditFields] = useState({
    level: "",
    money: "",
    hp: "",
    mp: "",
    sp: "",
    cp: "",
    skillPoint: "",
    statsRemain: "",
    pow: "",
    dex: "",
    sta: "",
    spi: "",
    str: "",
    intel: "",
    class: "",
    school: "",
    hair: "",
    face: "",
    hairColor: "",
    living: "",
    isOnline: "",
    isDeleted: "",
  });

  const open = chaNum !== null;

  // Load base detail when dialog opens
  useEffect(() => {
    if (!open || !chaNum) return;
    setLoadingBase(true);
    setDetail(null);
    setSkills(null);
    setEquipment([]);
    setTab("edit");
    getCharacterDetail(chaNum)
      .then((d) => {
        setDetail(d);
        const b = d.base;
        setEditFields({
          level: String(b.ChaLevel),
          money: String(b.ChaMoney),
          hp: String(b.ChaHP),
          mp: String(b.ChaMP),
          sp: String(b.ChaSP),
          cp: String(b.ChaCP),
          skillPoint: String(b.ChaSkillPoint),
          statsRemain: String(b.ChaStRemain),
          pow: String(b.ChaPower),
          dex: String(b.ChaDex),
          sta: String(b.ChaStrength),
          spi: String(b.ChaSpirit),
          str: String(b.ChaStrong),
          intel: String(b.ChaIntel),
          class: String(b.ChaClass),
          school: String(b.ChaSchool),
          hair: String(b.ChaHair),
          face: String(b.ChaFace),
          hairColor: String(b.ChaHairColor),
          living: String(b.ChaLiving),
          isOnline: b.ChaOnline ? "1" : "0",
          isDeleted: b.ChaDeleted ? "1" : "0",
        });
      })
      .catch(() => toast.error("Failed to load character."))
      .finally(() => setLoadingBase(false));
  }, [open, chaNum]);

  // Load tab data on tab switch
  useEffect(() => {
    if (!chaNum || !open) return;
    if (tab === "skills" && !skills) {
      setLoadingTab(true);
      getCharacterSkills(chaNum)
        .then(setSkills)
        .catch(() => toast.error("Failed to load skills."))
        .finally(() => setLoadingTab(false));
    }
    if (tab === "equipment" && equipment.length === 0) {
      setLoadingTab(true);
      getCharacterPutonItems(chaNum)
        .then(setEquipment)
        .catch(() => toast.error("Failed to load equipment."))
        .finally(() => setLoadingTab(false));
    }
  }, [tab, chaNum, open]);

  async function handleSave() {
    if (!chaNum) return;
    setSaving(true);
    try {
      const num = (v: string) => (v !== "" ? Number(v) : undefined);
      await updateCharacter(chaNum, {
        level: num(editFields.level),
        money: num(editFields.money),
        hp: num(editFields.hp),
        mp: num(editFields.mp),
        sp: num(editFields.sp),
        cp: num(editFields.cp),
        skillPoint: num(editFields.skillPoint),
        statsRemain: num(editFields.statsRemain),
        pow: num(editFields.pow),
        dex: num(editFields.dex),
        sta: num(editFields.sta),
        spi: num(editFields.spi),
        str: num(editFields.str),
        intel: num(editFields.intel),
        class: num(editFields.class),
        school: num(editFields.school),
        hair: num(editFields.hair),
        face: num(editFields.face),
        hairColor: num(editFields.hairColor),
        living: num(editFields.living),
        isOnline: num(editFields.isOnline),
        isDeleted: num(editFields.isDeleted),
      });
      toast.success("Character updated.");
      handleClose();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update character.",
      );
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    setDetail(null);
    setSkills(null);
    setEquipment([]);
    onClose();
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setEditFields((f) => ({ ...f, [k]: e.target.value }));

  const setSelect = (k: string) => (v: string) =>
    setEditFields((f) => ({ ...f, [k]: v }));

  const TABS: { key: DetailTab; label: string }[] = [
    { key: "edit", label: "Edit Stats" },
    { key: "skills", label: "Skills" },
    { key: "equipment", label: "Equipment" },
    { key: "inventory", label: "Inventory" },
  ];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-3xl max-h-[88vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-border shrink-0">
          <DialogTitle>
            {detail
              ? `${detail.base.ChaName} — Lv.${detail.base.ChaLevel} ${CLASS_NAMES[detail.base.ChaClass] ?? "?"} (${SCHOOL_NAMES[detail.base.ChaSchool] ?? "?"})`
              : "Character Detail"}
          </DialogTitle>
          {detail && (
            <p className="text-xs text-muted-foreground">
              ChaNum: <span className="font-mono">{chaNum}</span> · UserNum:{" "}
              <span className="font-mono">{detail.base.UserNum}</span>
              {" · "}Reborn: {detail.base.ChaReborn} · Living:{" "}
              {detail.base.ChaLiving}
              {" · "}
              {detail.base.ChaDeleted ? (
                <span className="text-red-500">Deleted</span>
              ) : detail.base.ChaOnline ? (
                <span className="text-emerald-500">Online</span>
              ) : (
                "Offline"
              )}
            </p>
          )}
        </DialogHeader>

        {/* Tab bar */}
        <div className="flex gap-1 px-6 pt-3 pb-0 border-b border-border shrink-0">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 text-sm font-medium rounded-t-md transition-colors -mb-px border-b-2 ${
                tab === t.key
                  ? "border-primary text-foreground bg-background"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loadingBase ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : (
            <>
              {/* ── Edit Tab ── */}
              {tab === "edit" && detail && (
                <div className="space-y-5">
                  {/* Progression */}
                  <section>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Progression
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        ["Level", "level"],
                        ["Gold", "money"],
                        ["Skill Points", "skillPoint"],
                        ["Stat Points", "statsRemain"],
                      ].map(([l, k]) => (
                        <div key={k} className="space-y-1">
                          <Label className="text-xs">{l}</Label>
                          <Input
                            type="number"
                            value={editFields[k as keyof typeof editFields]}
                            onChange={set(k)}
                            className="h-8 text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Vitals */}
                  <section>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Vitals
                    </h3>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        ["HP", "hp"],
                        ["MP", "mp"],
                        ["SP", "sp"],
                        ["CP", "cp"],
                      ].map(([l, k]) => (
                        <div key={k} className="space-y-1">
                          <Label className="text-xs">{l}</Label>
                          <Input
                            type="number"
                            value={editFields[k as keyof typeof editFields]}
                            onChange={set(k)}
                            className="h-8 text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Base Stats */}
                  <section>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Base Stats
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        ["Power (Pow)", "pow"],
                        ["Dexterity (Dex)", "dex"],
                        ["Strength (Sta)", "sta"],
                        ["Spirit (Spi)", "spi"],
                        ["Strong (Str)", "str"],
                        ["Intelligence (Int)", "intel"],
                      ].map(([l, k]) => (
                        <div key={k} className="space-y-1">
                          <Label className="text-xs">{l}</Label>
                          <Input
                            type="number"
                            value={editFields[k as keyof typeof editFields]}
                            onChange={set(k)}
                            className="h-8 text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Appearance */}
                  <section>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Appearance & Info
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                      {/* Class dropdown */}
                      <div className="space-y-1">
                        <Label className="text-xs">Class</Label>
                        <Select
                          value={editFields.class}
                          onValueChange={setSelect("class")}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Select class" />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredClassEntries.map(([num, name]) => (
                              <SelectItem key={num} value={num}>
                                {name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {/* School dropdown */}
                      <div className="space-y-1">
                        <Label className="text-xs">School</Label>
                        <Select
                          value={editFields.school}
                          onValueChange={setSelect("school")}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Select school" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(SCHOOL_NAMES).map(([num, name]) => (
                              <SelectItem key={num} value={num}>
                                {name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {/* Other appearance fields */}
                      {[
                        ["Living", "living"],
                        ["Hair", "hair"],
                        ["Face", "face"],
                        ["Hair Color", "hairColor"],
                      ].map(([l, k]) => (
                        <div key={k} className="space-y-1">
                          <Label className="text-xs">{l}</Label>
                          <Input
                            type="number"
                            value={editFields[k as keyof typeof editFields]}
                            onChange={set(k)}
                            className="h-8 text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Flags */}
                  <section>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Flags
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        ["Online (0/1)", "isOnline"],
                        ["Deleted (0/1)", "isDeleted"],
                      ].map(([l, k]) => (
                        <div key={k} className="space-y-1">
                          <Label className="text-xs">{l}</Label>
                          <Input
                            type="number"
                            min={0}
                            max={1}
                            value={editFields[k as keyof typeof editFields]}
                            onChange={set(k)}
                            className="h-8 text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              )}

              {/* ── Skills Tab ── */}
              {tab === "skills" &&
                (loadingTab ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-8 w-full" />
                    ))}
                  </div>
                ) : skills ? (
                  <div>
                    <p className="text-xs text-muted-foreground mb-3">
                      Skill blob version: {skills.version} ·{" "}
                      {skills.skills.length} skill(s)
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                              #
                            </th>
                            <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                              Skill Name
                            </th>
                            <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                              Main ID
                            </th>
                            <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                              Sub ID
                            </th>
                            <th className="px-3 py-2 text-right font-medium text-muted-foreground">
                              Level
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {skills.skills.map((s, i) => (
                            <tr
                              key={i}
                              className="border-b border-border/50 last:border-0 hover:bg-muted/30"
                            >
                              <td className="px-3 py-1.5 text-muted-foreground text-xs">
                                {i + 1}
                              </td>
                              <td className="px-3 py-1.5 font-medium">
                                {s.skillName ?? (
                                  <span className="text-muted-foreground italic">
                                    Unknown
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-1.5 font-mono text-xs">
                                {s.mainId}
                              </td>
                              <td className="px-3 py-1.5 font-mono text-xs">
                                {s.subId}
                              </td>
                              <td className="px-3 py-1.5 text-right">
                                {s.level}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    No skill data available.
                  </p>
                ))}

              {/* ── Equipment Tab ── */}
              {tab === "equipment" &&
                (loadingTab ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-8 w-full" />
                    ))}
                  </div>
                ) : equipment.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                            Slot
                          </th>
                          <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                            Name
                          </th>
                          <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                            Item ID
                          </th>
                          <th className="px-3 py-2 text-right font-medium text-muted-foreground">
                            Remain
                          </th>
                          <th className="px-3 py-2 text-right font-medium text-muted-foreground">
                            Durability
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {equipment.map((item, i) => (
                          <ItemRow key={i} item={item} showSlot />
                        ))}
                      </tbody>
                    </table>
                    <p className="mt-2 text-xs text-muted-foreground text-right">
                      {equipment.length} equipped item(s)
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    No equipped items.
                  </p>
                ))}

              {/* ── Inventory Tab ── */}
              {tab === "inventory" && (
                <div>
                  {loadingBase ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-8 w-full" />
                      ))}
                    </div>
                  ) : (detail?.inventory ?? []).length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                              Name
                            </th>
                            <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                              Item ID
                            </th>
                            <th className="px-3 py-2 text-right font-medium text-muted-foreground">
                              Remain
                            </th>
                            <th className="px-3 py-2 text-right font-medium text-muted-foreground">
                              Durability
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {(detail?.inventory ?? []).map((item, i) => (
                            <ItemRow key={i} item={item} />
                          ))}
                        </tbody>
                      </table>
                      <p className="mt-2 text-xs text-muted-foreground text-right">
                        {(detail?.inventory ?? []).length} item(s)
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      Inventory is empty.
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer actions */}
        {tab === "edit" && (
          <div className="px-6 py-4 border-t border-border shrink-0 flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || loadingBase}>
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────────────────────
   Main Section
───────────────────────────── */

export function CharacterSection() {
  const [searchType, setSearchType] = useState<"name" | "chanum" | "usernum">(
    "name",
  );
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<CharacterSearchRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedChaNum, setSelectedChaNum] = useState<number | null>(null);

  async function loadCharacters(
    type: "name" | "chanum" | "usernum",
    q: string,
  ) {
    setLoading(true);
    try {
      setRows(await searchCharacters(type, q, 100));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Search failed.");
    } finally {
      setLoading(false);
    }
  }

  // Auto-load all characters on first mount
  useEffect(() => {
    loadCharacters("name", "");
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    loadCharacters(searchType, query);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Manage Characters</CardTitle>
          <CardDescription>
            Search characters — click a row to view/edit stats, skills,
            equipment, and inventory
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2 mb-4">
            <Select
              value={searchType}
              onValueChange={(v) =>
                setSearchType(v as "name" | "chanum" | "usernum")
              }
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="chanum">ChaNum</SelectItem>
                <SelectItem value="usernum">UserNum</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder={`Search by ${searchType}…`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={loading}>
              {loading ? "Searching…" : "Search"}
            </Button>
          </form>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No characters found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                      ChaNum
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                      Name
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                      Class
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                      School
                    </th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">
                      Level
                    </th>
                    <th className="px-3 py-2 text-center font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.ChaNum}
                      className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                        {row.ChaNum}
                      </td>
                      <td className="px-3 py-2 font-medium">{row.ChaName}</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {CLASS_NAMES[row.ChaClass] ?? row.ChaClass}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {SCHOOL_NAMES[row.ChaSchool] ?? row.ChaSchool}
                      </td>
                      <td className="px-3 py-2 text-right font-medium">
                        {row.ChaLevel}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {row.ChaDeleted ? (
                          <span className="text-xs text-red-500 font-medium">
                            Deleted
                          </span>
                        ) : row.ChaOnline ? (
                          <span className="text-emerald-500">●</span>
                        ) : (
                          <span className="text-muted-foreground/40">●</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedChaNum(row.ChaNum)}
                        >
                          View / Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-2 text-xs text-muted-foreground text-right">
                {rows.length} result(s)
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <CharacterDetailDialog
        chaNum={selectedChaNum}
        onClose={() => setSelectedChaNum(null)}
      />
    </div>
  );
}
