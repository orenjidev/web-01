"use client";

import Link from "next/link";
import { TicketItem } from "@/lib/data/ticket.data";

interface Props {
  tickets: TicketItem[];
  loading?: boolean;
}

export default function TicketList({ tickets, loading }: Props) {
  if (loading) return <p>Loading tickets...</p>;
  if (!tickets.length) return <p>No tickets found.</p>;

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

  function formatTicketNumber(id: number) {
    return `#${id.toString().padStart(6, "0")}`;
  }
  return (
    <div className="flex flex-col gap-4">
      {tickets.map((ticket) => (
        <Link key={ticket.id} href={`/tickets/${ticket.id}`}>
          <div className="group rounded-xl border bg-background transition-all duration-200 hover:bg-muted/40 cursor-pointer p-5">
            <div className="flex items-start justify-between gap-6">
              <div className="flex flex-col gap-3 flex-1">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-mono text-muted-foreground tracking-wide">
                    {formatTicketNumber(ticket.id)}
                  </span>

                  <h3 className="text-base font-semibold leading-snug transition-colors group-hover:text-foreground">
                    {ticket.subject}
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-5 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wide opacity-60">
                      Category
                    </span>
                    <span className="font-medium text-foreground/80">
                      {ticket.category}
                    </span>
                  </div>

                  <div className="h-4 w-px bg-border" />

                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wide opacity-60">
                      Created
                    </span>
                    <span className="font-medium text-foreground/80">
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

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
      ))}
    </div>
  );
}
