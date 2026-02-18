import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Clock } from "lucide-react";

type AdminUser = {
  user_id: string;
  role: string;
  approval_status: string;
  username: string;
};

const ManageAdmins = () => {
  const { toast } = useToast();
  const [admins, setAdmins] = useState<AdminUser[]>([]);

  const load = async () => {
    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id, role, approval_status")
      .eq("role", "admin");

    if (!roles) return;

    // Fetch profiles for these users
    const userIds = roles.map(r => r.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, username")
      .in("user_id", userIds);

    const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.user_id, p.username]));

    setAdmins(roles.map(r => ({
      ...r,
      username: profileMap[r.user_id] || "Unknown",
    })));
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (userId: string) => {
    await supabase.from("user_roles").update({ approval_status: "approved" as any }).eq("user_id", userId).eq("role", "admin");
    toast({ title: "Admin approved!" });
    load();
  };

  const handleReject = async (userId: string) => {
    await supabase.from("user_roles").update({ approval_status: "rejected" as any }).eq("user_id", userId).eq("role", "admin");
    toast({ title: "Admin rejected" });
    load();
  };

  const pending = admins.filter(a => a.approval_status === "pending");
  const approved = admins.filter(a => a.approval_status !== "pending");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="heading-display text-2xl">Admin Management</h1>
        <p className="text-muted-foreground">Approve or reject admin registrations</p>
      </div>

      {pending.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-warning" /> Pending Approvals ({pending.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.map(a => (
                  <TableRow key={a.user_id}>
                    <TableCell className="font-medium">{a.username}</TableCell>
                    <TableCell><Badge className="bg-warning text-warning-foreground">Pending</Badge></TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" onClick={() => handleApprove(a.user_id)} className="bg-success hover:bg-success/90 text-success-foreground gap-1">
                        <CheckCircle className="h-3 w-3" /> Approve
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleReject(a.user_id)} className="gap-1">
                        <XCircle className="h-3 w-3" /> Reject
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Admins</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {approved.length === 0 ? (
                <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">No approved admins yet</TableCell></TableRow>
              ) : approved.map(a => (
                <TableRow key={a.user_id}>
                  <TableCell className="font-medium">{a.username}</TableCell>
                  <TableCell>
                    <Badge className={a.approval_status === "approved" ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground"}>
                      {a.approval_status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ManageAdmins;
