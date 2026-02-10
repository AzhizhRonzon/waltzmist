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
    const { email, code, password, action } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Missing email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Action: reset_password — update password for existing user (no code needed, already verified)
    if (action === "reset_password") {
      if (!password || password.length < 6) {
        return new Response(JSON.stringify({ error: "Password must be at least 6 characters" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: existingUsers } = await adminClient.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find((u: any) => u.email === email);

      if (!existingUser) {
        return new Response(JSON.stringify({ error: "User not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: updateError } = await adminClient.auth.admin.updateUserById(existingUser.id, {
        password,
      });

      if (updateError) {
        console.error("Password update error:", updateError);
        return new Response(JSON.stringify({ error: "Failed to update password" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, message: "Password updated" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // All other actions require a code
    if (!code) {
      return new Response(JSON.stringify({ error: "Missing code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find valid, unused code
    const { data: codeRow, error: fetchError } = await adminClient
      .from("verification_codes")
      .select("*")
      .eq("email", email)
      .eq("code", code)
      .eq("used", false)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError || !codeRow) {
      const { data: expiredCode } = await adminClient
        .from("verification_codes")
        .select("id")
        .eq("email", email)
        .eq("code", code)
        .eq("used", false)
        .lt("expires_at", new Date().toISOString())
        .maybeSingle();

      if (expiredCode) {
        return new Response(JSON.stringify({ error: "Code expired. Please request a new one." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Invalid code. Please try again." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark code as used
    await adminClient
      .from("verification_codes")
      .update({ used: true })
      .eq("id", codeRow.id);

    // Action: verify_only — just confirm the code is valid (for forgot password flow)
    if (action === "verify_only") {
      return new Response(JSON.stringify({ success: true, verified: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: signup — create user with password and return session token
    if (!password || password.length < 6) {
      return new Response(JSON.stringify({ error: "Password must be at least 6 characters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user already exists
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find((u: any) => u.email === email);

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
      // Update password and confirm email
      await adminClient.auth.admin.updateUserById(userId, {
        password,
        email_confirm: true,
      });
    } else {
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (createError || !newUser.user) {
        console.error("Failed to create user:", createError);
        return new Response(JSON.stringify({ error: "Failed to create account" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userId = newUser.user.id;
    }

    // Generate a magic link token for immediate sign-in after signup
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: "magiclink",
      email,
    });

    if (linkError || !linkData) {
      console.error("Failed to generate link:", linkError);
      return new Response(JSON.stringify({ error: "Failed to create session" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tokenHash = linkData.properties?.hashed_token;

    if (!tokenHash) {
      console.error("No hashed_token in link data");
      return new Response(JSON.stringify({ error: "Failed to create session token" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      token_hash: tokenHash,
      is_new_user: !existingUser,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
