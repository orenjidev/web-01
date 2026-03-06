"use client";

import Link from "next/link";
import { TicketItem } from "@/lib/data/ticket.data";

/* ─────────────────────────────
   Unread tracking (localStorage)
───────────────────────────── */
const READ_KEY = "ran_user_ticket_read";

function getReadMap(): Record<number, string> {
  try {
    return JSON.parse(localStorage.getItem(READ_KEY) || "{}");
  } catch {
    return {};
  }
}

export function markTicketAsRead(ticketId: number) {
  const map = getReadMap();
  map[ticketId] = new Date().toISOString();
  localStorage.setItem(READ_KEY, JSON.stringify(map));
}

function isUnread(ticket: TicketItem): boolean {
  // Only mark as unread if the last reply was from staff
  if (!ticket.lastReplyIsStaff) return false;
  if (!ticket.lastReplyAt) return false;
  const map = getReadMap();
  const lastRead = map[ticket.id];
  if (!lastRead) return true;
  return new Date(ticket.lastReplyAt).getTime() > new Date(lastRead).getTime();
}

/* ─────────────────────────────
   Helpers
───────────────────────────── */
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function getStatusStyle(status: string) {
  switch (status) {
    case "Open":
      return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    case "Closed":
      return "bg-red-500/10 text-red-500 border-red-500/20";
    case "Pending":
      return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

function priorityColor(priority: string) {
  switch (priority?.toLowerCase()) {
    case "critical":
      return "text-purple-500";
    case "high":
      return "text-red-500";
    case "medium":
      return "text-amber-500";
    default:
      return "";
  }
}

function formatTicketNumber(id: number) {
  return `#${id.toString().padStart(6, "0")}`;
}

/* ─────────────────────────────
   Component
───────────────────────────── */
interface Props {
  tickets: TicketItem[];
  loading?: boolean;
}

export default function TicketList({ tickets, loading }: Props) {
  if (loading) return <p>Loading tickets...</p>;
  if (!tickets.length) return <p>No tickets found.</p>;

  return (
    <div className="flex flex-col gap-4">
      {tickets.map((ticket) => {
        const unread = isUnread(ticket);
        const lastActivity = ticket.lastReplyAt ?? ticket.updated_at;
        const pColor = priorityColor(ticket.priority);

        return (
          <Link key={ticket.id} href={`/tickets/${ticket.id}`}>
            <div
              className={`group rounded-xl border transition-all duration-200 hover:bg-muted/40 cursor-pointer p-5 ${
                unread
                  ? "bg-primary/5 border-blue-500/30"
                  : "bg-background"
              }`}
            >
              <div className="flex items-start justify-between gap-6">
                <div className="flex flex-col gap-3 flex-1 min-w-0">
                  {/* Ticket number + subject */}
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-mono text-muted-foreground tracking-wide">
                      {formatTicketNumber(ticket.id)}
                    </span>
                    <div className="flex items-center gap-2">
                      {unread && (
                        <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                      )}
                      <h3
                        className={`text-base leading-snug transition-colors group-hover:text-foreground truncate ${
                          unread ? "font-bold" : "font-semibold"
                        }`}
                      >
                        {ticket.subject}
                      </h3>
                    </div>
                  </div>

                  {/* Meta row */}
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground/80 text-xs">
                      {ticket.category}
                    </span>

                    <span className="h-3.5 w-px bg-border" />

                    {/* Last activity */}
                    <span className="text-xs">
                      {timeAgo(lastActivity)}
                    </span>

                    {/* Reply count */}
                    {ticket.replyCount > 0 && (
                      <>
                        <span className="h-3.5 w-px bg-border" />
                        <span className="text-xs">
                          {ticket.replyCount} {ticket.replyCount === 1 ? "reply" : "replies"}
                        </span>
                      </>
                    )}

                    {/* Priority */}
                    {pColor && (
                      <>
                        <span className="h-3.5 w-px bg-border" />
                        <span className={`text-xs font-medium ${pColor}`}>
                          {ticket.priority}
                        </span>
                      </>
                    )}

                    {/* Staff replied indicator */}
                    {unread && (
                      <>
                        <span className="h-3.5 w-px bg-border" />
                        <span className="text-xs font-medium text-blue-500">
                          Staff replied
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Status badge */}
                <div className="shrink-0">
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusStyle(
                      ticket.status,
                    )}`}
                  >
                    {ticket.status}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
