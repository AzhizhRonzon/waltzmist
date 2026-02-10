import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden: admin role required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, target_user_id, target_user_ids, reason } = await req.json();

    if (!action) {
      return new Response(JSON.stringify({ error: "Missing action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let result: any = {};

    switch (action) {
      case "shadow_ban": {
        if (!target_user_id) return new Response(JSON.stringify({ error: "Missing target_user_id" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        const { error } = await adminClient.from("profiles").update({ is_shadow_banned: true }).eq("id", target_user_id);
        if (error) throw error;
        result = { message: `User ${target_user_id} shadow banned` };
        break;
      }

      case "unshadow_ban": {
        if (!target_user_id) return new Response(JSON.stringify({ error: "Missing target_user_id" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        const { error } = await adminClient.from("profiles").update({ is_shadow_banned: false }).eq("id", target_user_id);
        if (error) throw error;
        result = { message: `User ${target_user_id} unshadow banned` };
        break;
      }

      case "delete_user": {
        if (!target_user_id) return new Response(JSON.stringify({ error: "Missing target_user_id" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        await adminClient.from("profiles").delete().eq("id", target_user_id);
        const { error } = await adminClient.auth.admin.deleteUser(target_user_id);
        if (error) throw error;
        result = { message: `User ${target_user_id} deleted` };
        break;
      }

      case "bulk_delete_users": {
        if (!target_user_ids || !Array.isArray(target_user_ids) || target_user_ids.length === 0) {
          return new Response(JSON.stringify({ error: "Missing target_user_ids array" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const errors: string[] = [];
        for (const uid of target_user_ids) {
          try {
            await adminClient.from("profiles").delete().eq("id", uid);
            await adminClient.auth.admin.deleteUser(uid);
          } catch (e: any) {
            errors.push(`${uid}: ${e.message}`);
          }
        }
        result = { message: `Deleted ${target_user_ids.length - errors.length}/${target_user_ids.length} users`, errors: errors.length > 0 ? errors : undefined };
        break;
      }

      case "bulk_shadow_ban": {
        if (!target_user_ids || !Array.isArray(target_user_ids) || target_user_ids.length === 0) {
          return new Response(JSON.stringify({ error: "Missing target_user_ids array" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const { error } = await adminClient.from("profiles").update({ is_shadow_banned: true }).in("id", target_user_ids);
        if (error) throw error;
        result = { message: `${target_user_ids.length} users shadow banned` };
        break;
      }

      case "get_reports": {
        const { data, error } = await adminClient
          .from("reports")
          .select("*, reporter:profiles!reports_reporter_id_fkey(name, email), reported:profiles!reports_reported_id_fkey(name, email)")
          .order("created_at", { ascending: false })
          .limit(100);
        if (error) throw error;
        result = { reports: data };
        break;
      }

      case "get_all_users": {
        const { data, error } = await adminClient
          .from("profiles")
          .select("id, name, email, program, section, sex, is_shadow_banned, created_at")
          .order("created_at", { ascending: false });
        if (error) throw error;
        result = { users: data };
        break;
      }

      case "get_stats": {
        const { data: profileCount } = await adminClient.from("profiles").select("id", { count: "exact", head: true });
        const { data: matchCount } = await adminClient.from("matches").select("id", { count: "exact", head: true });
        const { data: reportCount } = await adminClient.from("reports").select("id", { count: "exact", head: true });
        const { data: swipeCount } = await adminClient.from("swipes").select("id", { count: "exact", head: true });
        result = {
          total_users: profileCount,
          total_matches: matchCount,
          total_reports: reportCount,
          total_swipes: swipeCount,
        };
        break;
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Admin action error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
