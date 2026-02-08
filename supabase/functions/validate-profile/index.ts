import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ProfilePayload {
  name: string;
  program: string;
  section?: string;
  sex: string;
  age: number;
  maggiMetric?: number;
  favoriteTrip?: string;
  partySpot?: string;
  redFlag?: string;
  photoUrls?: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: ProfilePayload = await req.json();
    const errors: string[] = [];

    // Name validation
    if (!payload.name || typeof payload.name !== "string") {
      errors.push("Name is required.");
    } else if (payload.name.trim().length < 2 || payload.name.trim().length > 50) {
      errors.push("Name must be 2-50 characters.");
    }

    // Program validation
    const validPrograms = ["PGP24", "PGP25", "PGPEx", "IPM", "PhD"];
    if (!payload.program || !validPrograms.includes(payload.program)) {
      errors.push("Invalid program selected.");
    }

    // Sex validation
    if (!payload.sex || !["male", "female"].includes(payload.sex)) {
      errors.push("Sex must be male or female.");
    }

    // Age validation
    if (!payload.age || typeof payload.age !== "number" || payload.age < 18 || payload.age > 99) {
      errors.push("Age must be between 18 and 99.");
    }

    // Section validation (optional)
    if (payload.section && !["1", "2", "3", "4", "5", "6"].includes(payload.section)) {
      errors.push("Invalid section.");
    }

    // Maggi Metric
    if (payload.maggiMetric !== undefined && (payload.maggiMetric < 0 || payload.maggiMetric > 100)) {
      errors.push("Maggi metric must be 0-100.");
    }

    // Text length limits
    if (payload.favoriteTrip && payload.favoriteTrip.length > 100) {
      errors.push("Favorite trip must be under 100 chars.");
    }
    if (payload.partySpot && payload.partySpot.length > 100) {
      errors.push("Party spot must be under 100 chars.");
    }
    if (payload.redFlag && payload.redFlag.length > 120) {
      errors.push("Red flag must be under 120 chars.");
    }

    // Photo URLs
    if (payload.photoUrls && payload.photoUrls.length > 4) {
      errors.push("Maximum 4 photos allowed.");
    }

    if (errors.length > 0) {
      return new Response(JSON.stringify({ valid: false, errors }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ valid: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ valid: false, errors: ["Invalid request body."] }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
