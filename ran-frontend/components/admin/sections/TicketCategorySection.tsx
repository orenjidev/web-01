"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PlusCircle, Pencil, ToggleLeft, ToggleRight } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getAdminTicketCategories,
  createTicketCategory,
  updateTicketCategory,
  type TicketCategory,
} from "@/lib/data/admin.ticketCategory.data";

const EMPTY_FORM = { name: "", description: "", defaultAssignedTeam: "" };

export function TicketCategorySection() {
  const [categories, setCategories] = useState<TicketCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TicketCategory | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  async function load() {
    setLoading(true);
    try {
      setCategories(await getAdminTicketCategories());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load categories.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(cat: TicketCategory) {
    setEditTarget(cat);
    setForm({
      name: cat.CategoryName,
      description: cat.Description ?? "",
      defaultAssignedTeam: cat.DefaultAssignedTeam ?? "",
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error("Category name is required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        defaultAssignedTeam: form.defaultAssignedTeam.trim() || undefined,
      };
      if (editTarget) {
        await updateTicketCategory(editTarget.CategoryID, payload);
        toast.success("Category updated.");
      } else {
        await createTicketCategory(payload);
        toast.success("Category created.");
      }
      setDialogOpen(false);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(cat: TicketCategory) {
    try {
      await updateTicketCategory(cat.CategoryID, { isActive: !cat.IsActive });
      toast.success(`Category ${cat.IsActive ? "deactivated" : "activated"}.`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Toggle failed.");
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-sm">Ticket Categories</CardTitle>
            <CardDescription>Manage support ticket categories.</CardDescription>
          </div>
          <Button size="sm" onClick={openCreate}>
            <PlusCircle className="h-4 w-4 mr-1.5" />
            New Category
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-md" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No categories found.
            </p>
          ) : (
            <div className="space-y-2">
              {categories.map((cat) => (
                <div
                  key={cat.CategoryID}
                  className="flex items-center justify-between gap-4 rounded-md border p-3"
                >
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-sm font-medium flex items-center gap-2">
                      {cat.CategoryName}
                      <Badge variant={cat.IsActive ? "default" : "secondary"}>
                        {cat.IsActive ? "Active" : "Inactive"}
                      </Badge>
                    </p>
                    {(cat.Description || cat.DefaultAssignedTeam) && (
                      <p className="text-xs text-muted-foreground truncate">
                        {[cat.Description, cat.DefaultAssignedTeam && `Team: ${cat.DefaultAssignedTeam}`]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => openEdit(cat)}
                      title="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => handleToggle(cat)}
                      title={cat.IsActive ? "Deactivate" : "Activate"}
                    >
                      {cat.IsActive ? (
                        <ToggleRight className="h-4 w-4 text-green-600" />
                      ) : (
                        <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) setDialogOpen(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editTarget ? "Edit Category" : "New Category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="tc-name">Name <span className="text-destructive">*</span></Label>
              <Input
                id="tc-name"
                placeholder="e.g. Bug Report"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tc-desc">Description</Label>
              <Input
                id="tc-desc"
                placeholder="Optional short description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tc-team">Default Assigned Team</Label>
              <Input
                id="tc-team"
                placeholder="e.g. Support, GM Team"
                value={form.defaultAssignedTeam}
                onChange={(e) => setForm((f) => ({ ...f, defaultAssignedTeam: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
