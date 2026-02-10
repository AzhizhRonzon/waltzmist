import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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
    const { email } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Missing email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!email.endsWith("@iimshillong.ac.in")) {
      return new Response(JSON.stringify({ error: "Only @iimshillong.ac.in emails allowed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Generate 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));

    // Invalidate previous unused codes for this email
    await adminClient
      .from("verification_codes")
      .update({ used: true })
      .eq("email", email)
      .eq("used", false);

    // Store new code
    const { error: insertError } = await adminClient.from("verification_codes").insert({
      email,
      code: otp,
    });

    if (insertError) {
      console.error("Failed to store OTP:", insertError);
      return new Response(JSON.stringify({ error: "Failed to generate code" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send via Resend
    const { data, error: sendError } = await resend.emails.send({
      from: "WALTZ <onboarding@resend.dev>",
      to: [email],
      subject: "🌸 Your WALTZ Verification Code",
      html: `
        <div style="font-family: 'Georgia', serif; max-width: 420px; margin: 0 auto; padding: 40px 30px; background: linear-gradient(135deg, #1a0a0f 0%, #2d0a1a 50%, #1a0a0f 100%); border-radius: 24px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="font-size: 48px; font-weight: bold; background: linear-gradient(135deg, #ffb4c2, #e87a9f); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0; letter-spacing: 4px;">WALTZ</h1>
            <p style="color: #8a7a7f; font-size: 13px; margin-top: 8px;">The music is about to start 🌸</p>
          </div>
          <div style="background: rgba(255,180,194,0.08); border: 1px solid rgba(255,180,194,0.15); border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <p style="color: #c9b9be; font-size: 13px; margin: 0 0 16px 0;">Your verification code is</p>
            <div style="font-size: 36px; font-weight: bold; letter-spacing: 10px; color: #ffb4c2; font-family: monospace; padding: 12px; background: rgba(255,180,194,0.05); border-radius: 12px;">${otp}</div>
            <p style="color: #6a5a5f; font-size: 11px; margin: 16px 0 0 0;">This code expires in 10 minutes</p>
          </div>
          <p style="color: #6a5a5f; font-size: 11px; text-align: center; margin: 0;">
            If you didn't request this, you can safely ignore this email.<br/>
            Only @iimshillong.ac.in emails allowed. No exceptions.
          </p>
        </div>
      `,
    });

    if (sendError) {
      console.error("Resend error:", sendError);
      return new Response(JSON.stringify({ error: "Failed to send email" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("OTP email sent:", data?.id);
    return new Response(JSON.stringify({ success: true }), {
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
