import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Home, FileText, Users, ShieldCheck, Settings, LogOut, AlertTriangle, Shield } from "lucide-react";
import SOSButton from "@/components/SOSButton";
import { Button } from "@/components/ui/button";

const AdminSidebar = () => {
  const { signOut, role } = useAuth();
  const isPrimary = role === "primary_admin";

  const items = [
    { title: "Dashboard", url: "/admin", icon: Home },
    { title: "Students", url: "/admin/students", icon: Users },
    { title: "Complaints", url: "/admin/complaints", icon: FileText },
    { title: "SOS Alerts", url: "/admin/sos", icon: AlertTriangle },
    ...(isPrimary ? [
      { title: "Admin Management", url: "/admin/manage-admins", icon: ShieldCheck },
      { title: "Settings", url: "/admin/settings", icon: Settings },
    ] : []),
  ];

  return (
    <Sidebar className="w-60 border-r">
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-sidebar-primary" />
          <span className="font-heading text-lg text-sidebar-foreground">Dorm Connect</span>
        </div>
        <p className="text-xs text-sidebar-foreground/60 mt-1">
          {isPrimary ? "Primary Admin" : "Admin"} Portal
        </p>
      </div>
      <SidebarContent className="flex-1">
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className="hover:bg-sidebar-accent" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <div className="p-4 border-t border-sidebar-border space-y-2">
        <SOSButton />
        <Button variant="ghost" className="w-full justify-start gap-2 text-sidebar-foreground" onClick={signOut}>
          <LogOut className="h-4 w-4" /> Sign Out
        </Button>
      </div>
    </Sidebar>
  );
};

export default AdminSidebar;
