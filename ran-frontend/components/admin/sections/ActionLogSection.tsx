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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getActionLogs,
  getActionTypes,
  getGmActionLogs,
  getGmActionTypes,
  type ActionLogRow,
  type ActionLogFilters,
  type GmActionLogRow,
  type GmActionLogFilters,
  type ActionLogPagination,
} from "@/lib/data/admin.actionlog.data";

/* ─────────────────────────────
   Helpers
───────────────────────────── */

function formatDate(iso: string) {
  return new Date(iso).toLocaleString();
}

function SuccessBadge({ success }: { success: boolean }) {
  return (
    <Badge variant={success ? "default" : "destructive"}>
      {success ? "OK" : "FAIL"}
    </Badge>
  );
}

function PaginationControls({
  pagination,
  onPage,
}: {
  pagination: ActionLogPagination;
  onPage: (p: number) => void;
}) {
  const totalPages = Math.ceil(pagination.total / pagination.limit);
  return (
    <div className="flex items-center justify-between pt-2 text-sm text-muted-foreground">
      <span>
        {pagination.total.toLocaleString()} total • Page {pagination.page} of{" "}
        {totalPages}
      </span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={pagination.page <= 1}
          onClick={() => onPage(pagination.page - 1)}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={pagination.page >= totalPages}
          onClick={() => onPage(pagination.page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

/* ─────────────────────────────
   User Action Log Tab
───────────────────────────── */
function UserActionLogTab() {
  const [rows, setRows] = useState<ActionLogRow[]>([]);
  const [pagination, setPagination] = useState<ActionLogPagination>({
    page: 1,
    limit: 50,
    total: 0,
  });
  const [loading, setLoading] = useState(false);
  const [actionTypes, setActionTypes] = useState<string[]>([]);

  const [filters, setFilters] = useState<ActionLogFilters>({
    page: 1,
    limit: 50,
  });
  const [draft, setDraft] = useState({
    userId: "",
    actionType: "",
    entityType: "",
    search: "",
    success: "" as "true" | "false" | "",
    dateFrom: "",
    dateTo: "",
  });

  useEffect(() => {
    getActionTypes()
      .then(setActionTypes)
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [filters]);

  async function load() {
    try {
      setLoading(true);
      const res = await getActionLogs(filters);
      setRows(res.rows);
      setPagination(res.pagination);
    } catch (err: any) {
      toast.error(err.message || "Failed to load action logs");
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    setFilters({
      ...draft,
      page: 1,
      limit: 50,
    });
  }

  function clearFilters() {
    const reset = {
      userId: "",
      actionType: "",
      entityType: "",
      search: "",
      success: "" as const,
      dateFrom: "",
      dateTo: "",
    };
    setDraft(reset);
    setFilters({ page: 1, limit: 50 });
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">User ID</Label>
          <Input
            className="h-8 text-xs"
            placeholder="numeric user id"
            value={draft.userId}
            onChange={(e) =>
              setDraft((d) => ({ ...d, userId: e.target.value }))
            }
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Action Type</Label>
          <Select
            value={draft.actionType}
            onValueChange={(v) =>
              setDraft((d) => ({ ...d, actionType: v === "__all__" ? "" : v }))
            }
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All types</SelectItem>
              {actionTypes.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Entity Type</Label>
          <Input
            className="h-8 text-xs"
            placeholder="USER, CHARACTER…"
            value={draft.entityType}
            onChange={(e) =>
              setDraft((d) => ({ ...d, entityType: e.target.value }))
            }
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Status</Label>
          <Select
            value={draft.success}
            onValueChange={(v) =>
              setDraft((d) => ({
                ...d,
                success: v === "__all__" ? "" : (v as "true" | "false"),
              }))
            }
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All</SelectItem>
              <SelectItem value="true">Success</SelectItem>
              <SelectItem value="false">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">From</Label>
          <Input
            type="date"
            className="h-8 text-xs"
            value={draft.dateFrom}
            onChange={(e) =>
              setDraft((d) => ({ ...d, dateFrom: e.target.value }))
            }
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">To</Label>
          <Input
            type="date"
            className="h-8 text-xs"
            value={draft.dateTo}
            onChange={(e) =>
              setDraft((d) => ({ ...d, dateTo: e.target.value }))
            }
          />
        </div>
        <div className="space-y-1 col-span-2">
          <Label className="text-xs">Search</Label>
          <Input
            className="h-8 text-xs"
            placeholder="Search description…"
            value={draft.search}
            onChange={(e) =>
              setDraft((d) => ({ ...d, search: e.target.value }))
            }
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={applyFilters}>
          Apply
        </Button>
        <Button size="sm" variant="outline" onClick={clearFilters}>
          Clear
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No records found.</p>
      ) : (
        <>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="text-xs text-muted-foreground">
                      {row.LogID}
                    </TableCell>
                    <TableCell className="text-xs">
                      {row.UserID ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs font-mono">
                        {row.ActionType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {row.EntityType
                        ? `${row.EntityType}${row.EntityID ? ` #${row.EntityID}` : ""}`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-xs max-w-[240px] truncate">
                      {row.Description ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {row.IPAddress ?? "—"}
                    </TableCell>
                    <TableCell>
                      <SuccessBadge success={row.Success} />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(row.CreatedAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <PaginationControls
            pagination={pagination}
            onPage={(p) => setFilters((f) => ({ ...f, page: p }))}
          />
        </>
      )}
    </div>
  );
}

/* ─────────────────────────────
   GM Action Log Tab
───────────────────────────── */
function GmActionLogTab() {
  const [rows, setRows] = useState<GmActionLogRow[]>([]);
  const [pagination, setPagination] = useState<ActionLogPagination>({
    page: 1,
    limit: 50,
    total: 0,
  });
  const [loading, setLoading] = useState(false);
  const [actionTypes, setActionTypes] = useState<string[]>([]);

  const [filters, setFilters] = useState<GmActionLogFilters>({
    page: 1,
    limit: 50,
  });
  const [draft, setDraft] = useState({
    gmUserNum: "",
    actionType: "",
    entityType: "",
    httpMethod: "",
    search: "",
    dateFrom: "",
    dateTo: "",
  });

  useEffect(() => {
    getGmActionTypes()
      .then(setActionTypes)
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [filters]);

  async function load() {
    try {
      setLoading(true);
      const res = await getGmActionLogs(filters);
      setRows(res.rows);
      setPagination(res.pagination);
    } catch (err: any) {
      toast.error(err.message || "Failed to load GM action logs");
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    setFilters({ ...draft, page: 1, limit: 50 });
  }

  function clearFilters() {
    const reset = {
      gmUserNum: "",
      actionType: "",
      entityType: "",
      httpMethod: "",
      search: "",
      dateFrom: "",
      dateTo: "",
    };
    setDraft(reset);
    setFilters({ page: 1, limit: 50 });
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">GM User #</Label>
          <Input
            className="h-8 text-xs"
            placeholder="numeric GM id"
            value={draft.gmUserNum}
            onChange={(e) =>
              setDraft((d) => ({ ...d, gmUserNum: e.target.value }))
            }
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Action Type</Label>
          <Select
            value={draft.actionType}
            onValueChange={(v) =>
              setDraft((d) => ({ ...d, actionType: v === "__all__" ? "" : v }))
            }
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All types</SelectItem>
              {actionTypes.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">HTTP Method</Label>
          <Select
            value={draft.httpMethod}
            onValueChange={(v) =>
              setDraft((d) => ({ ...d, httpMethod: v === "__all__" ? "" : v }))
            }
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All</SelectItem>
              {["GET", "POST", "PUT", "PATCH", "DELETE"].map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Entity Type</Label>
          <Input
            className="h-8 text-xs"
            placeholder="USER, CHARACTER…"
            value={draft.entityType}
            onChange={(e) =>
              setDraft((d) => ({ ...d, entityType: e.target.value }))
            }
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">From</Label>
          <Input
            type="date"
            className="h-8 text-xs"
            value={draft.dateFrom}
            onChange={(e) =>
              setDraft((d) => ({ ...d, dateFrom: e.target.value }))
            }
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">To</Label>
          <Input
            type="date"
            className="h-8 text-xs"
            value={draft.dateTo}
            onChange={(e) =>
              setDraft((d) => ({ ...d, dateTo: e.target.value }))
            }
          />
        </div>
        <div className="space-y-1 col-span-2">
          <Label className="text-xs">Search</Label>
          <Input
            className="h-8 text-xs"
            placeholder="Search description or path…"
            value={draft.search}
            onChange={(e) =>
              setDraft((d) => ({ ...d, search: e.target.value }))
            }
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={applyFilters}>
          Apply
        </Button>
        <Button size="sm" variant="outline" onClick={clearFilters}>
          Clear
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No records found.</p>
      ) : (
        <>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">ID</TableHead>
                  <TableHead>GM</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Path</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.LogID}>
                    <TableCell className="text-xs text-muted-foreground">
                      {row.LogID}
                    </TableCell>
                    <TableCell className="text-xs">
                      {row.GmUserID ?? row.GmUserNum ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs font-mono">
                        {row.ActionType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {row.HttpMethod ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs max-w-[180px] truncate text-muted-foreground">
                      {row.HttpPath ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {row.EntityType
                        ? `${row.EntityType}${row.EntityID ? ` #${row.EntityID}` : ""}`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {row.IPAddress ?? "—"}
                    </TableCell>
                    <TableCell>
                      <SuccessBadge success={row.Success} />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(row.CreatedAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <PaginationControls
            pagination={pagination}
            onPage={(p) => setFilters((f) => ({ ...f, page: p }))}
          />
        </>
      )}
    </div>
  );
}

/* ─────────────────────────────
   ActionLogSection (exported)
───────────────────────────── */
export function ActionLogSection({
  defaultTab = "user",
}: {
  defaultTab?: "user" | "gm";
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Action Logs</CardTitle>
        <CardDescription>
          Audit trail for user and GM/admin actions on the server.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={defaultTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="user">User Action Log</TabsTrigger>
            <TabsTrigger value="gm">GM Action Log</TabsTrigger>
          </TabsList>
          <TabsContent value="user">
            <UserActionLogTab />
          </TabsContent>
          <TabsContent value="gm">
            <GmActionLogTab />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
