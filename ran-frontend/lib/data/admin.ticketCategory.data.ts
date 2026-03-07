import { apiFetch } from "@/lib/apiFetch";

export interface TicketCategory {
  CategoryID: number;
  CategoryName: string;
  Description: string | null;
  DefaultAssignedTeam: string | null;
  IsActive: boolean;
  CreatedAt: string;
}

export interface CreateTicketCategoryPayload {
  name: string;
  description?: string;
  defaultAssignedTeam?: string;
}

export interface UpdateTicketCategoryPayload {
  name?: string;
  description?: string;
  defaultAssignedTeam?: string;
  isActive?: boolean;
}

export async function getAdminTicketCategories(): Promise<TicketCategory[]> {
  const res = await apiFetch<{ ok: boolean; categories: TicketCategory[] }>(
    "/api/adminpanel/ticket-categories"
  );
  return res.categories;
}

export async function createTicketCategory(
  payload: CreateTicketCategoryPayload
): Promise<TicketCategory> {
  const res = await apiFetch<{ ok: boolean; category: TicketCategory }>(
    "/api/adminpanel/ticket-categories",
    { method: "POST", body: JSON.stringify(payload) }
  );
  return res.category;
}

export async function updateTicketCategory(
  id: number,
  payload: UpdateTicketCategoryPayload
): Promise<TicketCategory> {
  const res = await apiFetch<{ ok: boolean; category: TicketCategory }>(
    `/api/adminpanel/ticket-categories/${id}`,
    { method: "PATCH", body: JSON.stringify(payload) }
  );
  return res.category;
}

export async function deleteTicketCategory(id: number): Promise<void> {
  await apiFetch<{ ok: boolean }>(`/api/adminpanel/ticket-categories/${id}`, {
    method: "DELETE",
  });
}
