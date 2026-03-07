"use client";

import * as React from "react";
import {
  FileText,
  GalleryVerticalEnd,
  Hammer,
  LayoutDashboard,
  ScrollText,
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
import { usePublicConfig } from "@/context/PublicConfigContext";
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
  | "shop.analytics"
  | "news"
  | "downloads"
  | "server.config"
  | "logs.user"
  | "logs.gm"
  | "tools.buildItems"
  | "tools.buildSkills"
  | "master.control"
  | "ticket.categories";

const data = {
  user: {
    name: "Admin",
    email: "admin@ranserver.com",
    avatar: "",
  },
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
        { title: "Ticket Categories", action: "ticket.categories" as AdminSection },
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
        { title: "Shop Analytics", action: "shop.analytics" as AdminSection },
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
      title: "Tools",
      url: "#",
      icon: Hammer,
      items: [
        { title: "Build Items", action: "tools.buildItems" as AdminSection },
        { title: "Build Skills", action: "tools.buildSkills" as AdminSection },
      ],
    },
    {
      title: "Logs",
      url: "#",
      icon: ScrollText,
      items: [
        { title: "User Action Log", action: "logs.user" as AdminSection },
        { title: "GM Action Log", action: "logs.gm" as AdminSection },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        { title: "General", action: "dashboard" as AdminSection },
        { title: "Server Config", action: "server.config" as AdminSection },
        { title: "Master Control", action: "master.control" as AdminSection },
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
  const { config } = usePublicConfig();
  const logoImage = config?.siteImages?.logoUrl;
  const teams = [
    {
      name: "Ran Admin Panel",
      logo: GalleryVerticalEnd,
      logoImage,
      plan: "Staff Access",
    },
  ];

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
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
