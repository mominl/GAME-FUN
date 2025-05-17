
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

// Constants for Twitch OAuth
const TWITCH_CLIENT_ID = Deno.env.get("TWITCH_CLIENT_ID") || "";
const TWITCH_CLIENT_SECRET = Deno.env.get("TWITCH_CLIENT_SECRET") || "";
const TWITCH_REDIRECT_URI = Deno.env.get("TWITCH_REDIRECT_URI") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_KEY") || "";

// CORS headers for the response
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Function to create a Supabase client with the service role key
const createSupabaseAdmin = () => createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const walletAddress = url.searchParams.get("state");
    
    // Validate required parameters
    if (!code || !walletAddress) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Exchange code for access token
    const tokenResponse = await fetch("https://id.twitch.tv/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: TWITCH_CLIENT_ID,
        client_secret: TWITCH_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: TWITCH_REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error("Twitch token exchange error:", errorData);
      return new Response(
        JSON.stringify({ error: "Failed to exchange code for token" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Get user data from Twitch API
    const userResponse = await fetch("https://api.twitch.tv/helix/users", {
      headers: {
        "Client-ID": TWITCH_CLIENT_ID,
        "Authorization": `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      const errorData = await userResponse.json();
      console.error("Twitch user data error:", errorData);
      return new Response(
        JSON.stringify({ error: "Failed to fetch Twitch user data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userData = await userResponse.json();
    const user = userData.data[0];

    if (!user) {
      return new Response(
        JSON.stringify({ error: "No user data found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get followers count
    const followResponse = await fetch(`https://api.twitch.tv/helix/users/follows?to_id=${user.id}`, {
      headers: {
        "Client-ID": TWITCH_CLIENT_ID,
        "Authorization": `Bearer ${accessToken}`,
      },
    });

    if (!followResponse.ok) {
      console.error("Failed to fetch follower count");
    }

    const followData = await followResponse.json();
    const followers = followData.total || 0;

    // Check verification status
    const isVerified = followers >= 500;
    const verifiedBy = isVerified ? ["twitch"] : [];

    // Initialize Supabase client
    const supabase = createSupabaseAdmin();

    // Check if creator already exists
    const { data: existingCreator } = await supabase
      .from('creators')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    if (existingCreator) {
      // Update existing creator
      const { error: updateError } = await supabase
        .from('creators')
        .update({
          twitch_id: user.id,
          twitch_username: user.login,
          twitch_followers: followers,
          twitch_profile_image: user.profile_image_url,
          twitch_verified: isVerified,
          verified: existingCreator.youtube_verified || isVerified,
          verified_by: [...new Set([...existingCreator.verified_by, ...(isVerified ? ["twitch"] : [])])],
        })
        .eq('wallet_address', walletAddress);

      if (updateError) {
        console.error("Error updating creator:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to update creator" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      // Create new creator
      const { error: insertError } = await supabase
        .from('creators')
        .insert({
          wallet_address: walletAddress,
          twitch_id: user.id,
          twitch_username: user.login,
          twitch_followers: followers,
          twitch_profile_image: user.profile_image_url,
          twitch_verified: isVerified,
          verified: isVerified,
          verified_by: isVerified ? ["twitch"] : [],
        });

      if (insertError) {
        console.error("Error creating creator:", insertError);
        return new Response(
          JSON.stringify({ error: "Failed to create creator" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Redirect back to the app
    return new Response(
      JSON.stringify({ 
        success: true, 
        verified: isVerified, 
        followers, 
        username: user.login,
        profileImage: user.profile_image_url 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
