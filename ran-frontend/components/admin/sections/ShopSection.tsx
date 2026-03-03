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
  const [editTarget, setEditTarget] = useState<ShopItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    itemMain: "",
    itemSub: "",
    itemName: "",
    itemCategory: "",
    itemStock: "0",
    itemMoney: "",
    shopType: "EP",
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
    setForm({ itemMain: "", itemSub: "", itemName: "", itemCategory: "", itemStock: "0", itemMoney: "", shopType: "EP" });
    setDialogOpen(true);
  }

  function openEdit(item: ShopItem) {
    setEditTarget(item);
    // Find the category by CategoryNum to get its idx (used as SelectItem value)
    const matchingCat = categories.find((c) => c.CategoryNum === item.ItemCategory);
    setForm({
      itemMain: String(item.ItemMain),
      itemSub: String(item.ItemSub),
      itemName: item.ItemName,
      itemCategory: matchingCat ? String(matchingCat.idx) : "",
      itemStock: String(item.ItemStock),
      itemMoney: String(item.ItemMoney),
      shopType: item.ShopType,
    });
    setDialogOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      // form.itemCategory stores the category's idx; map back to CategoryNum for the backend
      const selectedCat = form.itemCategory
        ? categories.find((c) => c.idx === Number(form.itemCategory))
        : undefined;
      const categoryNum = selectedCat?.CategoryNum ?? undefined;

      if (editTarget) {
        await updateShopItem(editTarget.ProductNum, {
          itemMain: Number(form.itemMain) || undefined,
          itemSub: Number(form.itemSub) || undefined,
          itemName: form.itemName || undefined,
          category: categoryNum,
          stock: Number(form.itemStock),
          price: Number(form.itemMoney),
        });
        toast.success("Item updated.");
      } else {
        if (!form.itemMain || !form.itemName || !form.itemMoney) {
          toast.error("Please fill all required fields.");
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
                    {categories.find((c) => c.CategoryNum === item.ItemCategory)?.CategoryName ?? item.ItemCategory}
                  </td>
                  <td className="px-3 py-2 text-right">{item.ItemMoney.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right">{item.ItemStock === 0 ? <span className="text-muted-foreground">∞</span> : item.ItemStock}</td>
                  <td className="px-3 py-2 text-center">
                    <span className="inline-flex items-center rounded border px-1.5 py-0.5 text-xs font-medium bg-muted/40 text-muted-foreground border-border">
                      {item.ShopType}
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

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => !o && setDialogOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editTarget ? "Edit Shop Item" : "Add Shop Item"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Item Main ID <span className="text-destructive">*</span></Label>
                <Input type="number" value={form.itemMain} onChange={set("itemMain")} />
              </div>
              <div className="space-y-1">
                <Label>Item Sub ID</Label>
                <Input type="number" value={form.itemSub} onChange={set("itemSub")} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Item Name <span className="text-destructive">*</span></Label>
              <Input value={form.itemName} onChange={set("itemName")} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Category</Label>
                <Select value={form.itemCategory} onValueChange={(v) => setForm((f) => ({ ...f, itemCategory: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.idx} value={String(c.idx)}>{c.CategoryName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Shop Type</Label>
                <Select value={form.shopType} onValueChange={(v) => setForm((f) => ({ ...f, shopType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EP">EP</SelectItem>
                    <SelectItem value="VP">VP</SelectItem>
                    <SelectItem value="FREE">FREE</SelectItem>
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
