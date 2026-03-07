"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ShieldAlert, Trash2, RotateCcw, DatabaseZap, Power, Newspaper, Download, TicketX, ScrollText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { apiFetch } from "@/lib/apiFetch";

type ResetTarget = "action-logs" | "action-logs-gm" | "news" | "downloads" | "tickets" | "server-config" | "full" | "restart";

const RESET_ACTIONS: { target: ResetTarget; label: string; description: string; icon: React.ReactNode; danger: boolean }[] = [
  {
    target: "action-logs",
    label: "Clear Action Logs",
    description: "Truncates the ActionLog table. All user action history will be permanently deleted.",
    icon: <Trash2 className="h-4 w-4" />,
    danger: false,
  },
  {
    target: "action-logs-gm",
    label: "Clear GM Action Logs",
    description: "Truncates the ActionLogGM table. All GM/staff action history will be permanently deleted.",
    icon: <ScrollText className="h-4 w-4" />,
    danger: false,
  },
  {
    target: "news",
    label: "Delete All News",
    description: "Deletes all rows from the News table.",
    icon: <Newspaper className="h-4 w-4" />,
    danger: false,
  },
  {
    target: "downloads",
    label: "Delete All Download Links",
    description: "Deletes all rows from the DownloadLinks table.",
    icon: <Download className="h-4 w-4" />,
    danger: false,
  },
  {
    target: "tickets",
    label: "Delete All Tickets",
    description: "Deletes all tickets, replies, attachments, and history. TicketCategories are preserved.",
    icon: <TicketX className="h-4 w-4" />,
    danger: false,
  },
  {
    target: "server-config",
    label: "Reset Server Config",
    description: "Deletes all rows in ServerConfig. Defaults will be re-seeded on next backend restart.",
    icon: <RotateCcw className="h-4 w-4" />,
    danger: false,
  },
  {
    target: "full",
    label: "Full Web DB Reset",
    description: "Resets the entire web database (OrenjiWeb): clears action logs and server config. Requires backend restart to re-seed.",
    icon: <DatabaseZap className="h-4 w-4" />,
    danger: true,
  },
  {
    target: "restart",
    label: "Restart Backend",
    description: "Sends process.exit(0) to the backend. PM2 or nodemon will automatically restart the process.",
    icon: <Power className="h-4 w-4" />,
    danger: false,
  },
];

export function MasterControlSection() {
  const [accessCode, setAccessCode] = useState("");
  const [pending, setPending] = useState<ResetTarget | null>(null);
  const [loading, setLoading] = useState(false);

  async function executeReset(target: ResetTarget) {
    setLoading(true);
    try {
      const res = await apiFetch<{ ok: boolean; message: string }>("/api/adminpanel/master/reset", {
        method: "POST",
        body: JSON.stringify({ accessCode: accessCode.trim(), target }),
      });
      toast.success(res.message ?? "Reset completed.");
      setAccessCode("");
    } catch (err) {
      // apiFetch throws on non-2xx with body text as message — parse JSON if possible
      if (err instanceof Error) {
        try {
          const parsed = JSON.parse(err.message);
          toast.error(parsed.message ?? err.message);
        } catch {
          toast.error(err.message);
        }
      } else {
        toast.error("Request failed.");
      }
    } finally {
      setLoading(false);
      setPending(null);
    }
  }

  const pendingAction = RESET_ACTIONS.find((a) => a.target === pending);

  return (
    <div className="space-y-6">
      {/* Warning Banner */}
      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-destructive text-sm">
            <ShieldAlert className="h-4 w-4" />
            Master Control — Danger Zone
          </CardTitle>
          <CardDescription>
            Actions here are irreversible. An access code is required for every operation.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Access Code Input */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Access Code</CardTitle>
          <CardDescription>Enter the master access code defined in the server <code>.env</code> to unlock operations.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 max-w-sm">
            <Label className="sr-only">Access Code</Label>
            <Input
              type="password"
              placeholder="Enter master access code…"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              autoComplete="off"
            />
          </div>
        </CardContent>
      </Card>

      {/* Reset Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Reset Operations</CardTitle>
          <CardDescription>Web database (OrenjiWeb) reset targets.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {RESET_ACTIONS.map((action) => (
            <div
              key={action.target}
              className="flex items-center justify-between gap-4 rounded-md border p-3"
            >
              <div className="space-y-0.5">
                <p className={`text-sm font-medium flex items-center gap-1.5 ${action.danger ? "text-destructive" : ""}`}>
                  {action.icon}
                  {action.label}
                </p>
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </div>
              <Button
                size="sm"
                variant={action.danger ? "destructive" : "outline"}
                disabled={!accessCode || loading}
                onClick={() => setPending(action.target)}
                className="shrink-0"
              >
                Execute
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!pending} onOpenChange={(o) => { if (!o) setPending(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm: {pendingAction?.label}</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.description}
              <br /><br />
              <span className="font-semibold text-destructive">This action cannot be undone.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => pending && executeReset(pending)}
            >
              {loading ? "Processing…" : "Yes, proceed"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
