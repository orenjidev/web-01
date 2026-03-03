"use client";

import { type LucideIcon } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { AdminSection } from "@/components/app-sidebar";

export function NavProjects({
  projects,
  activeSection,
  onNavigate,
}: {
  projects: {
    name: string;
    url: string;
    icon: LucideIcon;
    action?: AdminSection;
  }[];
  activeSection?: AdminSection;
  onNavigate?: (section: AdminSection) => void;
}) {
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Overview</SidebarGroupLabel>
      <SidebarMenu>
        {projects.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton
              isActive={item.action ? activeSection === item.action : false}
              onClick={() => {
                if (item.action && onNavigate) onNavigate(item.action);
              }}
            >
              <item.icon />
              <span>{item.name}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
