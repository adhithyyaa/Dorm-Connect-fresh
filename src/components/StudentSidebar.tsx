import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarTrigger,
} from "@/components/ui/sidebar";
import { Home, FileText, DoorOpen, LogOut, Shield } from "lucide-react";
import SOSButton from "@/components/SOSButton";
import { Button } from "@/components/ui/button";

const studentItems = [
  { title: "Dashboard", url: "/student", icon: Home },
  { title: "Register Room", url: "/student/register-room", icon: DoorOpen },
  { title: "Raise Complaint", url: "/student/raise-complaint", icon: FileText },
  { title: "My Complaints", url: "/student/complaints", icon: FileText },
];

const StudentSidebar = () => {
  const { signOut, username } = useAuth();
  const location = useLocation();

  return (
    <Sidebar className="w-60 border-r">
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-sidebar-primary" />
          <span className="font-heading text-lg text-sidebar-foreground">Dorm Connect</span>
        </div>
        <p className="text-xs text-sidebar-foreground/60 mt-1">Student Portal</p>
      </div>
      <SidebarContent className="flex-1">
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {studentItems.map(item => (
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

export default StudentSidebar;
