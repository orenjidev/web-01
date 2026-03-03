"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Ban, Paperclip } from "lucide-react";
import {
  createTicket,
  getTicketCategories,
  TicketCategory,
} from "@/lib/data/ticket.data";
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
import { useAuth } from "@/context/AuthContext";
import { usePublicConfig } from "@/context/PublicConfigContext";
import { toast } from "sonner";

export default function NewTicketPage() {
  const router = useRouter();

  const { user, loading: authLoading } = useAuth();
  const { config } = usePublicConfig();
  const isAuthed = Boolean(user);
  const shown = useRef(false);

  const [categories, setCategories] = useState<TicketCategory[]>([]);
  const [subject, setSubject] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    if (!authLoading && !isAuthed && !shown.current) {
      toast.error("You must login first before creating a ticket.");
      shown.current = true;
      router.replace("/login");
    }
  }, [authLoading, isAuthed]);

  useEffect(() => {
    if (!isAuthed) return;
    if (config?.features.ticketSystem === false) return;

    async function loadCategories() {
      const data = await getTicketCategories();
      setCategories(data);
    }

    loadCategories();
  }, [isAuthed, config]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!categoryId || !isAuthed) return;

    try {
      setSubmitting(true);

      await createTicket({
        subject: subject.trim(),
        categoryId,
        description: message.trim(),
        attachments: files,
      });

      toast.success("Ticket created successfully.");
      router.push("/tickets");
    } catch {
      toast.error("Failed to create ticket.");
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading) {
    return <p className="max-w-4xl mx-auto py-10">Loading...</p>;
  }

  if (!isAuthed) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4">
        <Card>
          <CardContent className="flex flex-col items-center text-center py-12 space-y-3">
            <Ban size={64} />
            <h1 className="text-2xl font-semibold">Forbidden Access</h1>
            <p className="text-muted-foreground">Login first to see content.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (config?.features.ticketSystem === false) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4">
        <Card>
          <CardContent className="flex flex-col items-center text-center py-12 space-y-3">
            <Ban size={64} />
            <h1 className="text-2xl font-semibold">Feature Unavailable</h1>
            <p className="text-muted-foreground">The support ticket system is currently disabled.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
      >
        <ArrowLeft size={18} />
        Back
      </button>

      {/* Header */}

      <Card>
        <CardHeader>
          <CardTitle>Create Ticket</CardTitle>
          <CardDescription>
            Provide detailed information so we can assist you faster.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Game ID */}
            <div className="grid gap-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Game ID
              </Label>
              <Input
                value={user?.userid ?? ""}
                disabled
                className="h-9 text-sm"
              />
            </div>

            {/* Subject */}
            <div className="grid gap-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Subject
              </Label>
              <Input
                placeholder="Brief summary of your issue"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="h-9 text-sm"
              />
            </div>

            {/* Category */}
            <div className="grid gap-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Category
              </Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={categoryId ?? ""}
                onChange={(e) =>
                  setCategoryId(e.target.value ? Number(e.target.value) : null)
                }
                required
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="grid gap-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Description
              </Label>
              <textarea
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                rows={6}
                placeholder="Describe your issue in detail..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </div>

            {/* Attachments */}
            <div className="grid gap-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Paperclip size={12} />
                Attachments (Optional)
              </Label>

              <div className="border border-dashed rounded-lg p-5 text-center bg-muted/20">
                <input
                  type="file"
                  multiple
                  accept=".jpg,.jpeg,.png,.pdf"
                  className="hidden"
                  id="file-upload"
                  onChange={(e) =>
                    setFiles(e.target.files ? Array.from(e.target.files) : [])
                  }
                />

                <label
                  htmlFor="file-upload"
                  className="cursor-pointer text-sm text-muted-foreground hover:text-foreground transition"
                >
                  Click to upload or drag files here
                </label>

                {files.length > 0 && (
                  <div className="mt-4 space-y-2 text-left">
                    {files.map((file) => (
                      <div
                        key={file.name}
                        className="flex justify-between text-xs bg-muted/40 border rounded-md px-3 py-2"
                      >
                        <span>{file.name}</span>
                        <span className="text-muted-foreground">
                          {Math.round(file.size / 1024)} KB
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end pt-1">
              <Button type="submit" disabled={submitting} className="h-9 gap-2">
                {submitting ? "Submitting..." : "Submit Ticket"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
