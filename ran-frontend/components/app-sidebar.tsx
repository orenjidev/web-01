"use client";

import * as React from "react";
import {
  FileText,
  GalleryVerticalEnd,
  LayoutDashboard,
  Settings2,
  ShoppingBag,
  Sword,
  Ticket,
  Users,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

export type AdminSection =
  | "dashboard"
  | "account.manage"
  | "account.create"
  | "character.manage"
  | "ticket.list"
  | "shop.categories"
  | "shop.items"
  | "news"
  | "downloads"
  | "server.config";

const data = {
  user: {
    name: "Admin",
    email: "admin@ranserver.com",
    avatar: "",
  },
  teams: [
    {
      name: "Ran Admin Panel",
      logo: GalleryVerticalEnd,
      plan: "Staff Access",
    },
  ],
  overview: [
    {
      name: "Dashboard",
      url: "#",
      icon: LayoutDashboard,
      action: "dashboard" as AdminSection,
    },
  ],
  navMain: [
    {
      title: "Account",
      url: "#",
      icon: Users,
      isActive: true,
      items: [
        { title: "Manage Account", action: "account.manage" as AdminSection },
      ],
    },
    {
      title: "Character",
      url: "#",
      icon: Sword,
      isActive: true,
      items: [
        {
          title: "Manage Character",
          action: "character.manage" as AdminSection,
        },
      ],
    },
    {
      title: "Tickets",
      url: "#",
      icon: Ticket,
      isActive: true,
      items: [
        { title: "Manage Tickets", action: "ticket.list" as AdminSection },
      ],
    },
    {
      title: "Item Shop",
      url: "#",
      icon: ShoppingBag,
      isActive: true,
      items: [
        { title: "Shop Categories", action: "shop.categories" as AdminSection },
        { title: "Shop Items", action: "shop.items" as AdminSection },
      ],
    },
    {
      title: "Content",
      url: "#",
      icon: FileText,
      isActive: true,
      items: [
        { title: "Manage News", action: "news" as AdminSection },
        { title: "Manage Downloads", action: "downloads" as AdminSection },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        { title: "General", action: "dashboard" as AdminSection },
        { title: "Server Config", action: "server.config" as AdminSection },
      ],
    },
  ],
};

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  activeSection?: AdminSection;
  onNavigate?: (section: AdminSection) => void;
}

export function AppSidebar({
  activeSection = "dashboard",
  onNavigate,
  ...props
}: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavProjects
          projects={data.overview}
          activeSection={activeSection}
          onNavigate={onNavigate}
        />
        <NavMain
          items={data.navMain}
          activeSection={activeSection}
          onNavigate={onNavigate}
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
