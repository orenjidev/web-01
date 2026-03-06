"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Upload,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  Database,
  Package,
  Shield,
  Swords,
  Check,
  X,
} from "lucide-react";
import {
  uploadAndBuildItems,
  triggerBuildItems,
  getItemsPreview,
  getItemDetail,
  type ItemPreviewEntry,
  type ItemDetailResult,
} from "@/lib/data/admin.buildItems.data";

/* ─────────────────────────────
   Flag badge helper
───────────────────────────── */
function FlagBadge({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      {value ? (
        <Check className="h-3 w-3 text-emerald-500" />
      ) : (
        <X className="h-3 w-3 text-red-400" />
      )}
      <span className={value ? "text-foreground" : "text-muted-foreground"}>
        {label}
      </span>
    </div>
  );
}

/* ─────────────────────────────
   Item Detail Modal
───────────────────────────── */
function ItemDetailModal({
  open,
  onClose,
  itemId,
}: {
  open: boolean;
  onClose: () => void;
  itemId: string | null;
}) {
  const [data, setData] = useState<ItemDetailResult["item"] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !itemId) return;
    setLoading(true);
    setData(null);
    getItemDetail(itemId)
      .then((res) => setData(res.item))
      .catch(() => toast.error("Failed to load item details."))
      .finally(() => setLoading(false));
  }, [open, itemId]);

  const flags = data?.flags;
  const box = data?.box;
  const randomBox = data?.randomBox;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {loading ? (
              <Skeleton className="h-5 w-48" />
            ) : (
              <>
                <span className="font-mono text-sm text-muted-foreground">
                  [{data?.itemId}]
                </span>
                {data?.name || "Unknown Item"}
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3 py-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </div>
        ) : data ? (
          <div className="space-y-4 py-1">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {data.type && (
                <div>
                  <span className="text-muted-foreground text-xs block">Type</span>
                  <Badge variant="secondary">{data.type.label}</Badge>
                </div>
              )}
              {data.level !== undefined && (
                <div>
                  <span className="text-muted-foreground text-xs block">Level (Rarity)</span>
                  <span className="font-semibold">{data.level}</span>
                </div>
              )}
              {data.grade && (
                <>
                  <div className="flex items-center gap-1.5">
                    <Swords className="h-3.5 w-3.5 text-red-400" />
                    <span className="text-muted-foreground text-xs">ATK Grade</span>
                    <span className="font-semibold ml-auto">{data.grade.attack}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-blue-400" />
                    <span className="text-muted-foreground text-xs">DEF Grade</span>
                    <span className="font-semibold ml-auto">{data.grade.defense}</span>
                  </div>
                </>
              )}
              {data.icon && (
                <div>
                  <span className="text-muted-foreground text-xs block">Icon ID</span>
                  <span className="font-mono text-xs">{data.icon.main}-{data.icon.sub}</span>
                </div>
              )}
              {data.files?.inventory && (
                <div>
                  <span className="text-muted-foreground text-xs block">Inventory File</span>
                  <span className="font-mono text-xs truncate block">{data.files.inventory}</span>
                </div>
              )}
            </div>

            {/* Flags */}
            {flags && (
              <>
                <Separator />
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Flags
                  </h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <FlagBadge label="Sell to NPC" value={flags.canSellToNPC} />
                    <FlagBadge label="Trade" value={flags.canTrade} />
                    <FlagBadge label="Drop" value={flags.canDrop} />
                    <FlagBadge label="Event Item" value={flags.isEventItem} />
                    <FlagBadge label="Costume" value={flags.isCostume} />
                    <FlagBadge label="Time Limited" value={flags.isTimeLimited} />
                    <FlagBadge label="Wrap" value={flags.canWrap} />
                    <FlagBadge label="Dismantle" value={flags.canDismantle} />
                    <FlagBadge label="Restricted" value={flags.restricted} />
                    <FlagBadge label="Send Post" value={flags.canSendPost} />
                  </div>
                </div>
              </>
            )}

            {/* Box Contents */}
            {box && box.items.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5" />
                    Box Contents
                    {box.showContents && (
                      <Badge variant="outline" className="text-[10px] ml-1">Visible</Badge>
                    )}
                  </h4>
                  <div className="rounded-md border overflow-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="px-2 py-1.5 text-left font-medium">ID</th>
                          <th className="px-2 py-1.5 text-left font-medium">Name</th>
                          <th className="px-2 py-1.5 text-left font-medium">Type</th>
                          <th className="px-2 py-1.5 text-right font-medium">Icon</th>
                          <th className="px-2 py-1.5 text-right font-medium">Qty</th>
                        </tr>
                      </thead>
                      <tbody>
                        {box.items.map((bi, idx) => (
                          <tr key={idx} className="border-b last:border-0">
                            <td className="px-2 py-1 font-mono">{bi.itemId}</td>
                            <td className="px-2 py-1">{bi.name}</td>
                            <td className="px-2 py-1">
                              {bi.type && (
                                <Badge variant="secondary" className="text-[10px] font-normal">
                                  {bi.type.label}
                                </Badge>
                              )}
                            </td>
                            <td className="px-2 py-1 text-right font-mono">
                              {bi.icon ? `${bi.icon.main}-${bi.icon.sub}` : "-"}
                            </td>
                            <td className="px-2 py-1 text-right">{bi.amount ?? "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* Random Box */}
            {randomBox && randomBox.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5" />
                    Random Box
                  </h4>
                  <div className="rounded-md border overflow-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="px-2 py-1.5 text-left font-medium">ID</th>
                          <th className="px-2 py-1.5 text-left font-medium">Name</th>
                          <th className="px-2 py-1.5 text-left font-medium">Type</th>
                          <th className="px-2 py-1.5 text-right font-medium">Icon</th>
                          <th className="px-2 py-1.5 text-right font-medium">Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {randomBox.map((bi, idx) => (
                          <tr key={idx} className="border-b last:border-0">
                            <td className="px-2 py-1 font-mono">{bi.itemId}</td>
                            <td className="px-2 py-1">{bi.name}</td>
                            <td className="px-2 py-1">
                              {bi.type && (
                                <Badge variant="secondary" className="text-[10px] font-normal">
                                  {bi.type.label}
                                </Badge>
                              )}
                            </td>
                            <td className="px-2 py-1 text-right font-mono">
                              {bi.icon ? `${bi.icon.main}-${bi.icon.sub}` : "-"}
                            </td>
                            <td className="px-2 py-1 text-right">{bi.rate ?? "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────────────────────
   Main Section
───────────────────────────── */
export function BuildItemsSection() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [rebuilding, setRebuilding] = useState(false);

  // Preview state
  const [items, setItems] = useState<ItemPreviewEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [cacheInfo, setCacheInfo] = useState<{
    loaded: boolean;
    count: number;
    loadedAt: string | null;
    version: string;
  } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(true);
  const limit = 50;

  // Modal state
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const loadPreview = useCallback(async (p: number, s: string) => {
    setPreviewLoading(true);
    try {
      const res = await getItemsPreview(p, limit, s);
      setItems(res.items);
      setTotal(res.total);
      setPage(res.page);
      setCacheInfo(res.info);
    } catch {
      setItems([]);
      setTotal(0);
      setCacheInfo(null);
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPreview(1, "");
  }, [loadPreview]);

  async function handleUploadAndBuild() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      toast.error("Please select an Item.csv file first.");
      return;
    }
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Only .csv files are allowed.");
      return;
    }

    setUploading(true);
    try {
      const res = await uploadAndBuildItems(file);
      toast.success(res.message || `Built ${res.itemCount} items.`);
      if (fileRef.current) fileRef.current.value = "";
      loadPreview(1, search);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleRebuild() {
    setRebuilding(true);
    try {
      const res = await triggerBuildItems();
      toast.success(res.message || `Rebuilt ${res.itemCount} items.`);
      loadPreview(1, search);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Rebuild failed.");
    } finally {
      setRebuilding(false);
    }
  }

  function handleSearch() {
    setSearch(searchInput);
    loadPreview(1, searchInput);
  }

  const busy = uploading || rebuilding;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-4">
      {/* Build Card */}
      <Card>
        <CardHeader>
          <CardTitle>Build Items</CardTitle>
          <CardDescription>
            Upload a new Item.csv or rebuild the item database from the existing
            CSV file.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upload & Build */}
          <div className="space-y-3">
            <Label htmlFor="item-csv">Upload Item.csv</Label>
            <div className="flex items-center gap-3">
              <Input
                id="item-csv"
                ref={fileRef}
                type="file"
                accept=".csv"
                disabled={busy}
                className="max-w-sm"
              />
              <Button
                onClick={handleUploadAndBuild}
                disabled={busy}
                className="gap-2"
              >
                <Upload className={`h-4 w-4 ${uploading ? "animate-pulse" : ""}`} />
                {uploading ? "Uploading..." : "Upload & Build"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              This will replace the existing Item.csv and regenerate the items
              JSON file.
            </p>
          </div>

          {/* Separator */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">or</span>
            </div>
          </div>

          {/* Rebuild from existing */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleRebuild}
              disabled={busy}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${rebuilding ? "animate-spin" : ""}`} />
              {rebuilding ? "Rebuilding..." : "Rebuild from Existing CSV"}
            </Button>
            <span className="text-xs text-muted-foreground">
              Re-process the current Item.csv without uploading a new file.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Preview Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Items Preview
              </CardTitle>
              <CardDescription>
                {cacheInfo?.loaded
                  ? `${cacheInfo.count.toLocaleString()} items loaded`
                  : "No items data loaded yet. Build items first."}
                {cacheInfo?.loadedAt && (
                  <> &middot; Last loaded: {new Date(cacheInfo.loadedAt).toLocaleString()}</>
                )}
              </CardDescription>
            </div>
            {cacheInfo?.version && (
              <Badge variant="outline" className="text-xs">
                {cacheInfo.version}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by ID or name..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="sm" onClick={handleSearch}>
              Search
            </Button>
          </div>

          {/* Table */}
          {previewLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              {cacheInfo?.loaded
                ? "No items match your search."
                : "No items data available. Upload a CSV and build first."}
            </p>
          ) : (
            <div className="rounded-md border overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-3 py-2 text-left font-medium">ID</th>
                    <th className="px-3 py-2 text-left font-medium">Name</th>
                    <th className="px-3 py-2 text-left font-medium">Type</th>
                    <th className="px-3 py-2 text-right font-medium">Level</th>
                    <th className="px-3 py-2 text-right font-medium">ATK</th>
                    <th className="px-3 py-2 text-right font-medium">DEF</th>
                    <th className="px-3 py-2 text-right font-medium">Icon</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr
                      key={item.itemId}
                      className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                      onClick={() => setSelectedItemId(item.itemId)}
                    >
                      <td className="px-3 py-1.5 font-mono text-xs">{item.itemId}</td>
                      <td className="px-3 py-1.5">{item.name || "-"}</td>
                      <td className="px-3 py-1.5">
                        <Badge variant="secondary" className="text-xs font-normal">
                          {item.type?.label ?? item.type?.id ?? "-"}
                        </Badge>
                      </td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{item.level}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{item.grade?.attack ?? 0}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{item.grade?.defense ?? 0}</td>
                      <td className="px-3 py-1.5 text-right font-mono text-xs">
                        {item.icon ? `${item.icon.main}-${item.icon.sub}` : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {total > 0 && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, total)} of{" "}
                {total.toLocaleString()} items
                {search && " (filtered)"}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  disabled={page <= 1 || previewLoading}
                  onClick={() => loadPreview(page - 1, search)}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <span className="px-2">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  disabled={page >= totalPages || previewLoading}
                  onClick={() => loadPreview(page + 1, search)}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Item Detail Modal */}
      <ItemDetailModal
        open={!!selectedItemId}
        onClose={() => setSelectedItemId(null)}
        itemId={selectedItemId}
      />
    </div>
  );
}
