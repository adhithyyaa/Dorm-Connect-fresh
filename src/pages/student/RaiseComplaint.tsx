import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const RaiseComplaint = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [studentInfo, setStudentInfo] = useState<{ name: string; room_no: string } | null>(null);

  useEffect(() => {
    if (user) {
      supabase.from("student_details").select("name, room_no").eq("user_id", user.id).single().then(({ data }) => {
        if (data) setStudentInfo(data);
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !studentInfo) {
      toast({ title: "Please register your room first", variant: "destructive" });
      return;
    }
    setLoading(true);

    let imageUrl: string | undefined;
    if (imageFile) {
      const ext = imageFile.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("complaint-images").upload(path, imageFile);
      if (upErr) { toast({ title: "Image upload failed", description: upErr.message, variant: "destructive" }); setLoading(false); return; }
      const { data: urlData } = supabase.storage.from("complaint-images").getPublicUrl(path);
      imageUrl = urlData.publicUrl;
    }

    const { error } = await supabase.from("complaints").insert({
      user_id: user.id,
      student_name: studentInfo.name,
      room_no: studentInfo.room_no,
      title,
      description,
      complaint_image_url: imageUrl,
    });

    setLoading(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Complaint submitted!" }); navigate("/student/complaints"); }
  };

  if (!studentInfo) {
    return (
      <div className="max-w-lg mx-auto">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground mb-4">Please register your room details first.</p>
            <Button onClick={() => navigate("/student/register-room")}>Register Room</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="heading-display text-xl">Raise Complaint</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">Name</Label>
                <p className="font-medium text-sm">{studentInfo.name}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">Room No.</Label>
                <p className="font-medium text-sm">{studentInfo.room_no}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Complaint Title</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} required rows={4} />
            </div>
            <div className="space-y-2">
              <Label>Upload Photo Evidence</Label>
              <Input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] ?? null)} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Submitting..." : "Submit Complaint"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default RaiseComplaint;
