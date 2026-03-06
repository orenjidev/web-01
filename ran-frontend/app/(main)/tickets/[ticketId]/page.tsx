"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePublicConfig } from "@/context/PublicConfigContext";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Ban } from "lucide-react";
import {
  getTicketDetail,
  replyToTicket,
  TicketDetail,
} from "@/lib/data/ticket.data";
import { markTicketAsRead } from "@/components/tickets/TicketList";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useT } from "@/context/LanguageContext";

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = Number(params.ticketId);

  const { user, loading: authLoading } = useAuth();
  const { config } = usePublicConfig();
  const t = useT();
  const isAuthed = Boolean(user);
  const shown = useRef(false);

  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [replyFiles, setReplyFiles] = useState<File[]>([]);

  const repliesPerPage = 5;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!authLoading && !isAuthed && !shown.current) {
      toast.error("You must login first before viewing this ticket.");
      shown.current = true;
      router.replace("/login");
    }
  }, [authLoading, isAuthed]);

  useEffect(() => {
    if (authLoading || !isAuthed) return;
    if (config?.features.ticketSystem === false) {
      setLoading(false);
      return;
    }

    async function load() {
      const data = await getTicketDetail(ticketId);
      if (!data) return;

      setTicket(data);
      markTicketAsRead(ticketId);

      const sorted = [...data.replies].sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );

      const totalPages = Math.max(1, Math.ceil(sorted.length / repliesPerPage));

      setCurrentPage(totalPages);
      setLoading(false);
    }

    if (ticketId) load();
  }, [ticketId, authLoading, isAuthed, config]);

  async function handleReply() {
    if (!ticket) return;
    if (!reply.trim() && replyFiles.length === 0) {
      toast.error("Please write a message or attach a file.");
      return;
    }

    setSending(true);

    try {
      await replyToTicket(ticketId, reply, replyFiles);
      toast.success("Reply sent successfully.");

      setReply("");
      setReplyFiles([]);
      setPreviewImage(null);

      const updated = await getTicketDetail(ticketId);

      if (updated) {
        setTicket(updated);

        const sorted = [...updated.replies].sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        );

        const totalPages = Math.max(
          1,
          Math.ceil(sorted.length / repliesPerPage),
        );

        setCurrentPage(totalPages);
      }
    } catch {
      toast.error("Failed to send reply.");
    } finally {
      setSending(false);
    }
  }

  if (!isAuthed) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4">
        <Card>
          <CardContent className="flex flex-col items-center text-center py-12 space-y-3">
            <Ban size={56} className="opacity-60" />
            <h1 className="text-xl font-semibold">{t.notFound.title}</h1>
            <p className="text-muted-foreground">{t.notFound.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!loading && config?.features.ticketSystem === false) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4">
        <Card>
          <CardContent className="flex flex-col items-center text-center py-12 space-y-3">
            <Ban size={56} className="opacity-60" />
            <h1 className="text-xl font-semibold">{t.common.featureUnavailable}</h1>
            <p className="text-muted-foreground">{t.common.featureUnavailableDesc}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (authLoading || loading)
    return <p className="max-w-4xl mx-auto py-10">{t.common.loading}</p>;

  if (!ticket)
    return <p className="max-w-4xl mx-auto py-10">{t.tickets.ticketNotFound}</p>;

  const isClosed = ticket.status === "Closed";

  function formatTicketNumber(id: number) {
    return `#${id.toString().padStart(6, "0")}`;
  }

  const sortedReplies = [...ticket.replies].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );

  const totalReplies = sortedReplies.length;
  const totalPages = Math.max(1, Math.ceil(totalReplies / repliesPerPage));

  const paginatedReplies = sortedReplies.slice(
    (currentPage - 1) * repliesPerPage,
    currentPage * repliesPerPage,
  );

  const base =
    process.env.NEXT_PUBLIC_API_ENDPOINT_URL?.replace(/\/$/, "") || "";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back + Status */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft size={18} />
          {t.tickets.back}
        </button>

        <span
          className={`px-3 py-1 rounded-full text-xs font-medium border ${
            ticket.status === "Closed"
              ? "bg-red-500/10 text-red-500 border-red-500/20"
              : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
          }`}
        >
          {ticket.status}
        </span>
      </div>

      {/* Header */}
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground font-mono">
          {formatTicketNumber(ticket.id)}
        </p>
        <h1 className="text-2xl font-bold uppercase">{ticket.subject}</h1>
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm border rounded-xl p-5 bg-muted/20">
        <div>
          <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">{t.tickets.priority}</p>
          <p className="font-medium mt-0.5">{ticket.priority}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">{t.tickets.gameId}</p>
          <p className="font-medium mt-0.5">{ticket.gameId || "N/A"}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">{t.tickets.createdAt}</p>
          <p className="font-medium mt-0.5">
            {new Date(ticket.created_at).toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">{t.tickets.closedAt}</p>
          <p className="font-medium mt-0.5">
            {ticket.closed_at
              ? new Date(ticket.closed_at).toLocaleString()
              : "—"}
          </p>
        </div>
      </div>

      {/* Original Message */}
      <Card>
        <CardContent className="p-5 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t.tickets.description}
          </h3>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {ticket.description}
          </p>

          {ticket.attachments?.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {ticket.attachments.map((a) => {
                const fileUrl = `${base}/uploads/tickets/${a.filePath}`;
                const isImage = a.fileType.startsWith("image/");

                return isImage ? (
                  <img
                    key={a.id}
                    src={fileUrl}
                    loading="lazy"
                    onClick={() => setPreviewImage(fileUrl)}
                    onError={(e) =>
                      ((e.currentTarget as HTMLImageElement).style.display =
                        "none")
                    }
                    className="rounded-lg cursor-pointer object-cover h-28 w-full border hover:opacity-90 transition"
                  />
                ) : (
                  <a
                    key={a.id}
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs underline text-primary"
                  >
                    {a.fileName}
                  </a>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conversation */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t.tickets.conversation}
        </h3>

        {paginatedReplies.map((r) => (
          <div
            key={r.id}
            className={`flex ${
              r.isStaffReply ? "justify-start" : "justify-end"
            }`}
          >
            <div
              className={`max-w-lg px-5 py-4 rounded-xl border ${
                r.isStaffReply
                  ? "bg-muted/40"
                  : "bg-primary text-primary-foreground"
              }`}
            >
              <p className={`text-xs font-semibold mb-2 ${r.isStaffReply ? "text-muted-foreground" : "opacity-70"}`}>
                {r.isStaffReply ? `${t.tickets.support}${r.replyUserID ? ` • ${r.replyUserID}` : ""}` : t.tickets.you}
              </p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {r.message}
              </p>

              {r.attachments?.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {r.attachments.map((a) => {
                    const fileUrl = `${base}/uploads/tickets/${a.filePath}`;
                    const isImage = a.fileType.startsWith("image/");

                    return isImage ? (
                      <img
                        key={a.id}
                        src={fileUrl}
                        loading="lazy"
                        onClick={() => setPreviewImage(fileUrl)}
                        onError={(e) =>
                          ((e.currentTarget as HTMLImageElement).style.display =
                            "none")
                        }
                        className="rounded-lg cursor-pointer object-cover h-24 w-full border hover:opacity-90 transition"
                      />
                    ) : (
                      <a
                        key={a.id}
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs underline text-primary"
                      >
                        {a.fileName}
                      </a>
                    );
                  })}
                </div>
              )}

              <span className="block mt-3 text-xs opacity-60">
                {new Date(r.created_at).toLocaleString()}
              </span>
            </div>
          </div>
        ))}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t pt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              {t.common.previous}
            </Button>

            <span className="text-xs text-muted-foreground">
              {t.common.page} {currentPage} {t.common.of} {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              {t.common.next}
            </Button>
          </div>
        )}
      </div>

      {/* Reply */}
      {!isClosed && (
        <Card>
          <CardContent className="p-5 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t.tickets.reply}
            </h3>

            <textarea
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              rows={3}
              placeholder={t.tickets.replyPlaceholder}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onPaste={(e) => {
                const items = Array.from(e.clipboardData.items);
                const imageItems = items.filter((item) =>
                  item.type.startsWith("image/"),
                );
                if (imageItems.length === 0) return;
                e.preventDefault();
                const files = imageItems
                  .map((item) => item.getAsFile())
                  .filter(Boolean) as File[];
                setReplyFiles((prev) => [...prev, ...files]);
                toast.success(
                  `${files.length} image${files.length > 1 ? "s" : ""} pasted.`,
                );
              }}
            />

            {replyFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {replyFiles.map((f, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={URL.createObjectURL(f)}
                      alt={f.name}
                      className="h-16 w-20 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setReplyFiles((prev) => prev.filter((_, idx) => idx !== i))
                      }
                      className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full w-4 h-4 text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end">
              <Button
                onClick={handleReply}
                disabled={sending}
                className="h-9 gap-2"
              >
                {sending ? t.common.sending : t.tickets.submit}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {previewImage && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setPreviewImage(null)}
        >
          <img
            src={previewImage}
            alt="Preview"
            className="max-h-[85vh] max-w-[90vw] rounded-xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}
