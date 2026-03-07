"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
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
  getItemsPreview,
  type ItemPreviewEntry,
} from "@/lib/data/admin.buildItems.data";
import {
  getShopCategories,
  createShopCategory,
  updateShopCategory,
  deleteShopCategory,
  getShopItems,
  createShopItem,
  updateShopItem,
  deleteShopItem,
  type ShopCategory,
  type ShopItem,
} from "@/lib/data/admin.shop.data";

/* ─────────────────────────────
   Item Picker Dialog
───────────────────────────── */
function ItemPickerDialog({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (item: ItemPreviewEntry) => void;
}) {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<ItemPreviewEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const limit = 20;

  const load = useCallback(async (p: number, s: string) => {
    setLoading(true);
    try {
      const res = await getItemsPreview(p, limit, s);
      setItems(res.items);
      setTotal(res.total);
      setPage(res.page);
    } catch {
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setSearchInput("");
      setSearch("");
      load(1, "");
    }
  }, [open, load]);

  function handleSearch() {
    setSearch(searchInput);
    load(1, searchInput);
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[78vh] flex flex-col gap-3 overflow-hidden">
        <DialogHeader>
          <DialogTitle>Pick Item from Build-Items</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 shrink-0">
          <Input
            placeholder="Search by ID (e.g. 10-0) or name..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1"
          />
          <Button variant="outline" size="sm" onClick={handleSearch}>
            <Search className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-auto rounded-md border min-h-0">
          {loading ? (
            <div className="space-y-1 p-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">
              No items found. Build items first or try a different search.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 sticky top-0">
                  <th className="px-3 py-2 text-left font-medium">ID</th>
                  <th className="px-3 py-2 text-left font-medium">Name</th>
                  <th className="px-3 py-2 text-left font-medium">Type</th>
                  <th className="px-3 py-2 text-right font-medium">Lvl</th>
                  <th className="px-3 py-2 text-right font-medium">Icon</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.itemId}
                    className="border-b last:border-0 hover:bg-primary/10 cursor-pointer transition-colors"
                    onClick={() => onPick(item)}
                  >
                    <td className="px-3 py-1.5 font-mono text-xs">{item.itemId}</td>
                    <td className="px-3 py-1.5 font-medium">{item.name || "-"}</td>
                    <td className="px-3 py-1.5">
                      {item.type?.label && (
                        <Badge variant="secondary" className="text-xs font-normal">
                          {item.type.label}
                        </Badge>
                      )}
                    </td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{item.level}</td>
                    <td className="px-3 py-1.5 text-right font-mono text-xs">
                      {item.icon ? `${item.icon.main}-${item.icon.sub}` : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {total > 0 && (
          <div className="flex items-center justify-between text-xs text-muted-foreground shrink-0">
            <span>
              {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total.toLocaleString()}
              {search && " (filtered)"}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline" size="icon" className="h-7 w-7"
                disabled={page <= 1 || loading}
                onClick={() => load(page - 1, search)}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="px-2">Page {page} of {totalPages}</span>
              <Button
                variant="outline" size="icon" className="h-7 w-7"
                disabled={page >= totalPages || loading}
                onClick={() => load(page + 1, search)}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────────────────────
   Categories Tab
───────────────────────────── */
function CategoriesTab() {
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ShopCategory | null>(null);
  const [form, setForm] = useState({ categoryNum: "", name: "" });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setCategories(await getShopCategories());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load categories.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.categoryNum || !form.name) {
      toast.error("Category number and name are required.");
      return;
    }
    setSaving(true);
    try {
      await createShopCategory({ categoryNum: Number(form.categoryNum), name: form.name });
      toast.success("Category created.");
      setCreateOpen(false);
      setForm({ categoryNum: "", name: "" });
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(cat: ShopCategory) {
    try {
      await updateShopCategory(cat.idx, { enabled: !cat.CategoryUse });
      toast.success(`Category ${cat.CategoryUse ? "disabled" : "enabled"}.`);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed.");
    }
  }

  async function handleDelete(cat: ShopCategory) {
    if (!confirm(`Delete category "${cat.CategoryName}"? This cannot be undone.`)) return;
    setDeleting(cat.idx);
    try {
      await deleteShopCategory(cat.idx);
      toast.success("Category deleted.");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete category.");
    } finally {
      setDeleting(null);
    }
  }

  async function handleRename(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    setSaving(true);
    try {
      await updateShopCategory(editTarget.idx, { name: form.name });
      toast.success("Category renamed.");
      setEditTarget(null);
      setForm({ categoryNum: "", name: "" });
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="flex justify-end mb-3">
        <Button size="sm" onClick={() => { setForm({ categoryNum: "", name: "" }); setCreateOpen(true); }}>
          + Add Category
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
      ) : error ? (
        <p className="text-sm text-destructive text-center py-4">{error}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Num</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Name</th>
                <th className="px-3 py-2 text-center font-medium text-muted-foreground">Enabled</th>
                <th className="px-3 py-2 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat, idx) => (
                <tr key={`cat-${idx}`} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{cat.CategoryNum}</td>
                  <td className="px-3 py-2 font-medium">{cat.CategoryName}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={cat.CategoryUse ? "text-emerald-500 text-xs font-medium" : "text-red-500 text-xs font-medium"}>
                      {cat.CategoryUse ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setEditTarget(cat); setForm({ categoryNum: String(cat.CategoryNum), name: cat.CategoryName }); }}
                    >
                      Rename
                    </Button>
                    <Button
                      size="sm"
                      variant={cat.CategoryUse ? "destructive" : "outline"}
                      onClick={() => handleToggle(cat)}
                    >
                      {cat.CategoryUse ? "Disable" : "Enable"}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={deleting === cat.idx}
                      onClick={() => handleDelete(cat)}
                    >
                      {deleting === cat.idx ? "…" : "Delete"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={(o) => !o && setCreateOpen(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Shop Category</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3 pt-2">
            <div className="space-y-1">
              <Label>Category Number <span className="text-destructive">*</span></Label>
              <Input type="number" value={form.categoryNum} onChange={(e) => setForm((f) => ({ ...f, categoryNum: e.target.value }))} placeholder="e.g. 10" />
            </div>
            <div className="space-y-1">
              <Label>Name <span className="text-destructive">*</span></Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Category name" />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Create"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Rename Category</DialogTitle></DialogHeader>
          <form onSubmit={handleRename} className="space-y-3 pt-2">
            <div className="space-y-1">
              <Label>New Name</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ─────────────────────────────
   Items Tab
───────────────────────────── */
function ItemsTab() {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItemPreviewEntry | null>(null);
  const [editTarget, setEditTarget] = useState<ShopItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    itemMain: "",
    itemSub: "",
    itemName: "",
    itemCategory: "",
    itemStock: "0",
    itemMoney: "",
    enabled: "1",
  });

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [itemData, catData] = await Promise.all([getShopItems(), getShopCategories()]);
      setItems(itemData);
      setCategories(catData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load items.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditTarget(null);
    setSelectedItem(null);
    setForm({ itemMain: "", itemSub: "", itemName: "", itemCategory: "", itemStock: "0", itemMoney: "", enabled: "1" });
    setDialogOpen(true);
  }

  function openEdit(item: ShopItem) {
    setEditTarget(item);
    setSelectedItem({
      itemId: `${item.ItemMain}-${item.ItemSub}`,
      name: item.ItemName,
      level: 0,
      type: { id: 0, label: "" },
      grade: { attack: 0, defense: 0 },
      icon: { main: 0, sub: 0 },
    });
    setForm({
      itemMain: String(item.ItemMain),
      itemSub: String(item.ItemSub),
      itemName: item.ItemName,
      itemCategory: String(item.ItemCategory),
      itemStock: String(item.ItemStock),
      itemMoney: String(item.ItemMoney),
      enabled: item.ShopType ? "1" : "0",
    });
    setDialogOpen(true);
  }

  function handleItemPicked(item: ItemPreviewEntry) {
    const [mid, sid] = item.itemId.split("-");
    setSelectedItem(item);
    setForm((f) => ({
      ...f,
      itemMain: mid ?? "",
      itemSub: sid ?? "0",
      itemName: item.name,
    }));
    setPickerOpen(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const categoryNum = form.itemCategory ? Number(form.itemCategory) : undefined;

      if (editTarget) {
        await updateShopItem(editTarget.ProductNum, {
          itemMain: Number(form.itemMain) || undefined,
          itemSub: Number(form.itemSub) || undefined,
          itemName: form.itemName || undefined,
          category: categoryNum,
          stock: Number(form.itemStock),
          price: Number(form.itemMoney),
          enabled: form.enabled === "1",
        });
        toast.success("Item updated.");
      } else {
        if (!selectedItem || !form.itemMain || !form.itemName || !form.itemMoney) {
          toast.error("Please pick an item and fill all required fields.");
          setSaving(false);
          return;
        }
        await createShopItem({
          itemMain: Number(form.itemMain),
          itemSub: Number(form.itemSub),
          itemName: form.itemName,
          category: categoryNum,
          stock: Number(form.itemStock),
          price: Number(form.itemMoney),
          enabled: form.enabled === "1",
        });
        toast.success("Item created.");
      }
      setDialogOpen(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(productNum: number) {
    try {
      await deleteShopItem(productNum);
      toast.success("Item disabled.");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed.");
    }
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <>
      <div className="flex justify-end mb-3">
        <Button size="sm" onClick={openCreate}>+ Add Item</Button>
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
      ) : error ? (
        <p className="text-sm text-destructive text-center py-4">{error}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">ProductNum</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Name</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Category</th>
                <th className="px-3 py-2 text-right font-medium text-muted-foreground">Price</th>
                <th className="px-3 py-2 text-right font-medium text-muted-foreground">Stock</th>
                <th className="px-3 py-2 text-center font-medium text-muted-foreground">Type</th>
                <th className="px-3 py-2 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.ProductNum} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{item.ProductNum}</td>
                  <td className="px-3 py-2 font-medium">{item.ItemName}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {(() => {
                      const cat = categories.find((c) => Number(c.CategoryNum) === Number(item.ItemCategory));
                      return cat ? `${cat.CategoryName} (${cat.CategoryNum})` : item.ItemCategory;
                    })()}
                  </td>
                  <td className="px-3 py-2 text-right">{item.ItemMoney.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right">{item.ItemStock === 0 ? <span className="text-muted-foreground">∞</span> : item.ItemStock}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-xs font-medium border-border ${item.ShopType ? "bg-green-500/10 text-green-600" : "bg-muted/40 text-muted-foreground"}`}>
                      {item.ShopType ? "Show" : "Hide"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right space-x-2">
                    <Button size="sm" variant="outline" onClick={() => openEdit(item)}>Edit</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(item.ProductNum)}>Disable</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-muted-foreground text-right">{items.length} item(s)</p>
        </div>
      )}

      <ItemPickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={handleItemPicked}
      />

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => !o && setDialogOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editTarget ? "Edit Shop Item" : "Add Shop Item"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-3 pt-2">
            {/* Item Picker */}
            <div className="space-y-1">
              <Label>Item <span className="text-destructive">*</span></Label>
              {selectedItem ? (
                <div className="rounded-md border bg-muted/30 p-3 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{selectedItem.name || "Unknown"}</div>
                      <div className="font-mono text-xs text-muted-foreground">ID: {selectedItem.itemId}</div>
                      {selectedItem.type?.label && (
                        <Badge variant="secondary" className="mt-1 text-xs">{selectedItem.type.label}</Badge>
                      )}
                    </div>
                    <div className="text-right text-xs text-muted-foreground shrink-0 space-y-0.5">
                      {selectedItem.level > 0 && <div>Lvl {selectedItem.level}</div>}
                      {(selectedItem.grade?.attack || selectedItem.grade?.defense) ? (
                        <div>ATK {selectedItem.grade.attack} / DEF {selectedItem.grade.defense}</div>
                      ) : null}
                      {selectedItem.icon && (selectedItem.icon.main > 0 || selectedItem.icon.sub > 0) && (
                        <div className="font-mono">Icon {selectedItem.icon.main}-{selectedItem.icon.sub}</div>
                      )}
                    </div>
                  </div>
                  <Button
                    type="button" variant="outline" size="sm" className="w-full"
                    onClick={() => setPickerOpen(true)}
                  >
                    Change Item
                  </Button>
                </div>
              ) : (
                <Button
                  type="button" variant="outline" className="w-full justify-start text-muted-foreground h-9"
                  onClick={() => setPickerOpen(true)}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Click to pick an item from build-items...
                </Button>
              )}
            </div>
            <div className="space-y-1">
              <Label>Item Name <span className="text-destructive">*</span></Label>
              <Input value={form.itemName} onChange={set("itemName")} placeholder="Display name in shop" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Category</Label>
                <Select value={form.itemCategory} onValueChange={(v) => setForm((f) => ({ ...f, itemCategory: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.idx} value={String(c.CategoryNum)}>{c.CategoryName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Visibility</Label>
                <Select value={form.enabled} onValueChange={(v) => setForm((f) => ({ ...f, enabled: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Show</SelectItem>
                    <SelectItem value="0">Hide</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Price <span className="text-destructive">*</span></Label>
                <Input type="number" value={form.itemMoney} onChange={set("itemMoney")} />
              </div>
              <div className="space-y-1">
                <Label>Stock (0 = unlimited)</Label>
                <Input type="number" value={form.itemStock} onChange={set("itemStock")} min={0} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Saving…" : editTarget ? "Update" : "Create"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ─────────────────────────────
   Main Section
───────────────────────────── */
export function ShopSection({ tab }: { tab: "categories" | "items" }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{tab === "categories" ? "Shop Categories" : "Shop Items"}</CardTitle>
        <CardDescription>
          {tab === "categories"
            ? "Manage item shop category groups"
            : "Manage item shop products"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {tab === "categories" ? <CategoriesTab /> : <ItemsTab />}
      </CardContent>
    </Card>
  );
}
