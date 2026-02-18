import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type SOSAlert = { id: string; room_no: string; triggered_by_name: string | null; created_at: string };

const AdminSOS = () => {
  const [alerts, setAlerts] = useState<SOSAlert[]>([]);

  useEffect(() => {
    supabase.from("sos_alerts").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      if (data) setAlerts(data as SOSAlert[]);
    });

    // Realtime subscription
    const channel = supabase.channel("sos-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "sos_alerts" }, (payload) => {
        setAlerts(prev => [payload.new as SOSAlert, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="heading-display text-2xl flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-destructive" /> SOS Alerts
        </h1>
        <p className="text-muted-foreground">Emergency alerts from students</p>
      </div>
      {alerts.length === 0 ? (
        <Card><CardContent className="p-6 text-center text-muted-foreground">No SOS alerts</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {alerts.map(a => (
            <Card key={a.id} className="border-destructive/30">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">
                    🚨 SOS Emergency Triggered in Room <span className="text-destructive">{a.room_no}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    By {a.triggered_by_name || "Anonymous"} · {new Date(a.created_at).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminSOS;
