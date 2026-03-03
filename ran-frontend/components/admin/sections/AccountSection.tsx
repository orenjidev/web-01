"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import md5 from "md5";
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
  searchUsers,
  createUser,
  getUser,
  updateUser,
  forceOffline,
  type UserRow,
  type UserDetail,
  type UserSearchBy,
  type UpdateUserPayload,
} from "@/lib/data/admin.account.data";

/** Replicates backend encodePassword: MD5(plain.trim()) → hex → UPPERCASE → first 19 chars */
function hashPassword(plain: string): string {
  return md5(plain.trim()).toUpperCase().substring(0, 19);
}

const USER_TYPE_LABELS: Record<number, string> = {
  0: "Player",
  50: "Staff",
  100: "GM",
  255: "Super Admin",
};

function getUserTypeBadge(type: number) {
  if (type >= 100) return "bg-red-500/10 text-red-500 border-red-500/20";
  if (type >= 50) return "bg-amber-500/10 text-amber-500 border-amber-500/20";
  return "bg-muted/40 text-muted-foreground border-border";
}

/* ─────────────────────────────
   Create User Dialog
───────────────────────────── */
function CreateUserDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    userId: "",
    pass: "",
    pass2: "",
    email: "",
    userType: "0",
    chaRemain: "4",
    userPoint: "0",
  });
  const [loading, setLoading] = useState(false);
  const [useMd5Pass, setUseMd5Pass] = useState(true);
  const [useMd5Pass2, setUseMd5Pass2] = useState(true);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.userId || !form.pass || !form.pass2) {
      toast.error("Username, password, and secondary password are required.");
      return;
    }
    setLoading(true);
    try {
      await createUser({
        userId: form.userId,
        pass: useMd5Pass ? hashPassword(form.pass) : form.pass,
        pass2: useMd5Pass2 ? hashPassword(form.pass2) : form.pass2,
        email: form.email,
        userType: Number(form.userType),
        chaRemain: Number(form.chaRemain),
        userPoint: Number(form.userPoint),
      });
      toast.success("User created successfully.");
      setForm({ userId: "", pass: "", pass2: "", email: "", userType: "0", chaRemain: "4", userPoint: "0" });
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create user.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 pt-2">
          <div className="space-y-1">
            <Label>Username <span className="text-destructive">*</span></Label>
            <Input placeholder="username" value={form.userId} onChange={set("userId")} autoComplete="off" />
          </div>
          <div className="space-y-1">
            <Label>Password <span className="text-destructive">*</span></Label>
            <div className="flex gap-2">
              <Input type="password" placeholder="password" value={form.pass} onChange={set("pass")} className="flex-1" />
              <Button type="button" size="sm" variant={useMd5Pass ? "default" : "outline"} onClick={() => setUseMd5Pass((v) => !v)} title="Toggle MD5 hashing">
                MD5
              </Button>
            </div>
          </div>
          <div className="space-y-1">
            <Label>Secondary Password <span className="text-destructive">*</span></Label>
            <div className="flex gap-2">
              <Input type="password" placeholder="secondary password" value={form.pass2} onChange={set("pass2")} className="flex-1" />
              <Button type="button" size="sm" variant={useMd5Pass2 ? "default" : "outline"} onClick={() => setUseMd5Pass2((v) => !v)} title="Toggle MD5 hashing">
                MD5
              </Button>
            </div>
          </div>
          <div className="space-y-1">
            <Label>Email</Label>
            <Input type="email" placeholder="user@example.com" value={form.email} onChange={set("email")} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label>User Type</Label>
              <Input type="number" value={form.userType} onChange={set("userType")} min={0} max={255} />
            </div>
            <div className="space-y-1">
              <Label>Char Slots</Label>
              <Input type="number" value={form.chaRemain} onChange={set("chaRemain")} min={0} max={10} />
            </div>
            <div className="space-y-1">
              <Label>EPoints</Label>
              <Input type="number" value={form.userPoint} onChange={set("userPoint")} min={0} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating…" : "Create User"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────────────────────
   User Detail Dialog
───────────────────────────── */

type UserTab = "info" | "edit";

const USER_TABS: { key: UserTab; label: string }[] = [
  { key: "info", label: "Info" },
  { key: "edit", label: "Edit" },
];

export function UserDetailDialog({
  userNum,
  onClose,
}: {
  userNum: number | null;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [tab, setTab] = useState<UserTab>("info");
  const [actionLoading, setActionLoading] = useState(false);
  const [useMd5Pass, setUseMd5Pass] = useState(true);
  const [useMd5Pass2, setUseMd5Pass2] = useState(true);

  const [editForm, setEditForm] = useState({
    userEmail: "",
    userPass: "",
    userPass2: "",
    userType: "",
    chaRemain: "",
    userPoint: "",
    userBlock: "",
    userBlockDate: "",
    chatBlockDate: "",
    premiumDate: "",
    userLoginState: "",
    userAvailable: "",
  });

  const open = userNum !== null;

  useEffect(() => {
    if (!open || !userNum) return;
    setLoadingDetail(true);
    setDetail(null);
    setTab("info");
    getUser(userNum)
      .then((d) => {
        setDetail(d);
        setEditForm({
          userEmail: d.UserEmail ?? "",
          userPass: "",
          userPass2: "",
          userType: String(d.UserType),
          chaRemain: String(d.ChaRemain),
          userPoint: String(d.UserPoint),
          userBlock: String(d.UserBlock),
          userBlockDate: d.UserBlockDate ? d.UserBlockDate.slice(0, 16) : "",
          chatBlockDate: d.ChatBlockDate ? d.ChatBlockDate.slice(0, 16) : "",
          premiumDate: d.PremiumDate ? d.PremiumDate.slice(0, 16) : "",
          userLoginState: String(d.UserLoginState),
          userAvailable: String(d.UserAvailable),
        });
      })
      .catch(() => toast.error("Failed to load user."))
      .finally(() => setLoadingDetail(false));
  }, [open, userNum]);

  const setF = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setEditForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!userNum) return;
    setActionLoading(true);
    try {
      const payload: UpdateUserPayload = {};
      if (editForm.userEmail !== "") payload.userEmail = editForm.userEmail;
      if (editForm.userPass !== "") payload.userPass = useMd5Pass ? hashPassword(editForm.userPass) : editForm.userPass;
      if (editForm.userPass2 !== "") payload.userPass2 = useMd5Pass2 ? hashPassword(editForm.userPass2) : editForm.userPass2;
      if (editForm.userType !== "") payload.userType = Number(editForm.userType);
      if (editForm.chaRemain !== "") payload.chaRemain = Number(editForm.chaRemain);
      if (editForm.userPoint !== "") payload.userPoint = Number(editForm.userPoint);
      if (editForm.userBlock !== "") payload.userBlock = Number(editForm.userBlock);
      if (editForm.userLoginState !== "") payload.userLoginState = Number(editForm.userLoginState);
      if (editForm.userAvailable !== "") payload.userAvailable = Number(editForm.userAvailable);
      payload.userBlockDate = editForm.userBlockDate ? new Date(editForm.userBlockDate).toISOString() : null;
      payload.chatBlockDate = editForm.chatBlockDate ? new Date(editForm.chatBlockDate).toISOString() : null;
      payload.premiumDate = editForm.premiumDate ? new Date(editForm.premiumDate).toISOString() : null;
      await updateUser(userNum, payload);
      toast.success("User updated.");
      const fresh = await getUser(userNum);
      setDetail(fresh);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update user.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleForceOffline() {
    if (!userNum) return;
    setActionLoading(true);
    try {
      await forceOffline(userNum);
      toast.success("User forced offline.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed.");
    } finally {
      setActionLoading(false);
    }
  }

  function handleClose() {
    setDetail(null);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-lg max-h-[88vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-border shrink-0">
          <DialogTitle>
            {detail ? `User: ${detail.UserID}` : "User Detail"}
          </DialogTitle>
          {detail && (
            <p className="text-xs text-muted-foreground">
              UserNum: <span className="font-mono">{detail.UserNum}</span>
              {" · "}Type: {USER_TYPE_LABELS[detail.UserType] ?? `Type ${detail.UserType}`}
              {" · "}
              {detail.UserLoginState
                ? <span className="text-emerald-500">Online</span>
                : <span className="text-muted-foreground">Offline</span>}
            </p>
          )}
        </DialogHeader>

        {/* Tab bar */}
        <div className="flex gap-1 px-6 pt-3 pb-0 border-b border-border shrink-0">
          {USER_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 text-sm font-medium rounded-t-md transition-colors -mb-px border-b-2 ${
                tab === t.key
                  ? "border-primary text-foreground bg-background"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loadingDetail ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-6 w-full" />)}
            </div>
          ) : detail ? (
            <>
              {/* ── Info Tab ── */}
              {tab === "info" && (
                <div className="space-y-4 text-sm">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                    <div><span className="text-muted-foreground">UserNum:</span> <span className="font-mono">{detail.UserNum}</span></div>
                    <div><span className="text-muted-foreground">Username:</span> {detail.UserID}</div>
                    <div><span className="text-muted-foreground">Email:</span> {detail.UserEmail || "—"}</div>
                    <div><span className="text-muted-foreground">Type:</span> {USER_TYPE_LABELS[detail.UserType] ?? detail.UserType}</div>
                    <div><span className="text-muted-foreground">EPoints:</span> {detail.UserPoint?.toLocaleString()}</div>
                    <div><span className="text-muted-foreground">Char Slots:</span> {detail.ChaRemain}</div>
                    <div><span className="text-muted-foreground">Online:</span> {detail.UserLoginState ? "Yes" : "No"}</div>
                    <div><span className="text-muted-foreground">Available:</span> {detail.UserAvailable ? "Yes" : "No"}</div>
                    <div><span className="text-muted-foreground">Blocked:</span> {detail.UserBlock ? "Yes" : "No"}</div>
                    {detail.UserBlockDate && (
                      <div className="col-span-2"><span className="text-muted-foreground">Block Until:</span> {new Date(detail.UserBlockDate).toLocaleString()}</div>
                    )}
                    {detail.ChatBlockDate && (
                      <div className="col-span-2"><span className="text-muted-foreground">Chat Block:</span> {new Date(detail.ChatBlockDate).toLocaleString()}</div>
                    )}
                    {detail.PremiumDate && (
                      <div className="col-span-2"><span className="text-muted-foreground">Premium Until:</span> {new Date(detail.PremiumDate).toLocaleString()}</div>
                    )}
                    {detail.LastLoginDate && (
                      <div className="col-span-2"><span className="text-muted-foreground">Last Login:</span> {new Date(detail.LastLoginDate).toLocaleString()}</div>
                    )}
                  </div>

                  <div className="border-t border-border pt-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Actions</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleForceOffline}
                      disabled={actionLoading}
                    >
                      Force Offline
                    </Button>
                  </div>
                </div>
              )}

              {/* ── Edit Tab ── */}
              {tab === "edit" && (
                <form onSubmit={handleUpdate} className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 space-y-1">
                      <Label>Email</Label>
                      <Input type="email" value={editForm.userEmail} onChange={setF("userEmail")} placeholder="user@example.com" />
                    </div>
                    <div className="space-y-1">
                      <Label>New Password</Label>
                      <div className="flex gap-2">
                        <Input type="text" value={editForm.userPass} onChange={setF("userPass")} placeholder="leave blank to keep" className="flex-1" autoComplete="off" />
                        <Button type="button" size="sm" variant={useMd5Pass ? "default" : "outline"} onClick={() => setUseMd5Pass((v) => !v)} title="Toggle MD5 hashing">MD5</Button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label>New Sec. Password</Label>
                      <div className="flex gap-2">
                        <Input type="text" value={editForm.userPass2} onChange={setF("userPass2")} placeholder="leave blank to keep" className="flex-1" autoComplete="off" />
                        <Button type="button" size="sm" variant={useMd5Pass2 ? "default" : "outline"} onClick={() => setUseMd5Pass2((v) => !v)} title="Toggle MD5 hashing">MD5</Button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label>User Type</Label>
                      <Input type="number" value={editForm.userType} onChange={setF("userType")} min={0} max={255} />
                    </div>
                    <div className="space-y-1">
                      <Label>Char Slots</Label>
                      <Input type="number" value={editForm.chaRemain} onChange={setF("chaRemain")} min={0} max={10} />
                    </div>
                    <div className="space-y-1">
                      <Label>EPoints</Label>
                      <Input type="number" value={editForm.userPoint} onChange={setF("userPoint")} min={0} />
                    </div>
                    <div className="space-y-1">
                      <Label>User Block <span className="text-muted-foreground font-normal">(0/1)</span></Label>
                      <Input type="number" value={editForm.userBlock} onChange={setF("userBlock")} min={0} max={1} />
                    </div>
                    <div className="space-y-1">
                      <Label>Login State <span className="text-muted-foreground font-normal">(0/1)</span></Label>
                      <Input type="number" value={editForm.userLoginState} onChange={setF("userLoginState")} min={0} max={1} />
                    </div>
                    <div className="space-y-1">
                      <Label>Available <span className="text-muted-foreground font-normal">(0/1)</span></Label>
                      <Input type="number" value={editForm.userAvailable} onChange={setF("userAvailable")} min={0} max={1} />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label>Block Until</Label>
                      <Input type="datetime-local" value={editForm.userBlockDate} onChange={setF("userBlockDate")} />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label>Chat Block Until</Label>
                      <Input type="datetime-local" value={editForm.chatBlockDate} onChange={setF("chatBlockDate")} />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label>Premium Until</Label>
                      <Input type="datetime-local" value={editForm.premiumDate} onChange={setF("premiumDate")} />
                    </div>
                  </div>
                  <div className="flex justify-end pt-1">
                    <Button type="submit" disabled={actionLoading}>
                      {actionLoading ? "Saving…" : "Save Changes"}
                    </Button>
                  </div>
                </form>
              )}
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────────────────────
   Main Section
───────────────────────────── */
export function AccountSection({ defaultOpenCreate = false }: { defaultOpenCreate?: boolean }) {
  const [searchBy, setSearchBy] = useState<UserSearchBy>("all");
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(defaultOpenCreate);
  const [selectedUserNum, setSelectedUserNum] = useState<number | null>(null);

  async function loadUsers(by: UserSearchBy, q?: string) {
    setLoading(true);
    try {
      setRows(await searchUsers(by, q, 100));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Search failed.");
    } finally {
      setLoading(false);
    }
  }

  // Auto-load all users on mount
  useEffect(() => { loadUsers("all", undefined); }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    loadUsers(searchBy, query || undefined);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Manage Accounts</CardTitle>
              <CardDescription>Search and manage player accounts</CardDescription>
            </div>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              + Create User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2 mb-4">
            <Select value={searchBy} onValueChange={(v) => setSearchBy(v as UserSearchBy)}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="userId">Username</SelectItem>
                <SelectItem value="userNum">UserNum</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="pcid">PCID</SelectItem>
                <SelectItem value="type">User Type</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder={searchBy === "all" ? "Search all…" : `Search by ${searchBy}…`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={loading}>
              {loading ? "Searching…" : "Search"}
            </Button>
          </form>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No accounts found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">UserNum</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Username</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Email</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Type</th>
                    <th className="px-3 py-2 text-center font-medium text-muted-foreground">Online</th>
                    <th className="px-3 py-2 text-center font-medium text-muted-foreground">Blocked</th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.UserNum} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{row.UserNum}</td>
                      <td className="px-3 py-2 font-medium">{row.UserID}</td>
                      <td className="px-3 py-2 text-muted-foreground">{row.UserEmail || "—"}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-xs font-medium ${getUserTypeBadge(row.UserType)}`}>
                          {USER_TYPE_LABELS[row.UserType] ?? `Type ${row.UserType}`}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        {row.UserLoginState ? (
                          <span className="text-emerald-500">●</span>
                        ) : (
                          <span className="text-muted-foreground/40">●</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {row.UserBlock ? (
                          <span className="text-red-500 text-xs font-medium">Yes</span>
                        ) : (
                          <span className="text-muted-foreground text-xs">No</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedUserNum(row.UserNum)}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-2 text-xs text-muted-foreground text-right">{rows.length} result(s)</p>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateUserDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => loadUsers(searchBy, query || undefined)}
      />
      <UserDetailDialog
        userNum={selectedUserNum}
        onClose={() => setSelectedUserNum(null)}
      />
    </div>
  );
}
