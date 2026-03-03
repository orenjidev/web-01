/* =====================================================
   Config
===================================================== */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_ENDPOINT_URL;

/* =====================================================
   Types
===================================================== */

export interface StaffTicketRow {
  TicketID: number;
  Subject: string;
  Status: string;
  Priority: string;
  Username: string;
  CreatedAt: string;
}

export interface TicketReply {
  ReplyID: number;
  UserNum: number;
  Message: string;
  IsStaffReply: boolean;
  CreatedAt: string;
  attachments?: { AttachmentID: number; FileName: string; FilePath: string }[];
}

export interface TicketDetail {
  TicketID: number;
  UserNum: number;
  Subject: string;
  Description: string;
  Status: string;
  Priority: string;
  CategoryID: number;
  CreatedAt: string;
  UpdatedAt: string;
  AssignedToStaffUserNum: number | null;
}

export interface StaffTicketFull {
  ticket: TicketDetail;
  replies: TicketReply[];
}

export interface StaffListItem {
  UserNum: number;
  UserID: string;
  UserType: number;
}

/* =====================================================
   Internal API Helper
===================================================== */

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  if (!API_BASE_URL) throw new Error("API endpoint is not configured");

  const res = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Request failed");
  return json as T;
}

/* =====================================================
   Public Accessors
===================================================== */

export async function getStaffTickets(): Promise<StaffTicketRow[]> {
  const res = await apiFetch<{ ok: boolean; tickets: StaffTicketRow[] }>(
    "/api/tickets/staff/all",
  );
  return res.tickets ?? [];
}

export async function getStaffTicketFull(
  ticketId: number,
): Promise<StaffTicketFull> {
  // Staff endpoint returns the ticket row only (no replies)
  const staffRes = await apiFetch<{ ok: boolean; ticket: TicketDetail }>(
    `/api/tickets/staff/${ticketId}`,
  );
  // The user-facing detail endpoint returns ticket + replies; staff are auth'd users too
  try {
    const userRes = await apiFetch<{
      ok: boolean;
      ticket: TicketDetail;
      replies: TicketReply[];
    }>(`/api/tickets/${ticketId}`);
    return { ticket: staffRes.ticket, replies: userRes.replies ?? [] };
  } catch {
    return { ticket: staffRes.ticket, replies: [] };
  }
}

export async function updateTicketStatus(
  ticketId: number,
  status: string,
): Promise<{ ok: boolean }> {
  return apiFetch(`/api/tickets/staff/${ticketId}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}

export async function staffReply(
  ticketId: number,
  message: string,
): Promise<{ ok: boolean }> {
  return apiFetch(`/api/tickets/staff/${ticketId}/reply`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

export async function getStaffList(): Promise<StaffListItem[]> {
  const res = await apiFetch<{ ok: boolean; staff: StaffListItem[] }>(
    "/api/tickets/staff/list",
  );
  return res.staff ?? [];
}

export async function assignTicket(
  ticketId: number,
  staffUserNum: number | null,
): Promise<{ ok: boolean }> {
  return apiFetch(`/api/tickets/staff/${ticketId}/assign`, {
    method: "PUT",
    body: JSON.stringify({ staffUserNum }),
  });
}
