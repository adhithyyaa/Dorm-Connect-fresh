import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Complaint = {
  id: string;
  title: string;
  description: string;
  complaint_image_url: string | null;
  resolution_description: string | null;
  resolution_image_url: string | null;
  status: string;
  created_at: string;
  room_no: string;
};

const statusColor = (s: string) => {
  if (s === "resolved") return "bg-success text-success-foreground";
  if (s === "declined") return "bg-destructive text-destructive-foreground";
  return "bg-warning text-warning-foreground";
};

const MyComplaints = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);

  useEffect(() => {
    if (user) {
      supabase.from("complaints").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => {
        if (data) setComplaints(data as Complaint[]);
      });
    }
  }, [user]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="heading-display text-2xl">My Complaints</h1>
        <p className="text-muted-foreground">Track the status of your complaints</p>
      </div>
      {complaints.length === 0 ? (
        <Card><CardContent className="p-6 text-center text-muted-foreground">No complaints found.</CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {complaints.map(c => (
            <Card key={c.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{c.title}</CardTitle>
                  <Badge className={statusColor(c.status)}>{c.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Room {c.room_no} · {new Date(c.created_at).toLocaleString()}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm">{c.description}</p>
                {c.complaint_image_url && (
                  <img src={c.complaint_image_url} alt="Complaint" className="rounded-md max-h-48 object-cover" />
                )}
                {c.status === "resolved" && c.resolution_description && (
                  <div className="bg-muted rounded-md p-3 space-y-2">
                    <p className="text-sm font-medium text-success">Resolution:</p>
                    <p className="text-sm">{c.resolution_description}</p>
                    {c.resolution_image_url && (
                      <img src={c.resolution_image_url} alt="Resolution" className="rounded-md max-h-48 object-cover" />
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyComplaints;
