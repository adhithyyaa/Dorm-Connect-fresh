import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DoorOpen, FileText, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const StudentDashboard = () => {
  const navigate = useNavigate();

  const actions = [
    { title: "Register Room", desc: "Register your room details", icon: DoorOpen, url: "/student/register-room" },
    { title: "Raise Complaint", desc: "Submit a new complaint", icon: FileText, url: "/student/raise-complaint" },
    { title: "My Complaints", desc: "View complaint status", icon: FileText, url: "/student/complaints" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="heading-display text-2xl">Student Dashboard</h1>
        <p className="text-muted-foreground">Manage your room and complaints</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {actions.map(a => (
          <Card key={a.title} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate(a.url)}>
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <a.icon className="h-8 w-8 text-primary" />
              <CardTitle className="text-lg">{a.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{a.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default StudentDashboard;
