import React, { useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const SOSButton = () => {
  const [open, setOpen] = useState(false);
  const [roomNo, setRoomNo] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, username } = useAuth();
  const { toast } = useToast();

  const handleSOS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomNo.trim()) return;
    setLoading(true);

    const { error } = await supabase.from("sos_alerts").insert({
      room_no: roomNo.trim(),
      triggered_by: user?.id ?? undefined,
      triggered_by_name: username ?? "Anonymous",
      is_anonymous: !user,
    } as any);
    setLoading(false);

    if (error) {
      toast({ title: "SOS Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "🚨 SOS Alert Sent!", description: `Emergency alert sent for Room ${roomNo}` });
      setOpen(false);
      setRoomNo("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" className="gap-2 font-semibold animate-pulse hover:animate-none">
          <AlertTriangle className="h-4 w-4" /> SOS
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="heading-display text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" /> Emergency SOS
          </DialogTitle>
          <DialogDescription>
            This will send an emergency alert to all administrators immediately.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSOS} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sos-room">Room Number</Label>
            <Input id="sos-room" value={roomNo} onChange={e => setRoomNo(e.target.value)} placeholder="e.g. 204" required />
          </div>
          <Button type="submit" variant="destructive" className="w-full" disabled={loading}>
            {loading ? "Sending Alert..." : "🚨 Send SOS Alert"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SOSButton;
