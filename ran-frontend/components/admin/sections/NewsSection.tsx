"use client";

import { useEffect, useRef, useState } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NewsRichEditor } from "@/components/ui/news-editor";
import {
  listNews,
  getNewsById,
  createNews,
  updateNews,
  type NewsRow,
} from "@/lib/data/admin.news.data";

const NEWS_TYPES = ["announcement", "maintenance", "event", "patch", "other"];

/* ─────────────────────────────
   News Editor (full-page, Mina Rich Editor)
───────────────────────────── */
function NewsEditor({
  editId,
  onClose,
  onSaved,
}: {
  editId: number | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  /* TipTap editor HTML — updated on every editor change */
  const editorHtmlRef = useRef<string>("");
  const [existingHtml, setExistingHtml] = useState<string>("");
  const [form, setForm] = useState({
    type: "announcement",
    title: "",
    author: "",
    shortDescription: "",
    bannerImg: "",
    bannerImg2: "",
    isPinned: false,
    pinPriority: "0",
    visible: true,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  /* Load existing news when editing */
  useEffect(() => {
    if (editId) {
      setLoading(true);
      getNewsById(editId)
        .then((news) => {
          let decoded = "";
          if (news.LongDescriptionBase64) {
            try {
              decoded = decodeURIComponent(escape(atob(news.LongDescriptionBase64)));
            } catch {
              decoded = "";
            }
          }
          setExistingHtml(decoded);
          setForm({
            type: news.Type ?? "announcement",
            title: news.Title ?? "",
            author: news.Author ?? "",
            shortDescription: news.ShortDescription ?? "",
            bannerImg: news.BannerImg ?? "",
            bannerImg2: news.BannerImg2 ?? "",
            isPinned: news.IsPinned ?? false,
            pinPriority: String(news.PinPriority ?? 0),
            visible: news.Visible ?? true,
          });
        })
        .catch(() => toast.error("Failed to load news."))
        .finally(() => setLoading(false));
    } else {
      setExistingHtml("");
      editorHtmlRef.current = "";
      setForm({
        type: "announcement", title: "", author: "", shortDescription: "",
        bannerImg: "", bannerImg2: "", isPinned: false, pinPriority: "0", visible: true,
      });
    }
  }, [editId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title) { toast.error("Title is required."); return; }

    const editorHtml = editorHtmlRef.current;
    const isEditorEmpty = !editorHtml || editorHtml.replace(/<[^>]*>/g, "").trim() === "";
    const htmlToSave = isEditorEmpty && editId ? existingHtml : editorHtml;

    let longDescriptionBase64 = "";
    try {
      longDescriptionBase64 = htmlToSave
        ? btoa(unescape(encodeURIComponent(htmlToSave)))
        : btoa(" ");
    } catch {
      toast.error("Content encoding failed.");
      return;
    }

    setSaving(true);
    try {
      const shared = {
        type: form.type,
        title: form.title,
        author: form.author || undefined,
        shortDescription: form.shortDescription || undefined,
        bannerImg: form.bannerImg || undefined,
        bannerImg2: form.bannerImg2 || undefined,
        longDescriptionBase64,
        isPinned: form.isPinned ? 1 : 0,
        pinPriority: Number(form.pinPriority),
        visible: form.visible ? 1 : 0,
      };
      if (editId) {
        await updateNews({ id: editId, ...shared });
        toast.success("News updated.");
      } else {
        await createNews(shared);
        toast.success("News created.");
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed.");
    } finally {
      setSaving(false);
    }
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  if (loading) {
    return (
      <div className="p-6 space-y-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSave}
      className="flex flex-col h-[calc(100vh-9rem)] rounded-xl border border-border overflow-hidden bg-card"
    >
      {/* ── Header ── */}
      <div className="px-5 py-3 border-b border-border shrink-0 flex items-center justify-between gap-3">
        <h2 className="font-semibold text-base">{editId ? "Edit News" : "Create News"}</h2>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            ← Back to List
          </Button>
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? "Saving…" : editId ? "Update" : "Publish"}
          </Button>
        </div>
      </div>

      {/* ── Meta Fields ── */}
      <div className="px-5 py-3 border-b border-border shrink-0 space-y-3">
        <div className="grid grid-cols-4 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Type <span className="text-destructive">*</span></Label>
            <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {NEWS_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Author</Label>
            <Input className="h-8 text-xs" value={form.author} onChange={set("author")} placeholder="Author name" />
          </div>
          <div className="col-span-2 space-y-1">
            <Label className="text-xs">Title <span className="text-destructive">*</span></Label>
            <Input className="h-8 text-xs" value={form.title} onChange={set("title")} placeholder="News title" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Short Description</Label>
            <Input className="h-8 text-xs" value={form.shortDescription} onChange={set("shortDescription")} placeholder="Brief summary" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Banner Image URL</Label>
            <Input className="h-8 text-xs" value={form.bannerImg} onChange={set("bannerImg")} placeholder="https://…" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Banner Image 2 URL</Label>
            <Input className="h-8 text-xs" value={form.bannerImg2} onChange={set("bannerImg2")} placeholder="https://…" />
          </div>
        </div>
      </div>

      {/* ── Notice for existing articles ── */}
      {/* ── Rich Text Editor ── */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <NewsRichEditor
          initialHtml={existingHtml}
          onChange={(html) => { editorHtmlRef.current = html; }}
          placeholder="Write your article here…"
        />
      </div>

      {/* ── Footer ── */}
      <div className="px-5 py-3 border-t border-border shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={form.isPinned}
              onChange={(e) => setForm((f) => ({ ...f, isPinned: e.target.checked }))}
              className="w-4 h-4"
            />
            Pinned
          </label>
          {form.isPinned && (
            <div className="flex items-center gap-2">
              <Label className="text-xs whitespace-nowrap">Priority</Label>
              <Input
                type="number"
                value={form.pinPriority}
                onChange={set("pinPriority")}
                className="h-7 w-20 text-xs"
                min={0}
              />
            </div>
          )}
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={form.visible}
              onChange={(e) => setForm((f) => ({ ...f, visible: e.target.checked }))}
              className="w-4 h-4"
            />
            Visible
          </label>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? "Saving…" : editId ? "Update" : "Publish"}
          </Button>
        </div>
      </div>
    </form>
  );
}

/* ─────────────────────────────
   Main Section
───────────────────────────── */
export function NewsSection() {
  const [news, setNews] = useState<NewsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setNews(await listNews());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load news.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditId(null);
    setEditorOpen(true);
  }

  function openEdit(id: number) {
    setEditId(id);
    setEditorOpen(true);
  }

  /* ── Full-page editor mode ── */
  if (editorOpen) {
    return (
      <NewsEditor
        editId={editId}
        onClose={() => setEditorOpen(false)}
        onSaved={() => { load(); setEditorOpen(false); }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Manage News</CardTitle>
              <CardDescription>Create and edit news articles</CardDescription>
            </div>
            <Button size="sm" onClick={openCreate}>+ Add News</Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : error ? (
            <p className="text-sm text-destructive text-center py-4">{error}</p>
          ) : news.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No news articles found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">ID</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Title</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Type</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Author</th>
                    <th className="px-3 py-2 text-center font-medium text-muted-foreground">Pinned</th>
                    <th className="px-3 py-2 text-center font-medium text-muted-foreground">Visible</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Date</th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {news.map((item) => (
                    <tr key={item.ID} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{item.ID}</td>
                      <td className="px-3 py-2 font-medium max-w-xs truncate">{item.Title}</td>
                      <td className="px-3 py-2">
                        <span className="inline-flex items-center rounded border px-1.5 py-0.5 text-xs font-medium bg-muted/40 text-muted-foreground border-border capitalize">
                          {item.Type}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{item.Author ?? "—"}</td>
                      <td className="px-3 py-2 text-center text-xs">
                        {item.IsPinned ? <span className="text-amber-500 font-medium">Yes</span> : <span className="text-muted-foreground">No</span>}
                      </td>
                      <td className="px-3 py-2 text-center text-xs">
                        {item.Visible ? <span className="text-emerald-500 font-medium">Yes</span> : <span className="text-red-500 font-medium">No</span>}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground text-xs">{new Date(item.CreatedAt).toLocaleDateString()}</td>
                      <td className="px-3 py-2 text-right">
                        <Button size="sm" variant="outline" onClick={() => openEdit(item.ID)}>Edit</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-2 text-xs text-muted-foreground text-right">{news.length} article(s)</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
