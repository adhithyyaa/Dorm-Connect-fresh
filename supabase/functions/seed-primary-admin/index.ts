import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if primary admin already exists
    const { data: existing } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("role", "primary_admin")
      .limit(1);

    if (existing && existing.length > 0) {
      return new Response(JSON.stringify({ message: "Primary admin already exists" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create the primary admin user
    const { data: user, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: "primaryadmin@dormconnect.app",
      password: "ADMIN@123",
      email_confirm: true,
      user_metadata: { username: "Primary Admin" },
    });

    if (createError) throw createError;

    // Assign role
    const { error: roleError } = await supabaseAdmin.from("user_roles").insert({
      user_id: user.user.id,
      role: "primary_admin",
      approval_status: "approved",
    });

    if (roleError) throw roleError;

    return new Response(JSON.stringify({ message: "Primary admin created successfully" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
