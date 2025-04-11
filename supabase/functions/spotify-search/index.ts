
import { serve } from "https://deno.land/std@0.182.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// CORS headers
const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
};

serve(async (req) => {
  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: corsHeaders }
    );
  }

  try {
    const requestBody = await req.json();
    const { query, userId } = requestBody;

    if (!query) {
      return new Response(
        JSON.stringify({ error: "Query parameter is required" }),
        { status: 400, headers: corsHeaders }
      );
    }

    console.log("Getting Spotify token...");
    // Get Spotify token
    const tokenResponse = await fetch(`${supabaseUrl}/functions/v1/spotify-token`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
    });
    
    const tokenData = await tokenResponse.json();
    
    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error("Failed to get Spotify token:", tokenData);
      return new Response(
        JSON.stringify({ error: "Failed to get Spotify token", details: tokenData }),
        { status: tokenResponse.status, headers: corsHeaders }
      );
    }

    console.log("Token retrieved successfully, searching Spotify with query:", query);

    // Save search query to history if userId is provided
    if (userId) {
      await supabase.from("search_history").insert({
        user_id: userId,
        query,
      });
    }

    // Search Spotify with proper encoding
    const encodedQuery = encodeURIComponent(query);
    console.log("Encoded query:", encodedQuery);
    
    const spotifyResponse = await fetch(
      `https://api.spotify.com/v1/search?q=${encodedQuery}&type=track&limit=20&market=US`,
      {
        headers: {
          "Authorization": `Bearer ${tokenData.access_token}`,
        },
      }
    );

    const spotifyData = await spotifyResponse.json();

    if (!spotifyResponse.ok) {
      console.error("Spotify search failed:", spotifyData);
      return new Response(
        JSON.stringify({ error: "Spotify search failed", details: spotifyData }),
        { status: spotifyResponse.status, headers: corsHeaders }
      );
    }

    console.log(`Found ${spotifyData.tracks?.items?.length || 0} tracks`);
    
    if (!spotifyData.tracks || !spotifyData.tracks.items || spotifyData.tracks.items.length === 0) {
      console.log("No tracks found for query:", query);
      return new Response(
        JSON.stringify({ tracks: [] }),
        { headers: corsHeaders }
      );
    }

    // Transform Spotify data to our format
    const tracks = spotifyData.tracks.items
      .filter(track => track !== null)
      .map(track => ({
        id: track.id,
        title: track.name,
        artist: track.artists.map(a => a.name).join(", "),
        album: track.album.name,
        cover: track.album.images[0]?.url || "",
        duration: Math.round(track.duration_ms / 1000),
        url: track.preview_url || "", // This can be null for some tracks
        addedBy: userId || "system",
        votes: []
      }));

    console.log(`Successfully processed ${tracks.length} tracks`);
    
    return new Response(
      JSON.stringify({ tracks }),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error("Server error:", error);
    return new Response(
      JSON.stringify({ error: "Server error", details: error.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
