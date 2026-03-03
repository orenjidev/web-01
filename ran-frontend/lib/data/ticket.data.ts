/* =====================================================
   Config
===================================================== */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_ENDPOINT_URL;

/* =====================================================
   Ticket Domain Types (UI CONTRACT)
===================================================== */
export interface TicketAttachment {
  id: number;
  fileName: string;
  filePath: string;
  fileSize: number;
  fileType: string;
  uploaded_at: string;
}

export interface TicketCategory {
  id: number;
  name: string;
}

export interface TicketItem {
  id: number;
  subject: string;
  category: string;
  status: string;
  created_at: string;
}

export interface TicketReply {
  id: number;
  userNum: number;
  message: string;
  isStaffReply: boolean;
  replyUserID: string | null;
  created_at: string;
  attachments: {
    id: number;
    fileName: string;
    filePath: string;
    fileSize: number;
    fileType: string;
  }[];
}

export interface TicketDetail {
  id: number;
  subject: string;
  description: string;
  priority: string;
  status: string;
  categoryID: number;
  characterName: string | null;
  gameId: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  closed_at: string | null;
  replies: TicketReply[];
  attachments: TicketAttachment[];
}

/* =====================================================
   Backend Types (SOURCE OF TRUTH)
===================================================== */

interface BackendResponse<T> {
  ok: boolean;
  data: T;
}

/* =====================================================
   Internal helper
===================================================== */

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error("API endpoint is not configured");
  }

  const isFormData = options?.body instanceof FormData;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: isFormData ? undefined : { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Request failed");
  }

  return res.json() as Promise<T>;
}

/* =====================================================
   Public Accessors
===================================================== */

/**
 * Get Ticket Categories
 */
export async function getTicketCategories(): Promise<TicketCategory[]> {
  const res = await apiFetch<any>("/api/tickets/categories");

  if (!res.ok || !Array.isArray(res.categories)) {
    console.error("[TICKET CATEGORIES] Invalid response", res);
    return [];
  }

  return res.categories.map((c: any) => ({
    id: c.CategoryID,
    name: c.CategoryName,
  }));
}

/**
 * Create Ticket
 */
export async function createTicket(payload: {
  subject: string;
  categoryId: number;
  description: string;
  attachments?: File[];
}) {
  if (payload.attachments && payload.attachments.length > 0) {
    const formData = new FormData();

    formData.append("subject", payload.subject);
    formData.append("categoryId", payload.categoryId.toString());
    formData.append("description", payload.description);

    payload.attachments.forEach((file) => {
      formData.append("attachments", file);
    });

    return apiFetch("/api/tickets/create", {
      method: "POST",
      body: formData,
    });
  }

  return apiFetch("/api/tickets/create", {
    method: "POST",
    body: JSON.stringify({
      subject: payload.subject,
      categoryId: payload.categoryId,
      description: payload.description,
    }),
  });
}

/**
 * Get My Tickets
 */
export async function getMyTickets(): Promise<TicketItem[]> {
  const res = await apiFetch<any>("/api/tickets/my-tickets");

  if (!res.ok || !Array.isArray(res.tickets)) {
    console.error("[MY TICKETS] Invalid response", res);
    return [];
  }

  return res.tickets.map((t: any) => ({
    id: t.TicketID,
    subject: t.Subject,
    category: t.CategoryName,
    status: t.Status,
    created_at: t.CreatedAt,
    updated_at: t.CreatedAt, // or UpdatedAt if you add it in SQL
  }));
}

/**
 * Get Ticket Detail
 */
export async function getTicketDetail(
  ticketId: number,
): Promise<TicketDetail | null> {
  const res = await apiFetch<any>(`/api/tickets/${ticketId}`);

  if (!res.ok || !res.ticket) return null;

  const t = res.ticket;

  return {
    id: t.TicketID,
    subject: t.Subject,
    description: t.Description,
    priority: t.Priority,
    categoryID: t.CategoryID,
    status: t.Status,
    characterName: t.CharacterName,
    gameId: t.GameID,
    created_at: t.CreatedAt,
    updated_at: t.UpdatedAt,
    resolved_at: t.ResolvedAt,
    closed_at: t.ClosedAt,
    replies: (res.replies || []).map((r: any) => ({
      id: r.ReplyID,
      userNum: r.UserNum,
      message: r.Message,
      isStaffReply: Boolean(r.IsStaffReply),
      replyUserID: r.ReplyUserID ?? null,
      created_at: r.CreatedAt,
      attachments: (r.attachments || []).map((a: any) => ({
        id: a.AttachmentID,
        fileName: a.FileName,
        filePath: a.FilePath,
        fileSize: a.FileSize,
        fileType: a.FileType,
      })),
    })),
    attachments: (res.attachments || []).map((a: any) => ({
      id: a.AttachmentID,
      fileName: a.FileName,
      filePath: a.FilePath,
      fileSize: a.FileSize,
      fileType: a.FileType,
      uploaded_at: a.UploadedAt,
    })),
  };
}

/**
 * Reply to Ticket
 */
export async function replyToTicket(
  ticketId: number,
  message: string,
  attachments?: File[],
) {
  if (attachments && attachments.length > 0) {
    const formData = new FormData();
    formData.append("message", message);

    attachments.forEach((file) => {
      formData.append("attachments", file);
    });

    return apiFetch(`/api/tickets/${ticketId}/reply`, {
      method: "POST",
      body: formData,
    });
  }

  return apiFetch(`/api/tickets/${ticketId}/reply`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}
