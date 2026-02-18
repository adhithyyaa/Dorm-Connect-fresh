import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Complaint = {
  id: string; student_name: string; room_no: string; title: string; description: string;
  complaint_image_url: string | null; resolution_description: string | null;
  resolution_image_url: string | null; status: string; created_at: string;
};

const statusColor = (s: string) => {
  if (s === "resolved") return "bg-success text-success-foreground";
  if (s === "declined") return "bg-destructive text-destructive-foreground";
  return "bg-warning text-warning-foreground";
};

const AdminComplaints = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [resolveId, setResolveId] = useState<string | null>(null);
  const [resDesc, setResDesc] = useState("");
  const [resImage, setResImage] = useState<File | null>(null);
  const [resolving, setResolving] = useState(false);
  const [filter, setFilter] = useState("");

  const load = async () => {
    const { data } = await supabase.from("complaints").select("*").order("created_at", { ascending: false });
    if (data) setComplaints(data as Complaint[]);
  };

  useEffect(() => { load(); }, []);

  const handleResolve = async () => {
    if (!resolveId || !user) return;
    setResolving(true);

    let imageUrl: string | undefined;
    if (resImage) {
      const ext = resImage.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("resolution-images").upload(path, resImage);
      if (!upErr) {
        const { data } = supabase.storage.from("resolution-images").getPublicUrl(path);
        imageUrl = data.publicUrl;
      }
    }

    await supabase.from("complaints").update({
      status: "resolved" as any,
      resolution_description: resDesc,
      resolution_image_url: imageUrl,
      resolved_at: new Date().toISOString(),
      resolved_by: user.id,
    }).eq("id", resolveId);

    setResolving(false);
    setResolveId(null);
    setResDesc("");
    setResImage(null);
    toast({ title: "Complaint resolved!" });
    load();
  };

  const handleDecline = async (id: string) => {
    await supabase.from("complaints").update({ status: "declined" as any }).eq("id", id);
    toast({ title: "Complaint declined" });
    load();
  };

  const filtered = complaints.filter(c => !filter || c.room_no.includes(filter) || c.student_name.toLowerCase().includes(filter.toLowerCase()));
  const pending = filtered.filter(c => c.status === "pending");
  const resolved = filtered.filter(c => c.status !== "pending");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-display text-2xl">Complaints</h1>
          <p className="text-muted-foreground">Manage student complaints</p>
        </div>
        <Input placeholder="Filter by room or name..." className="max-w-xs" value={filter} onChange={e => setFilter(e.target.value)} />
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
          <TabsTrigger value="resolved">Resolved / Declined ({resolved.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4 mt-4">
          {pending.length === 0 ? (
            <Card><CardContent className="p-6 text-center text-muted-foreground">No pending complaints</CardContent></Card>
          ) : pending.map(c => (
            <Card key={c.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{c.title}</CardTitle>
                  <Badge className={statusColor(c.status)}>{c.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{c.student_name} · Room {c.room_no} · {new Date(c.created_at).toLocaleString()}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm">{c.description}</p>
                {c.complaint_image_url && <img src={c.complaint_image_url} alt="Complaint" className="rounded-md max-h-48 object-cover" />}
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setResolveId(c.id)} className="bg-success hover:bg-success/90 text-success-foreground">Resolve</Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDecline(c.id)}>Decline</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="resolved" className="space-y-4 mt-4">
          {resolved.length === 0 ? (
            <Card><CardContent className="p-6 text-center text-muted-foreground">No resolved or declined complaints</CardContent></Card>
          ) : resolved.map(c => (
            <Card key={c.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{c.title}</CardTitle>
                  <Badge className={statusColor(c.status)}>{c.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{c.student_name} · Room {c.room_no} · {new Date(c.created_at).toLocaleString()}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm">{c.description}</p>
                {c.resolution_description && (
                  <div className="bg-muted rounded-md p-3">
                    <p className="text-sm font-medium text-success">Resolution: {c.resolution_description}</p>
                    {c.resolution_image_url && <img src={c.resolution_image_url} alt="Resolution" className="rounded-md max-h-48 object-cover mt-2" />}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Resolve Dialog */}
      <Dialog open={!!resolveId} onOpenChange={o => { if (!o) setResolveId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="heading-display">Resolve Complaint</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Resolution Description</Label>
              <Textarea value={resDesc} onChange={e => setResDesc(e.target.value)} required rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Upload Resolution Image</Label>
              <Input type="file" accept="image/*" onChange={e => setResImage(e.target.files?.[0] ?? null)} />
            </div>
            <Button onClick={handleResolve} disabled={resolving || !resDesc} className="w-full bg-success hover:bg-success/90 text-success-foreground">
              {resolving ? "Resolving..." : "Mark as Resolved"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminComplaints;
