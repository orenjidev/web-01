"use client";

import { useEffect, useRef, useState } from "react";
import TicketList from "@/components/tickets/TicketList";
import Link from "next/link";
import { getMyTickets, TicketItem } from "@/lib/data/ticket.data";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Ban, PlusCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function TicketsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const isAuthed = Boolean(user);
  const shown = useRef(false);

  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const ticketsPerPage = 5;

  useEffect(() => {
    if (!authLoading && !isAuthed && !shown.current) {
      toast.error("You must login first before you can view this page.");
      shown.current = true;
      router.replace("/login");
    }
  }, [authLoading, isAuthed]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthed) return;

    async function load() {
      try {
        const data = await getMyTickets();
        setTickets(data);
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [authLoading, isAuthed, router]);

  if (!isAuthed) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4">
        <Card>
          <CardContent className="flex flex-col items-center text-center py-12 space-y-4">
            <Ban size={56} className="opacity-50" />
            <h1 className="text-xl font-semibold">Forbidden Access</h1>
            <p className="text-muted-foreground text-sm">
              Login first to see content.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalPages = Math.ceil(tickets.length / ticketsPerPage);
  const startIndex = (currentPage - 1) * ticketsPerPage;
  const paginatedTickets = tickets.slice(
    startIndex,
    startIndex + ticketsPerPage,
  );

  const openCount = tickets.filter((t) => t.status === "Open").length;
  const closedCount = tickets.filter((t) => t.status === "Closed").length;

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold uppercase">My Support Tickets</h1>
          <p className="text-sm text-muted-foreground">
            Monitor your requests and follow up on staff responses.
          </p>
        </div>

        <Button asChild className="h-9 gap-2 self-start sm:self-auto">
          <Link href="/tickets/new">
            <PlusCircle size={14} />
            Create Ticket
          </Link>
        </Button>
      </div>

      {/* Stats */}
      {!loading && tickets.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                Total
              </p>
              <p className="text-2xl font-bold mt-1 tabular-nums">{tickets.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                Open
              </p>
              <p className="text-2xl font-bold mt-1 tabular-nums text-emerald-500">
                {openCount}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                Closed
              </p>
              <p className="text-2xl font-bold mt-1 tabular-nums text-muted-foreground">
                {closedCount}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Ticket List */}
      <Card>
        <CardContent className="p-5 space-y-4">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-14 space-y-3">
              <h3 className="text-base font-semibold">You have no tickets yet</h3>
              <p className="text-muted-foreground text-sm">
                Need assistance? Create your first support ticket.
              </p>
              <Button asChild className="mt-2 h-9 gap-2">
                <Link href="/tickets/new">
                  <PlusCircle size={14} />
                  Create Ticket
                </Link>
              </Button>
            </div>
          ) : (
            <>
              <TicketList tickets={paginatedTickets} loading={false} />

              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                  >
                    Previous
                  </Button>

                  <span className="text-xs text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
