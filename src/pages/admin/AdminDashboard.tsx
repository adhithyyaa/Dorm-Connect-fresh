import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, AlertTriangle, CheckCircle } from "lucide-react";

const AdminDashboard = () => {
  const [stats, setStats] = useState({ students: 0, pending: 0, resolved: 0, sos: 0 });

  useEffect(() => {
    const load = async () => {
      const [students, pending, resolved, sos] = await Promise.all([
        supabase.from("student_details").select("id", { count: "exact", head: true }),
        supabase.from("complaints").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("complaints").select("id", { count: "exact", head: true }).eq("status", "resolved"),
        supabase.from("sos_alerts").select("id", { count: "exact", head: true }),
      ]);
      setStats({
        students: students.count ?? 0,
        pending: pending.count ?? 0,
        resolved: resolved.count ?? 0,
        sos: sos.count ?? 0,
      });
    };
    load();
  }, []);

  const cards = [
    { title: "Registered Students", value: stats.students, icon: Users, color: "text-primary" },
    { title: "Pending Complaints", value: stats.pending, icon: FileText, color: "text-warning" },
    { title: "Resolved Complaints", value: stats.resolved, icon: CheckCircle, color: "text-success" },
    { title: "SOS Alerts", value: stats.sos, icon: AlertTriangle, color: "text-destructive" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="heading-display text-2xl">Admin Dashboard</h1>
        <p className="text-muted-foreground">Overview of hostel activities</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => (
          <Card key={c.title}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.title}</CardTitle>
              <c.icon className={`h-5 w-5 ${c.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
