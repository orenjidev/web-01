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
  listDownloads,
  createDownload,
  updateDownload,
  type DownloadRow,
} from "@/lib/data/admin.download.data";

const DOWNLOAD_TYPES = ["client", "patch", "tool", "other"];

/* ─────────────────────────────
   Download Form Dialog
───────────────────────────── */
function DownloadFormDialog({
  open,
  editItem,
  onClose,
  onSaved,
}: {
  open: boolean;
  editItem: DownloadRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    title: "",
    downloadLink: "",
    description: "",
    downloadType: "client",
    visible: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (editItem) {
      setForm({
        title: editItem.Title ?? "",
        downloadLink: editItem.DownloadLink ?? "",
        description: "",
        downloadType: editItem.DownloadType || "other",
        visible: Boolean(editItem.Visible),
      });
    } else {
      setForm({
        title: "",
        downloadLink: "",
        description: "",
        downloadType: "client",
        visible: true,
      });
    }
  }, [open, editItem]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    console.log("Saving visible:", form.visible);
    if (!form.title || !form.downloadLink) {
      toast.error("Title and download link are required.");
      return;
    }

    let descriptionBase64: string | undefined;
    if (form.description) {
      try {
        descriptionBase64 = btoa(
          unescape(encodeURIComponent(form.description)),
        );
      } catch {
        toast.error("Description encoding failed.");
        return;
      }
    }

    setSaving(true);
    try {
      if (editItem) {
        await updateDownload({
          id: editItem.ID,
          title: form.title,
          downloadLink: form.downloadLink,
          descriptionBase64,
          downloadType: form.downloadType,
          visible: form.visible ? true : false,
        });
        toast.success("Download updated.");
      } else {
        await createDownload({
          title: form.title,
          downloadLink: form.downloadLink,
          descriptionBase64,
          downloadType: form.downloadType,
          visible: form.visible ? true : false,
        });
        toast.success("Download created.");
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed.");
    } finally {
      setSaving(false);
    }
  }

  const set =
    (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editItem ? "Edit Download" : "Add Download"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-3 pt-2">
          <div className="space-y-1">
            <Label>
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              value={form.title}
              onChange={set("title")}
              placeholder="Download title"
            />
          </div>
          <div className="space-y-1">
            <Label>
              Download Link <span className="text-destructive">*</span>
            </Label>
            <Input
              value={form.downloadLink}
              onChange={set("downloadLink")}
              placeholder="https://…"
              type="url"
            />
          </div>
          <div className="space-y-1">
            <Label>Description</Label>
            <textarea
              value={form.description}
              onChange={set("description")}
              placeholder="Optional description (HTML supported)"
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Type</Label>
              <Select
                value={form.downloadType}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, downloadType: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOWNLOAD_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={form.visible}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, visible: e.target.checked }))
                  }
                  className="w-4 h-4"
                />
                Visible
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : editItem ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────────────────────
   Main Section
───────────────────────────── */
export function DownloadSection() {
  const [downloads, setDownloads] = useState<DownloadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<DownloadRow | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setDownloads(await listDownloads());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load downloads.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditItem(null);
    setDialogOpen(true);
  }

  function openEdit(item: DownloadRow) {
    setEditItem(item);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Manage Downloads</CardTitle>
              <CardDescription>
                Manage game client and patch download links
              </CardDescription>
            </div>
            <Button size="sm" onClick={openCreate}>
              + Add Download
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : error ? (
            <p className="text-sm text-destructive text-center py-4">{error}</p>
          ) : downloads.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No download links found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                      ID
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                      Title
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                      Type
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                      Link
                    </th>
                    <th className="px-3 py-2 text-center font-medium text-muted-foreground">
                      Visible
                    </th>
                    <th className="px-3 py-2 text-center font-medium text-muted-foreground">
                      Clicks
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                      Date
                    </th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {downloads.map((dl) => (
                    <tr
                      key={dl.ID}
                      className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                        {dl.ID}
                      </td>
                      <td className="px-3 py-2 font-medium">{dl.Title}</td>
                      <td className="px-3 py-2">
                        <span className="inline-flex items-center rounded border px-1.5 py-0.5 text-xs font-medium bg-muted/40 text-muted-foreground border-border capitalize">
                          {dl.DownloadType}
                        </span>
                      </td>
                      <td className="px-3 py-2 max-w-xs">
                        <a
                          href={dl.DownloadLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline truncate block text-xs"
                        >
                          {dl.DownloadLink}
                        </a>
                      </td>
                      <td className="px-3 py-2 text-center text-xs">
                        {dl.Visible ? (
                          <span className="text-emerald-500 font-medium">
                            Yes
                          </span>
                        ) : (
                          <span className="text-red-500 font-medium">No</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center font-mono text-xs text-muted-foreground">
                        {dl.ClickCount ?? 0}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground text-xs">
                        {new Date(dl.CreatedAt).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEdit(dl)}
                        >
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-2 text-xs text-muted-foreground text-right">
                {downloads.length} entry(s)
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <DownloadFormDialog
        open={dialogOpen}
        editItem={editItem}
        onClose={() => setDialogOpen(false)}
        onSaved={load}
      />
    </div>
  );
}
