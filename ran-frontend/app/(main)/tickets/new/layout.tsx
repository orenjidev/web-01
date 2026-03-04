import type { Metadata } from "next";
import { buildMetadata } from "@/lib/page-titles";

export const metadata: Metadata = buildMetadata("newTicket");

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
