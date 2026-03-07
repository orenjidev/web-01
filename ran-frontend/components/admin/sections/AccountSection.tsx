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
  getUserBank,
  getTakenBankItems,
  insertUserBank,
  clearUserBank,
  setBankItemTaken,
  type UserRow,
  type UserDetail,
  type UserSearchBy,
  type UpdateUserPayload,
  type BankItem,
} from "@/lib/data/admin.account.data";
import {
  getShopItems,
  type ShopItem,
} from "@/lib/data/admin.shop.data";
import { en } from "@/lib/i18n/locales/en";

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
        pass: form.pass,
        pass2: form.pass2,
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
              <Input placeholder="password" value={form.pass} onChange={set("pass")} className="flex-1" autoComplete="off" />
              <Button type="button" size="sm" variant="outline" onClick={() => setForm((f) => ({ ...f, pass: hashPassword(f.pass) }))} title="Convert to MD5">
                MD5
              </Button>
            </div>
          </div>
          <div className="space-y-1">
            <Label>Secondary Password <span className="text-destructive">*</span></Label>
            <div className="flex gap-2">
              <Input placeholder="secondary password" value={form.pass2} onChange={set("pass2")} className="flex-1" autoComplete="off" />
              <Button type="button" size="sm" variant="outline" onClick={() => setForm((f) => ({ ...f, pass2: hashPassword(f.pass2) }))} title="Convert to MD5">
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

type UserTab = "info" | "edit" | "bank";

const USER_TABS: { key: UserTab; label: string }[] = [
  { key: "info", label: "Info" },
  { key: "edit", label: "Edit" },
  { key: "bank", label: "Bank" },
];

export function UserDetailDialog({
  userNum,
  onClose,
}: {
  userNum: number | null;
  onClose: () => void;
}) {
  const t = en;
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [tab, setTab] = useState<UserTab>("info");
  const [actionLoading, setActionLoading] = useState(false);
  const [bankItems, setBankItems] = useState<BankItem[]>([]);
  const [takenItems, setTakenItems] = useState<BankItem[]>([]);
  const [bankSubTab, setBankSubTab] = useState<"pending" | "taken">("pending");
  const [bankLoading, setBankLoading] = useState(false);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [selectedProductNum, setSelectedProductNum] = useState<string>("");
  const [insertLoading, setInsertLoading] = useState(false);

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
          userPass: d.UserPass ?? "",
          userPass2: d.UserPass2 ?? "",
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

  useEffect(() => {
    if (tab !== "bank" || !detail) return;
    setBankLoading(true);
    Promise.all([getUserBank(detail.UserID), getTakenBankItems(detail.UserID), getShopItems()])
      .then(([bank, taken, items]) => {
        setBankItems(bank);
        setTakenItems(taken);
        setShopItems(items);
      })
      .catch(() => toast.error(t.adminPanel.bank.toastLoadFail))
      .finally(() => setBankLoading(false));
  }, [tab, detail]);

  const setF = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setEditForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!userNum) return;
    setActionLoading(true);
    try {
      const payload: UpdateUserPayload = {};
      if (editForm.userEmail !== "") payload.userEmail = editForm.userEmail;
      if (editForm.userPass !== "") payload.userPass = editForm.userPass;
      if (editForm.userPass2 !== "") payload.userPass2 = editForm.userPass2;
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

  async function handleClearBank() {
    if (!detail) return;
    setActionLoading(true);
    try {
      await clearUserBank(detail.UserID);
      setBankItems([]);
      toast.success(t.adminPanel.bank.toastCleared);
    } catch {
      toast.error(t.adminPanel.bank.toastClearFail);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleMarkTaken(purKey: string) {
    if (!detail) return;
    setActionLoading(true);
    try {
      await setBankItemTaken(detail.UserID, purKey);
      const moved = bankItems.find((i) => i.PurKey === purKey);
      setBankItems((prev) => prev.filter((i) => i.PurKey !== purKey));
      if (moved) setTakenItems((prev) => [moved, ...prev]);
      toast.success(t.adminPanel.bank.toastMarkedTaken);
    } catch {
      toast.error(t.adminPanel.bank.toastMarkFail);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleInsert() {
    if (!detail || !selectedProductNum) return;
    const item = shopItems.find((i) => i.ProductNum === Number(selectedProductNum));
    if (!item) return;
    setInsertLoading(true);
    try {
      await insertUserBank(detail.UserID, {
        productNum: item.ProductNum,
        itemMain: item.ItemMain,
        itemSub: item.ItemSub,
      });
      toast.success(t.adminPanel.bank.toastInserted);
      setSelectedProductNum("");
      const fresh = await getUserBank(detail.UserID);
      setBankItems(fresh);
    } catch {
      toast.error(t.adminPanel.bank.toastInsertFail);
    } finally {
      setInsertLoading(false);
    }
  }

  function handleClose() {
    setDetail(null);
    setBankItems([]);
    setTakenItems([]);
    setBankSubTab("pending");
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
                      <Label>Password</Label>
                      <div className="flex gap-2">
                        <Input type="text" value={editForm.userPass} onChange={setF("userPass")} className="flex-1" autoComplete="off" />
                        <Button type="button" size="sm" variant="outline" onClick={() => setEditForm((f) => ({ ...f, userPass: hashPassword(f.userPass) }))} title="Convert to MD5">MD5</Button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label>Sec. Password</Label>
                      <div className="flex gap-2">
                        <Input type="text" value={editForm.userPass2} onChange={setF("userPass2")} className="flex-1" autoComplete="off" />
                        <Button type="button" size="sm" variant="outline" onClick={() => setEditForm((f) => ({ ...f, userPass2: hashPassword(f.userPass2) }))} title="Convert to MD5">MD5</Button>
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

              {/* ── Bank Tab ── */}
              {tab === "bank" && (
                <div className="space-y-4 text-sm">
                  {/* Sub-tab bar */}
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      {(["pending", "taken"] as const).map((st) => (
                        <button
                          key={st}
                          onClick={() => setBankSubTab(st)}
                          className={`px-3 py-1 text-xs font-medium rounded transition-colors border ${
                            bankSubTab === st
                              ? "bg-primary text-primary-foreground border-primary"
                              : "border-border text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {st === "pending" ? `In Bank (${bankItems.length})` : `Taken (${takenItems.length})`}
                        </button>
                      ))}
                    </div>
                    {bankSubTab === "pending" && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={handleClearBank}
                        disabled={actionLoading || bankLoading || bankItems.length === 0}
                      >
                        {t.adminPanel.bank.clearAll}
                      </Button>
                    )}
                  </div>

                  {bankLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => <Skeleton key={i} className="h-6 w-full" />)}
                    </div>
                  ) : bankSubTab === "pending" ? (
                    bankItems.length === 0 ? (
                      <p className="text-muted-foreground text-xs">{t.adminPanel.bank.noItems}</p>
                    ) : (
                      <table className="w-full text-xs border-separate border-spacing-y-0.5">
                        <thead>
                          <tr className="text-left text-muted-foreground">
                            <th className="pb-1 font-medium">{t.adminPanel.bank.colPurKey}</th>
                            <th className="pb-1 font-medium">{t.adminPanel.bank.colItem}</th>
                            <th className="pb-1"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {bankItems.map((item) => {
                            const shopItem = shopItems.find((s) => s.ProductNum === item.ProductNum);
                            return (
                              <tr key={item.PurKey} className="border-b border-border">
                                <td className="py-1 font-mono pr-3">{item.PurKey.slice(0, 8)}…</td>
                                <td className="py-1 pr-3">
                                  {shopItem ? (
                                    <span>{shopItem.ItemName} <span className="text-muted-foreground">(#{item.ProductNum})</span></span>
                                  ) : (
                                    <span className="text-muted-foreground">#{item.ProductNum}</span>
                                  )}
                                </td>
                                <td className="py-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleMarkTaken(item.PurKey)}
                                    disabled={actionLoading}
                                  >
                                    {t.adminPanel.bank.markTaken}
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )
                  ) : (
                    takenItems.length === 0 ? (
                      <p className="text-muted-foreground text-xs">No taken items.</p>
                    ) : (
                      <table className="w-full text-xs border-separate border-spacing-y-0.5">
                        <thead>
                          <tr className="text-left text-muted-foreground">
                            <th className="pb-1 font-medium">{t.adminPanel.bank.colPurKey}</th>
                            <th className="pb-1 font-medium">{t.adminPanel.bank.colItem}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {takenItems.map((item) => {
                            const shopItem = shopItems.find((s) => s.ProductNum === item.ProductNum);
                            return (
                              <tr key={item.PurKey} className="border-b border-border">
                                <td className="py-1 font-mono pr-3">{item.PurKey.slice(0, 8)}…</td>
                                <td className="py-1 pr-3">
                                  {shopItem ? (
                                    <span>{shopItem.ItemName} <span className="text-muted-foreground">(#{item.ProductNum})</span></span>
                                  ) : (
                                    <span className="text-muted-foreground">#{item.ProductNum}</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )
                  )}

                  <div className="border-t border-border pt-3 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t.adminPanel.bank.insertSection}</p>
                    <div className="flex gap-2">
                      <Select value={selectedProductNum} onValueChange={setSelectedProductNum}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder={t.adminPanel.bank.selectItemPlaceholder} />
                        </SelectTrigger>
                        <SelectContent>
                          {shopItems.map((i) => (
                            <SelectItem key={i.ProductNum} value={String(i.ProductNum)}>
                              {i.ItemName} (#{i.ProductNum})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        onClick={handleInsert}
                        disabled={!selectedProductNum || insertLoading}
                      >
                        {t.adminPanel.bank.insert}
                      </Button>
                    </div>
                  </div>
                </div>
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
