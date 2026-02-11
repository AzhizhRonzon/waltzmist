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

    const body = await req.json();
    const { action, target_user_id, target_user_ids } = body;

    if (!action) {
      return new Response(JSON.stringify({ error: "Missing action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let result: any = {};

    switch (action) {
      case "shadow_ban": {
        if (!target_user_id) return errResp("Missing target_user_id");
        const { error } = await adminClient.from("profiles").update({ is_shadow_banned: true }).eq("id", target_user_id);
        if (error) throw error;
        result = { message: `User shadow banned` };
        break;
      }

      case "unshadow_ban": {
        if (!target_user_id) return errResp("Missing target_user_id");
        const { error } = await adminClient.from("profiles").update({ is_shadow_banned: false }).eq("id", target_user_id);
        if (error) throw error;
        result = { message: `User unbanned` };
        break;
      }

      case "delete_user": {
        if (!target_user_id) return errResp("Missing target_user_id");
        // Clean up related data
        await adminClient.from("swipes").delete().or(`swiper_id.eq.${target_user_id},swiped_id.eq.${target_user_id}`);
        await adminClient.from("nudges").delete().or(`sender_id.eq.${target_user_id},receiver_id.eq.${target_user_id}`);
        await adminClient.from("crushes").delete().or(`sender_id.eq.${target_user_id},receiver_id.eq.${target_user_id}`);
        await adminClient.from("blocks").delete().or(`blocker_id.eq.${target_user_id},blocked_id.eq.${target_user_id}`);
        // Delete messages in user's matches
        const { data: userMatches } = await adminClient.from("matches").select("id").or(`user1_id.eq.${target_user_id},user2_id.eq.${target_user_id}`);
        if (userMatches && userMatches.length > 0) {
          await adminClient.from("messages").delete().in("match_id", userMatches.map(m => m.id));
        }
        await adminClient.from("matches").delete().or(`user1_id.eq.${target_user_id},user2_id.eq.${target_user_id}`);
        await adminClient.from("reports").delete().or(`reporter_id.eq.${target_user_id},reported_id.eq.${target_user_id}`);
        await adminClient.from("profiles").delete().eq("id", target_user_id);
        const { error } = await adminClient.auth.admin.deleteUser(target_user_id);
        if (error) throw error;
        result = { message: `User deleted` };
        break;
      }

      case "bulk_delete_users": {
        if (!target_user_ids || !Array.isArray(target_user_ids) || target_user_ids.length === 0) {
          return errResp("Missing target_user_ids array");
        }
        const errors: string[] = [];
        for (const uid of target_user_ids) {
          try {
            await adminClient.from("swipes").delete().or(`swiper_id.eq.${uid},swiped_id.eq.${uid}`);
            await adminClient.from("nudges").delete().or(`sender_id.eq.${uid},receiver_id.eq.${uid}`);
            await adminClient.from("crushes").delete().or(`sender_id.eq.${uid},receiver_id.eq.${uid}`);
            await adminClient.from("blocks").delete().or(`blocker_id.eq.${uid},blocked_id.eq.${uid}`);
            const { data: uMatches } = await adminClient.from("matches").select("id").or(`user1_id.eq.${uid},user2_id.eq.${uid}`);
            if (uMatches && uMatches.length > 0) {
              await adminClient.from("messages").delete().in("match_id", uMatches.map(m => m.id));
            }
            await adminClient.from("matches").delete().or(`user1_id.eq.${uid},user2_id.eq.${uid}`);
            await adminClient.from("reports").delete().or(`reporter_id.eq.${uid},reported_id.eq.${uid}`);
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
          return errResp("Missing target_user_ids array");
        }
        const { error } = await adminClient.from("profiles").update({ is_shadow_banned: true }).in("id", target_user_ids);
        if (error) throw error;
        result = { message: `${target_user_ids.length} users shadow banned` };
        break;
      }

      case "bulk_unshadow_ban": {
        if (!target_user_ids || !Array.isArray(target_user_ids) || target_user_ids.length === 0) {
          return errResp("Missing target_user_ids array");
        }
        const { error } = await adminClient.from("profiles").update({ is_shadow_banned: false }).in("id", target_user_ids);
        if (error) throw error;
        result = { message: `${target_user_ids.length} users unbanned` };
        break;
      }

      case "get_reports": {
        const { data, error } = await adminClient
          .from("reports")
          .select("*, reporter:profiles!reports_reporter_id_fkey(name, email), reported:profiles!reports_reported_id_fkey(name, email)")
          .order("created_at", { ascending: false })
          .limit(200);
        if (error) throw error;
        result = { reports: data };
        break;
      }

      case "get_all_users": {
        const { data, error } = await adminClient
          .from("profiles")
          .select("id, name, email, program, section, sex, age, is_shadow_banned, created_at, photo_urls, maggi_metric, favorite_trip, party_spot, red_flag")
          .order("created_at", { ascending: false });
        if (error) throw error;
        result = { users: data };
        break;
      }

      case "get_stats": {
        const [profileRes, matchRes, reportRes, swipeRes, crushRes, nudgeRes] = await Promise.all([
          adminClient.from("profiles").select("*", { count: "exact", head: true }),
          adminClient.from("matches").select("*", { count: "exact", head: true }),
          adminClient.from("reports").select("*", { count: "exact", head: true }),
          adminClient.from("swipes").select("*", { count: "exact", head: true }),
          adminClient.from("crushes").select("*", { count: "exact", head: true }),
          adminClient.from("nudges").select("*", { count: "exact", head: true }),
        ]);
        
        // Gender breakdown
        const { data: genderData } = await adminClient.from("profiles").select("sex");
        const genderBreakdown: Record<string, number> = {};
        (genderData || []).forEach((p: any) => {
          genderBreakdown[p.sex] = (genderBreakdown[p.sex] || 0) + 1;
        });

        // Program breakdown
        const { data: programData } = await adminClient.from("profiles").select("program");
        const programBreakdown: Record<string, number> = {};
        (programData || []).forEach((p: any) => {
          programBreakdown[p.program] = (programBreakdown[p.program] || 0) + 1;
        });

        // Shadow banned count
        const { count: bannedCount } = await adminClient.from("profiles").select("*", { count: "exact", head: true }).eq("is_shadow_banned", true);

        result = {
          total_users: profileRes.count ?? 0,
          total_matches: matchRes.count ?? 0,
          total_reports: reportRes.count ?? 0,
          total_swipes: swipeRes.count ?? 0,
          total_crushes: crushRes.count ?? 0,
          total_nudges: nudgeRes.count ?? 0,
          shadow_banned: bannedCount ?? 0,
          gender_breakdown: genderBreakdown,
          program_breakdown: programBreakdown,
        };
        break;
      }

      case "get_matches": {
        const { data, error } = await adminClient
          .from("matches")
          .select("*, user1:profiles!matches_user1_id_fkey(name, email), user2:profiles!matches_user2_id_fkey(name, email)")
          .order("matched_at", { ascending: false })
          .limit(200);
        if (error) throw error;
        result = { matches: data };
        break;
      }

      case "delete_match": {
        const matchId = body.match_id;
        if (!matchId) return errResp("Missing match_id");
        await adminClient.from("messages").delete().eq("match_id", matchId);
        const { error } = await adminClient.from("matches").delete().eq("id", matchId);
        if (error) throw error;
        result = { message: "Match deleted" };
        break;
      }

      case "create_user": {
        const { email, password, name, program, sex, age, section } = body;
        if (!email || !password || !name || !program || !sex || !age) {
          return errResp("Missing required fields: email, password, name, program, sex, age");
        }
        const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });
        if (createErr) throw createErr;
        const { error: profileErr } = await adminClient.from("profiles").insert({
          id: newUser.user.id,
          email,
          name,
          program,
          sex,
          age: parseInt(age),
          section: section || null,
          email_verified: true,
        });
        if (profileErr) throw profileErr;
        result = { message: `User ${email} created`, user_id: newUser.user.id };
        break;
      }

      case "dismiss_report": {
        const reportId = body.report_id;
        if (!reportId) return errResp("Missing report_id");
        const { error } = await adminClient.from("reports").delete().eq("id", reportId);
        if (error) throw error;
        result = { message: "Report dismissed" };
        break;
      }

      case "export_users_csv": {
        const { data, error } = await adminClient
          .from("profiles")
          .select("name, email, program, section, sex, age, is_shadow_banned, created_at")
          .order("created_at", { ascending: false });
        if (error) throw error;
        const header = "Name,Email,Program,Section,Sex,Age,Banned,Joined";
        const rows = (data || []).map((u: any) =>
          `"${u.name}","${u.email}","${u.program}","${u.section || ""}","${u.sex}","${u.age}","${u.is_shadow_banned}","${u.created_at}"`
        );
        result = { csv: [header, ...rows].join("\n") };
        break;
      }

      case "reset_swipes": {
        if (!target_user_id) return errResp("Missing target_user_id");
        const { error, count } = await adminClient.from("swipes").delete()
          .eq("swiper_id", target_user_id)
          .eq("direction", "dislike");
        if (error) throw error;
        result = { message: `Swipe history reset — ${count ?? 0} rejected profiles will reappear` };
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

function errResp(msg: string) {
  return new Response(JSON.stringify({ error: msg }), {
    status: 400,
    headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
  });
}

serve(handler);
