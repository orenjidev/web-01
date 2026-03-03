import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: {
    default: "Admin Panel",
    template: "%s | Admin Panel",
  },
  description: "Administrative dashboard",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="min-h-screen bg-gray-50">
      <main>{children}</main>
    </section>
  );
}
