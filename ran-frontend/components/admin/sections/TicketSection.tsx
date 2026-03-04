"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getStaffTickets,
  getStaffTicketFull,
  updateTicketStatus,
  staffReply,
  getStaffList,
  assignTicket,
  updateTicketPriority,
  type StaffTicketRow,
  type StaffTicketFull,
  type StaffListItem,
} from "@/lib/data/admin.ticket.data";
import {
  getUser,
  type UserDetail,
} from "@/lib/data/admin.account.data";
import { UserDetailDialog } from "@/components/admin/sections/AccountSection";
import {
  searchCharacters,
  type CharacterSearchRow,
} from "@/lib/data/admin.character.data";
import { CharacterDetailDialog } from "@/components/admin/sections/CharacterSection";

/* ─────────────────────────────
   Helpers
───────────────────────────── */
function statusBadge(status: string) {
  switch (status) {
    case "Open": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    case "Closed": return "bg-red-500/10 text-red-500 border-red-500/20";
    default: return "bg-amber-500/10 text-amber-500 border-amber-500/20";
  }
}
const PRIORITY_ORDER: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };

function priorityBadge(priority: string) {
  switch (priority?.toLowerCase()) {
    case "critical": return "text-purple-500";
    case "high": return "text-red-500";
    case "medium": return "text-amber-500";
    default: return "text-muted-foreground";
  }
}
function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
function isImagePath(filePath: string) {
  return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(filePath);
}

/* ─────────────────────────────
   Ticket List Item
───────────────────────────── */
function TicketListItem({ ticket, selected, onClick }: {
  ticket: StaffTicketRow; selected: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 border-b border-border/50 transition-colors hover:bg-muted/40 ${selected ? "bg-muted/60 border-l-2 border-l-primary" : ""}`}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <span className="text-sm font-medium truncate flex-1">{ticket.Subject}</span>
        <span className="text-xs text-muted-foreground whitespace-nowrap">{timeAgo(ticket.CreatedAt)}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground truncate flex-1">
          {ticket.Username ?? `#${ticket.TicketID}`}
        </span>
        <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium ${statusBadge(ticket.Status)}`}>
          {ticket.Status}
        </span>
        {ticket.Priority && (
          <span className={`text-[10px] font-medium ${priorityBadge(ticket.Priority)}`}>
            {ticket.Priority}
          </span>
        )}
      </div>
    </button>
  );
}

/* ─────────────────────────────
   Info Sidebar
───────────────────────────── */
type SidebarMode = "user" | "character" | null;

function InfoRow({ label, value, mono, color }: {
  label: string; value: string; mono?: boolean; color?: string;
}) {
  return (
    <div className="flex justify-between gap-2 text-xs">
      <span className="text-muted-foreground shrink-0">{label}:</span>
      <span className={`truncate text-right ${mono ? "font-mono" : ""} ${color ?? ""}`}>{value}</span>
    </div>
  );
}

function InfoSidebar({ mode, userNum, onClose }: {
  mode: SidebarMode; userNum: number; onClose: () => void;
}) {
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [characters, setCharacters] = useState<CharacterSearchRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewUserNum, setViewUserNum] = useState<number | null>(null);
  const [viewChaNum, setViewChaNum] = useState<number | null>(null);

  useEffect(() => {
    if (!mode || !userNum) return;
    setLoading(true);
    setUserDetail(null);
    setCharacters([]);
    if (mode === "user") {
      getUser(userNum)
        .then(setUserDetail)
        .catch(() => toast.error("Failed to load user info."))
        .finally(() => setLoading(false));
    } else {
      searchCharacters("usernum", String(userNum), 20)
        .then(setCharacters)
        .catch(() => toast.error("Failed to load characters."))
        .finally(() => setLoading(false));
    }
  }, [mode, userNum]);

  if (!mode) return null;

  return (
    <>
      <div className="w-64 shrink-0 border-l border-border flex flex-col overflow-hidden bg-card">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {mode === "user" ? "User Info" : "Characters"}
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xs leading-none">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {loading ? (
            <div className="space-y-2">{[1,2,3].map((i) => <Skeleton key={i} className="h-4 w-full" />)}</div>
          ) : mode === "user" && userDetail ? (
            <div className="space-y-2">
              <InfoRow label="UserNum" value={String(userDetail.UserNum)} mono />
              <InfoRow label="Username" value={userDetail.UserID} />
              <InfoRow label="Email" value={userDetail.UserEmail || "—"} />
              <InfoRow label="Type" value={String(userDetail.UserType)} />
              <InfoRow label="EPoints" value={userDetail.UserPoint?.toLocaleString() ?? "0"} />
              <InfoRow label="Char Slots" value={String(userDetail.ChaRemain)} />
              <InfoRow label="Online" value={userDetail.UserLoginState ? "Yes" : "No"} color={userDetail.UserLoginState ? "text-emerald-500" : undefined} />
              <InfoRow label="Blocked" value={userDetail.UserBlock ? "Yes" : "No"} color={userDetail.UserBlock ? "text-red-500" : undefined} />
              {userDetail.LastLoginDate && (
                <InfoRow label="Last Login" value={new Date(userDetail.LastLoginDate).toLocaleDateString()} />
              )}
              <Button
                size="sm"
                variant="outline"
                className="w-full mt-2 h-7 text-xs"
                onClick={() => setViewUserNum(userDetail.UserNum)}
              >
                View / Edit Account
              </Button>
            </div>
          ) : mode === "character" && characters.length > 0 ? (
            <div className="space-y-3">
              {characters.map((c) => (
                <div key={c.ChaNum} className="border border-border rounded-lg p-2.5 space-y-1.5">
                  <div className="text-xs font-semibold">{c.ChaName}</div>
                  <InfoRow label="ChaNum" value={String(c.ChaNum)} mono />
                  <InfoRow label="Class" value={String(c.ChaClass)} />
                  <InfoRow label="Level" value={String(c.ChaLevel)} />
                  <InfoRow label="Online" value={c.ChaOnline ? "Yes" : "No"} color={c.ChaOnline ? "text-emerald-500" : undefined} />
                  {c.ChaDeleted && <span className="text-red-500 text-[10px] font-medium">DELETED</span>}
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full h-7 text-xs"
                    onClick={() => setViewChaNum(c.ChaNum)}
                  >
                    View / Edit
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">No data found.</p>
          )}
        </div>
      </div>

      {/* Dialogs rendered outside the sidebar div so they portal correctly */}
      <UserDetailDialog userNum={viewUserNum} onClose={() => setViewUserNum(null)} />
      <CharacterDetailDialog chaNum={viewChaNum} onClose={() => setViewChaNum(null)} />
    </>
  );
}

/* ─────────────────────────────
   Image Lightbox
───────────────────────────── */
function Lightbox({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-9999"
      onClick={onClose}
    >
      <img
        src={src}
        alt="Attachment preview"
        className="max-h-[85vh] max-w-[90vw] rounded-xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
      <button
        className="absolute top-4 right-6 text-white/70 hover:text-white text-2xl font-bold"
        onClick={onClose}
      >
        ✕
      </button>
    </div>
  );
}

/* ─────────────────────────────
   Ticket Detail Panel
───────────────────────────── */
function TicketDetailPanel({ ticketId, onStatusChange }: {
  ticketId: number; onStatusChange: () => void;
}) {
  const [full, setFull] = useState<StaffTicketFull | null>(null);
  const [loading, setLoading] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyFiles, setReplyFiles] = useState<File[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [staffList, setStaffList] = useState<StaffListItem[]>([]);
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const base = (process.env.NEXT_PUBLIC_API_ENDPOINT_URL ?? "").replace(/\/$/, "");

  useEffect(() => {
    if (!ticketId) return;
    setLoading(true);
    setFull(null);
    setSidebarMode(null);
    Promise.all([
      getStaffTicketFull(ticketId),
      getStaffList().catch(() => [] as StaffListItem[]),
    ])
      .then(([ticketData, staff]) => { setFull(ticketData); setStaffList(staff); })
      .catch(() => toast.error("Failed to load ticket."))
      .finally(() => setLoading(false));
  }, [ticketId]);

  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const imageItems = Array.from(e.clipboardData.items).filter((item) =>
      item.type.startsWith("image/"),
    );
    if (imageItems.length === 0) return;
    e.preventDefault();
    const newFiles = imageItems.map((item) => item.getAsFile()).filter(Boolean) as File[];
    setReplyFiles((prev) => [...prev, ...newFiles]);
  }

  async function handleReply() {
    if (!replyText.trim() && replyFiles.length === 0) { toast.error("Reply cannot be empty."); return; }
    setActionLoading(true);
    try {
      await staffReply(ticketId, replyText.trim(), replyFiles);
      toast.success("Reply sent.");
      setReplyText("");
      setReplyFiles([]);
      setFull(await getStaffTicketFull(ticketId));
      onStatusChange();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleStatus(status: string) {
    setActionLoading(true);
    try {
      await updateTicketStatus(ticketId, status);
      toast.success(`Ticket ${status === "Closed" ? "closed" : "reopened"}.`);
      setFull(await getStaffTicketFull(ticketId));
      onStatusChange();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handlePriority(val: string) {
    setActionLoading(true);
    try {
      await updateTicketPriority(ticketId, val);
      toast.success(`Priority set to ${val}.`);
      setFull(await getStaffTicketFull(ticketId));
      onStatusChange();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleAssign(val: string) {
    const staffUserNum = val === "none" ? null : Number(val);
    setActionLoading(true);
    try {
      await assignTicket(ticketId, staffUserNum);
      toast.success(staffUserNum ? "Staff assigned." : "Assignment removed.");
      setFull(await getStaffTicketFull(ticketId));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed.");
    } finally {
      setActionLoading(false);
    }
  }

  function toggleSidebar(mode: SidebarMode) {
    setSidebarMode((prev) => (prev === mode ? null : mode));
  }

  if (loading) {
    return (
      <div className="flex flex-col h-full p-6 gap-3">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    );
  }
  if (!full) return null;

  const { ticket, replies } = full;

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Main content ── */}
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-border shrink-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <h2 className="font-semibold text-base truncate">{ticket.Subject}</h2>
              <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                <span>Ticket #{ticket.TicketID}</span>
                <span>{new Date(ticket.CreatedAt).toLocaleString()}</span>
                {ticket.AssignedToStaffUserNum && (
                  <span className="text-amber-500">
                    Assigned: {ticket.AssignedStaffUserID ?? `#${ticket.AssignedToStaffUserNum}`}
                  </span>
                )}
              </div>
            </div>
            {/* Action row */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <Button size="sm" variant={sidebarMode === "user" ? "default" : "outline"} className="h-7 text-xs px-2.5"
                onClick={() => toggleSidebar("user")} title="User account info">
                User
              </Button>
              <Button size="sm" variant={sidebarMode === "character" ? "default" : "outline"} className="h-7 text-xs px-2.5"
                onClick={() => toggleSidebar("character")} title="User characters">
                Characters
              </Button>

              <Select
                value={ticket.Priority ?? "Low"}
                onValueChange={handlePriority}
                disabled={actionLoading}
              >
                <SelectTrigger className={`h-7 text-xs w-28 ${priorityBadge(ticket.Priority)}`}>
                  <SelectValue placeholder="Priority…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                </SelectContent>
              </Select>

              {staffList.length > 0 && (
                <Select
                  value={ticket.AssignedToStaffUserNum ? String(ticket.AssignedToStaffUserNum) : "none"}
                  onValueChange={handleAssign}
                  disabled={actionLoading}
                >
                  <SelectTrigger className="h-7 text-xs w-32">
                    <SelectValue placeholder="Assign…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {staffList.map((s) => (
                      <SelectItem key={s.UserNum} value={String(s.UserNum)}>
                        {s.UserID}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${statusBadge(ticket.Status)}`}>
                {ticket.Status}
              </span>
              {ticket.Status !== "Closed" ? (
                <Button size="sm" variant="destructive" className="h-7 text-xs" disabled={actionLoading} onClick={() => handleStatus("Closed")}>
                  Close
                </Button>
              ) : (
                <Button size="sm" variant="outline" className="h-7 text-xs" disabled={actionLoading} onClick={() => handleStatus("Open")}>
                  Reopen
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Original */}
          <div className="rounded-xl bg-muted/30 border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Original Message</span>
              <span className="text-xs text-muted-foreground">{new Date(ticket.CreatedAt).toLocaleString()}</span>
            </div>
            <p className="text-sm whitespace-pre-wrap">{ticket.Description}</p>
            {ticket.attachments && ticket.attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {ticket.attachments.some((a) => isImagePath(a.FilePath)) && (
                  <div className="flex flex-wrap gap-2">
                    {ticket.attachments.filter((a) => isImagePath(a.FilePath)).map((a) => {
                      const url = `${base}/uploads/tickets/${a.FilePath}`;
                      return (
                        <img
                          key={a.AttachmentID}
                          src={url}
                          alt={a.FileName}
                          onClick={() => setLightboxSrc(url)}
                          className="h-20 w-24 object-cover rounded-lg border border-border cursor-pointer hover:opacity-90 transition"
                        />
                      );
                    })}
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {ticket.attachments.filter((a) => !isImagePath(a.FilePath)).map((a) => (
                    <a
                      key={a.AttachmentID}
                      href={`${base}/uploads/tickets/${a.FilePath}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      📎 {a.FileName}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Replies */}
          {replies.map((reply) => (
            <div
              key={reply.ReplyID}
              className={`rounded-xl p-4 border ${
                reply.IsStaffReply ? "bg-primary/8 border-primary/20 ml-6" : "bg-muted/20 border-border mr-6"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-semibold ${reply.IsStaffReply ? "text-primary" : "text-muted-foreground"}`}>
                  {reply.IsStaffReply ? (reply.ReplyUserID ?? "Staff") : `User #${reply.UserNum}`}
                </span>
                <span className="text-xs text-muted-foreground">{new Date(reply.CreatedAt).toLocaleString()}</span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{reply.Message}</p>

              {/* Attachments */}
              {reply.attachments && reply.attachments.length > 0 && (
                <div className="mt-3 space-y-2">
                  {/* Image thumbnails */}
                  {reply.attachments.some((a) => isImagePath(a.FilePath)) && (
                    <div className="flex flex-wrap gap-2">
                      {reply.attachments.filter((a) => isImagePath(a.FilePath)).map((a) => {
                        const url = `${base}/uploads/tickets/${a.FilePath}`;
                        return (
                          <img
                            key={a.AttachmentID}
                            src={url}
                            alt={a.FileName}
                            onClick={() => setLightboxSrc(url)}
                            className="h-20 w-24 object-cover rounded-lg border border-border cursor-pointer hover:opacity-90 transition"
                          />
                        );
                      })}
                    </div>
                  )}
                  {/* Non-image files */}
                  <div className="flex flex-wrap gap-2">
                    {reply.attachments.filter((a) => !isImagePath(a.FilePath)).map((a) => (
                      <a
                        key={a.AttachmentID}
                        href={`${base}/uploads/tickets/${a.FilePath}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        📎 {a.FileName}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {replies.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">No replies yet.</p>
          )}
        </div>

        {/* Reply Box */}
        {ticket.Status !== "Closed" && (
          <div className="px-5 py-4 border-t border-border shrink-0">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onPaste={handlePaste}
              placeholder="Type your staff reply… (you can paste images)"
              rows={3}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
            />
            {replyFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {replyFiles.map((file, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="h-16 w-20 object-cover rounded border border-border"
                    />
                    <button
                      type="button"
                      onClick={() => setReplyFiles((prev) => prev.filter((_, i) => i !== idx))}
                      className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-xs leading-none opacity-0 group-hover:opacity-100 transition"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end mt-2">
              <Button size="sm" onClick={handleReply} disabled={actionLoading || (!replyText.trim() && replyFiles.length === 0)}>
                {actionLoading ? "Sending…" : "Send Reply"}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Info Sidebar ── */}
      <InfoSidebar mode={sidebarMode} userNum={ticket.UserNum} onClose={() => setSidebarMode(null)} />

      {/* ── Lightbox ── */}
      {lightboxSrc && <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
    </div>
  );
}

/* ─────────────────────────────
   Main Section
───────────────────────────── */
function playBeep() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.type = "sine";
    oscillator.frequency.value = 800;
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.5);
  } catch {
    // AudioContext not available (SSR or restricted context)
  }
}

export function TicketSection() {
  const [tickets, setTickets] = useState<StaffTicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "priority">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Fingerprint: TicketID → UpdatedAt (for change detection)
  const fingerprintRef = useRef<Record<number, string>>({});
  const isFirstPollRef = useRef(true);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await getStaffTickets();
      setTickets(data);
      if (!selectedId && data.length > 0) {
        const first = data.find((t) => t.Status !== "Closed") ?? data[0];
        setSelectedId(first.TicketID);
      }
      // Seed the fingerprint on first load (no beep)
      const fp: Record<number, string> = {};
      data.forEach((t) => { fp[t.TicketID] = t.UpdatedAt ?? t.CreatedAt; });
      fingerprintRef.current = fp;
      isFirstPollRef.current = false;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tickets.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // Background polling — beep on new tickets or ticket updates
  useEffect(() => {
    const interval = setInterval(async () => {
      if (isFirstPollRef.current) return;
      try {
        const data = await getStaffTickets();
        const prev = fingerprintRef.current;
        let changed = false;

        for (const t of data) {
          if (!(t.TicketID in prev)) {
            changed = true; // new ticket
            break;
          }
          // UpdatedAt changes when a reply is added or status changes
          if (prev[t.TicketID] !== (t.UpdatedAt ?? t.CreatedAt)) {
            changed = true;
            break;
          }
        }

        if (changed) {
          playBeep();
          setTickets(data);
        }

        const fp: Record<number, string> = {};
        data.forEach((t) => { fp[t.TicketID] = t.UpdatedAt ?? t.CreatedAt; });
        fingerprintRef.current = fp;
      } catch {
        // Silently ignore poll errors
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const filtered = (statusFilter === "all" ? tickets : tickets.filter((t) => t.Status === statusFilter))
    .slice()
    .sort((a, b) => {
      let cmp = 0;
      if (sortBy === "date") {
        cmp = new Date(a.CreatedAt).getTime() - new Date(b.CreatedAt).getTime();
      } else {
        const pa = PRIORITY_ORDER[a.Priority?.toLowerCase()] ?? 0;
        const pb = PRIORITY_ORDER[b.Priority?.toLowerCase()] ?? 0;
        cmp = pa - pb;
      }
      return sortOrder === "asc" ? cmp : -cmp;
    });

  return (
    <div className="flex h-[calc(100vh-8rem)] rounded-xl border border-border overflow-hidden bg-card">

      {/* Left: ticket list */}
      <div className="w-72 shrink-0 flex flex-col border-r border-border">
        <div className="px-4 py-3 border-b border-border flex flex-col gap-2 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold text-sm">Support Tickets</h2>
            <div className="flex items-center gap-1">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-7 text-xs w-24"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={load} title="Refresh">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                  <path d="M21 3v5h-5" />
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                  <path d="M8 16H3v5" />
                </svg>
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as "date" | "priority")}>
              <SelectTrigger className="h-6 text-[11px] flex-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="date">By Date</SelectItem>
                <SelectItem value="priority">By Priority</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 text-xs"
              title={sortOrder === "desc" ? "Descending" : "Ascending"}
              onClick={() => setSortOrder((o) => o === "desc" ? "asc" : "desc")}
            >
              {sortOrder === "desc" ? "↓" : "↑"}
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-2">
              {[1,2,3,4,5].map((i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
            </div>
          ) : error ? (
            <p className="p-4 text-sm text-destructive">{error}</p>
          ) : filtered.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground text-center">No tickets found.</p>
          ) : (
            filtered.map((t) => (
              <TicketListItem
                key={t.TicketID}
                ticket={t}
                selected={selectedId === t.TicketID}
                onClick={() => setSelectedId(t.TicketID)}
              />
            ))
          )}
        </div>
        <div className="px-4 py-2 border-t border-border shrink-0">
          <p className="text-xs text-muted-foreground">{filtered.length} ticket(s)</p>
        </div>
      </div>

      {/* Right: detail */}
      <div className="flex-1 min-w-0 overflow-hidden">
        {selectedId ? (
          <TicketDetailPanel
            key={selectedId}
            ticketId={selectedId}
            onStatusChange={load}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">Select a ticket to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}
