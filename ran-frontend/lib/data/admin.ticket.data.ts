import { apiFetch } from "@/lib/apiFetch";

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
  UpdatedAt: string | null;
  ReplyCount: number;
  LastReplyIsStaff: boolean | null;
  LastReplyAt: string | null;
}

export interface TicketReply {
  ReplyID: number;
  UserNum: number;
  Message: string;
  IsStaffReply: boolean;
  CreatedAt: string;
  ReplyUserID?: string | null;
  attachments?: { AttachmentID: number; FileName: string; FilePath: string }[];
}

export interface TicketAttachment {
  AttachmentID: number;
  FileName: string;
  FilePath: string;
  FileSize: number;
  FileType: string;
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
  AssignedStaffUserID?: string | null;
  attachments?: TicketAttachment[];
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
   Public Accessors
===================================================== */

export async function getStaffTickets(): Promise<StaffTicketRow[]> {
  const res = await apiFetch<{ ok: boolean; tickets: StaffTicketRow[] }>(
    "/api/adminpanel/tickets/all",
  );
  return res.tickets ?? [];
}

export async function getStaffTicketFull(
  ticketId: number,
): Promise<StaffTicketFull> {
  const res = await apiFetch<{
    ok: boolean;
    ticket: TicketDetail;
    replies: TicketReply[];
    attachments: TicketAttachment[];
  }>(`/api/adminpanel/tickets/${ticketId}`);
  return {
    ticket: { ...res.ticket, attachments: res.attachments ?? [] },
    replies: res.replies ?? [],
  };
}

export async function updateTicketStatus(
  ticketId: number,
  status: string,
): Promise<{ ok: boolean }> {
  return apiFetch(`/api/adminpanel/tickets/${ticketId}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}

export async function staffReply(
  ticketId: number,
  message: string,
  files?: File[],
): Promise<{ ok: boolean }> {
  if (files && files.length > 0) {
    const form = new FormData();
    form.append("message", message);
    files.forEach((f) => form.append("attachments", f));
    return apiFetch(`/api/adminpanel/tickets/${ticketId}/reply`, {
      method: "POST",
      body: form,
    });
  }
  return apiFetch(`/api/adminpanel/tickets/${ticketId}/reply`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

export async function getStaffList(): Promise<StaffListItem[]> {
  const res = await apiFetch<{ ok: boolean; staff: StaffListItem[] }>(
    "/api/adminpanel/tickets/list",
  );
  return res.staff ?? [];
}

export async function updateTicketPriority(
  ticketId: number,
  priority: string,
): Promise<{ ok: boolean }> {
  return apiFetch(`/api/adminpanel/tickets/${ticketId}/priority`, {
    method: "PUT",
    body: JSON.stringify({ priority }),
  });
}

export async function assignTicket(
  ticketId: number,
  staffUserNum: number | null,
): Promise<{ ok: boolean }> {
  return apiFetch(`/api/adminpanel/tickets/${ticketId}/assign`, {
    method: "PUT",
    body: JSON.stringify({ staffUserNum }),
  });
}
