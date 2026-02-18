import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle } from "lucide-react";

const RegisterRoom = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [roomNo, setRoomNo] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [existing, setExisting] = useState(false);

  useEffect(() => {
    if (user) {
      supabase.from("student_details").select("*").eq("user_id", user.id).single().then(({ data }) => {
        if (data) {
          setName(data.name);
          setRollNo(data.roll_no);
          setRoomNo(data.room_no);
          setEmail(data.email);
          setExisting(true);
        }
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const payload = { user_id: user.id, name, roll_no: rollNo, room_no: roomNo, email };

    if (existing) {
      const { error } = await supabase.from("student_details").update(payload).eq("user_id", user.id);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "Room details updated!" });
    } else {
      const { error } = await supabase.from("student_details").insert(payload);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else { toast({ title: "Room registered!" }); setExisting(true); }
    }
    setLoading(false);
  };

  return (
    <div className="max-w-lg mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="heading-display text-xl flex items-center gap-2">
            {existing && <CheckCircle className="h-5 w-5 text-success" />}
            {existing ? "Update Room Details" : "Register Room"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Roll Number</Label>
              <Input value={rollNo} onChange={e => setRollNo(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Room Number</Label>
              <Input value={roomNo} onChange={e => setRoomNo(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Email ID</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Saving..." : existing ? "Update Details" : "Register Room"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterRoom;
