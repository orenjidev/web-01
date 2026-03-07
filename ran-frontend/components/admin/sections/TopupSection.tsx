"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  listTopups,
  generateTopups,
  markTopupUsed,
  type TopupCode,
  type TopupFilter,
} from "@/lib/data/admin.topup.data";
import { en } from "@/lib/i18n/locales/en";

const t = en.adminPanel.topup;

/* ─────────────────────────────
   CSV Export
───────────────────────────── */
function exportCSV(rows: TopupCode[]) {
  const header = "ECode,EPin,EValue,Status";
  const isUsed = (c: TopupCode) => Number(c.Used) === 1 || c.Used === true;
  const lines = rows.map((r) =>
    `${r.ECode},${r.EPin},${r.EValue},${isUsed(r) ? t.statusUsed : t.statusUnused}`,
  );
  const blob = new Blob([header + "\n" + lines.join("\n")], {
    type: "text/csv",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `topup-codes-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).then(() => toast.success(t.toastCopied));
}

/* ─────────────────────────────
   List Tab
───────────────────────────── */
function ListTab() {
  const [codes, setCodes] = useState<TopupCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<TopupFilter>("all");
  const [valueFilter, setValueFilter] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    setSelected(new Set());
    listTopups(filter)
      .then(setCodes)
      .catch(() => toast.error(t.toastLoadFail))
      .finally(() => setLoading(false));
  }, [filter]);

  const isUsed = (c: TopupCode) => Number(c.Used) === 1 || c.Used === true;

  const visible = valueFilter
    ? codes.filter((c) => c.EValue === Number(valueFilter))
    : codes;

  const allSelected = visible.length > 0 && visible.every((c) => selected.has(c.idx));

  function toggleSelectAll() {
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        visible.forEach((c) => next.delete(c.idx));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        visible.forEach((c) => next.add(c.idx));
        return next;
      });
    }
  }

  function toggleRow(idx: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  }

  async function handleMarkUsed(idx: number) {
    setActionLoading(idx);
    try {
      await markTopupUsed(idx);
      setCodes((prev) =>
        prev.map((c) => (c.idx === idx ? { ...c, Used: 1, UseDate: new Date().toISOString() } : c)),
      );
      toast.success(t.toastMarkUsed);
    } catch {
      toast.error(t.toastMarkUsedFail);
    } finally {
      setActionLoading(null);
    }
  }

  const exportRows = selected.size > 0
    ? visible.filter((c) => selected.has(c.idx))
    : visible;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-base">{t.listTitle}</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={filter}
              onValueChange={(v) => setFilter(v as TopupFilter)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.filterAll}</SelectItem>
                <SelectItem value="unused">{t.filterUnused}</SelectItem>
                <SelectItem value="used">{t.filterUsed}</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder={t.filterValue}
              value={valueFilter}
              onChange={(e) => { setValueFilter(e.target.value); setSelected(new Set()); }}
              className="w-40"
              min={1}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => exportCSV(exportRows)}
              disabled={exportRows.length === 0}
            >
              {selected.size > 0 ? `${t.exportSelected} (${selected.size})` : t.exportCsv}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.noItems}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-2 pr-3 w-6">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      title={t.selectAll}
                      className="cursor-pointer"
                    />
                  </th>
                  <th className="pb-2 pr-4 font-medium">{t.colCode}</th>
                  <th className="pb-2 pr-4 font-medium">{t.colPin}</th>
                  <th className="pb-2 pr-4 font-medium">{t.colValue}</th>
                  <th className="pb-2 pr-4 font-medium">{t.colStatus}</th>
                  <th className="pb-2 pr-4 font-medium">{t.colGenDate}</th>
                  <th className="pb-2 pr-4 font-medium">{t.colUseDate}</th>
                  <th className="pb-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {visible.map((c) => {
                  const used = isUsed(c);
                  return (
                    <tr
                      key={c.idx}
                      className={`border-b border-border/50 ${selected.has(c.idx) ? "bg-muted/30" : ""}`}
                    >
                      <td className="py-2 pr-3">
                        <input
                          type="checkbox"
                          checked={selected.has(c.idx)}
                          onChange={() => toggleRow(c.idx)}
                          className="cursor-pointer"
                        />
                      </td>
                      <td className="py-2 pr-4 font-mono">{c.ECode}</td>
                      <td className="py-2 pr-4 font-mono">{c.EPin}</td>
                      <td className="py-2 pr-4">
                        <span className="flex items-center gap-1">
                          {c.EValue.toLocaleString()}
                          <button
                            type="button"
                            title={t.copyCode}
                            onClick={() => copyToClipboard(`${c.ECode} ${c.EPin} ${c.EValue}`)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                          </button>
                        </span>
                      </td>
                      <td className="py-2 pr-4">
                        {used ? (
                          <Badge variant="secondary">{t.statusUsed}</Badge>
                        ) : (
                          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                            {t.statusUnused}
                          </Badge>
                        )}
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {c.GenDate ? new Date(c.GenDate).toLocaleString() : "—"}
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {c.UseDate ? new Date(c.UseDate).toLocaleString() : "—"}
                      </td>
                      <td className="py-2">
                        {!used && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkUsed(c.idx)}
                            disabled={actionLoading === c.idx}
                            className="text-xs h-6 px-2"
                          >
                            {t.markUsed}
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─────────────────────────────
   Generate Tab
───────────────────────────── */
function GenerateTab() {
  const [count, setCount] = useState("10");
  const [value, setValue] = useState("100");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const c = Number(count);
    const v = Number(value);
    if (!c || !v || c < 1 || v < 1) return;
    setLoading(true);
    try {
      await generateTopups(c, v);
      toast.success(t.toastGenerated);
    } catch {
      toast.error(t.toastGenerateFail);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t.generateTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
          <div className="space-y-1">
            <Label>{t.generateCount}</Label>
            <Input
              type="number"
              value={count}
              onChange={(e) => setCount(e.target.value)}
              min={1}
              max={500}
              required
            />
          </div>
          <div className="space-y-1">
            <Label>{t.generateValue}</Label>
            <Input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              min={1}
              required
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? t.generateLoading : t.generateSubmit}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

/* ─────────────────────────────
   Main Export
───────────────────────────── */
export function TopupSection({ tab }: { tab: "list" | "generate" }) {
  return tab === "list" ? <ListTab /> : <GenerateTab />;
}
