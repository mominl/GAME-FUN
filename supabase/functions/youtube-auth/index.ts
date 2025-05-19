
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

// Constants for YouTube OAuth - getting values from Deno.env for server-side security
const YOUTUBE_CLIENT_ID = Deno.env.get("YOUTUBE_CLIENT_ID") || "";
const YOUTUBE_CLIENT_SECRET = Deno.env.get("YOUTUBE_CLIENT_SECRET") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// CORS headers for the response
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Function to create a Supabase client with the service role key
const createSupabaseAdmin = () => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("Missing Supabase URL or service role key");
    throw new Error("Missing required environment variables for Supabase client");
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get code from URL or request body
    let code;
    let walletAddress;

    // For POST requests (from our frontend)
    try {
      const body = await req.json();
      code = body.code;
      walletAddress = body.walletAddress;
      
      console.log("Received request with code and wallet address:", { 
        code: code ? code.substring(0, 10) + "..." : "undefined", 
        walletAddress 
      });
    } catch (e) {
      console.error("Failed to parse request body:", e);
      return new Response(
        JSON.stringify({ error: "Invalid request format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Validate required parameters
    if (!code) {
      console.error("Missing code parameter");
      return new Response(
        JSON.stringify({ error: "Missing authorization code" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!walletAddress) {
      console.error("Missing walletAddress parameter");
      return new Response(
        JSON.stringify({ error: "Missing wallet address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use the frontend URL as redirect URI - IMPORTANT: This must match what's set in Google Cloud Console
    const redirectUri = "https://gamefun-genesis-launch.lovable.app/api/auth/youtube";
    console.log("Using redirect URI:", redirectUri);

    // Exchange code for access token
    console.log("Exchanging code for access token...");
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: YOUTUBE_CLIENT_ID,
        client_secret: YOUTUBE_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();
    
    if (!tokenResponse.ok) {
      console.error("YouTube token exchange error:", tokenData);
      return new Response(
        JSON.stringify({ error: "Failed to exchange code for token", details: tokenData }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const accessToken = tokenData.access_token;
    console.log("Successfully obtained access token");

    // Get YouTube channel data
    console.log("Fetching YouTube channel data...");
    const channelResponse = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true", 
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const channelData = await channelResponse.json();
    
    if (!channelResponse.ok) {
      console.error("YouTube channel data error:", channelData);
      return new Response(
        JSON.stringify({ error: "Failed to fetch YouTube channel data", details: channelData }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (!channelData.items || channelData.items.length === 0) {
      console.error("No channel data found");
      return new Response(
        JSON.stringify({ error: "No channel data found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Successfully fetched channel data");
    const channel = channelData.items[0];
    const channelId = channel.id;
    const username = channel.snippet.title;
    const profileImage = channel.snippet.thumbnails.default.url;
    const subscribers = parseInt(channel.statistics.subscriberCount) || 0;

    console.log("Channel info:", { channelId, username, subscribers });

    // Check verification status
    const isVerified = subscribers >= 1000;
    console.log("Verification status:", isVerified ? "Verified" : "Not verified");

    try {
      // Initialize Supabase client
      console.log("Initializing Supabase client...");
      const supabase = createSupabaseAdmin();

      // Check if creator already exists
      console.log("Checking if creator exists for wallet:", walletAddress);
      const { data: existingCreator, error: fetchError } = await supabase
        .from('creators')
        .select('*')
        .eq('wallet_address', walletAddress)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error("Error fetching creator:", fetchError);
        throw new Error(`Failed to check if creator exists: ${fetchError.message}`);
      }

      console.log("Creator exists?", existingCreator ? "Yes" : "No");

      let result;
      if (existingCreator) {
        // Update existing creator
        console.log("Updating existing creator record");
        result = await supabase
          .from('creators')
          .update({
            youtube_channel_id: channelId,
            youtube_username: username,
            youtube_subscribers: subscribers,
            youtube_profile_image: profileImage,
            youtube_verified: isVerified,
            verified: isVerified,
            verified_by: isVerified ? ["youtube"] : [],
          })
          .eq('wallet_address', walletAddress);

        if (result.error) {
          console.error("Error updating creator:", result.error);
          throw new Error(`Failed to update creator: ${result.error.message}`);
        }
      } else {
        // Create new creator
        console.log("Creating new creator record");
        result = await supabase
          .from('creators')
          .insert({
            wallet_address: walletAddress,
            youtube_channel_id: channelId,
            youtube_username: username,
            youtube_subscribers: subscribers,
            youtube_profile_image: profileImage,
            youtube_verified: isVerified,
            verified: isVerified,
            verified_by: isVerified ? ["youtube"] : [],
          });

        if (result.error) {
          console.error("Error creating creator:", result.error);
          throw new Error(`Failed to create creator: ${result.error.message}`);
        }
      }

      console.log("Successfully saved creator data");
      
      // Return response
      return new Response(
        JSON.stringify({ 
          success: true, 
          verified: isVerified, 
          subscribers, 
          username,
          profileImage 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    } catch (dbError) {
      console.error("Database operation error:", dbError);
      return new Response(
        JSON.stringify({ error: "Database operation failed", details: dbError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
