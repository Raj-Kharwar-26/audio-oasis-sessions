
import { serve } from "https://deno.land/std@0.182.0/http/server.ts";

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
    const { songTitle, artist } = requestBody;

    if (!songTitle || !artist) {
      return new Response(
        JSON.stringify({ error: "Song title and artist are required" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Get YouTube API key from environment
    const youtubeApiKey = Deno.env.get("YOUTUBE_API_KEY");
    if (!youtubeApiKey) {
      console.error("YouTube API key not found in environment");
      return new Response(
        JSON.stringify({ error: "YouTube API key not configured" }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Create search query for YouTube
    const searchQuery = `${songTitle} ${artist} official audio`;
    const encodedQuery = encodeURIComponent(searchQuery);
    
    console.log("Searching YouTube for:", searchQuery);

    // Call YouTube API
    const youtubeResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodedQuery}&type=video&maxResults=1&key=${youtubeApiKey}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const youtubeData = await youtubeResponse.json();

    if (!youtubeResponse.ok) {
      console.error("YouTube search failed:", youtubeData);
      return new Response(
        JSON.stringify({ error: "YouTube search failed", details: youtubeData }),
        { status: youtubeResponse.status, headers: corsHeaders }
      );
    }

    // Extract video ID
    if (!youtubeData.items || youtubeData.items.length === 0) {
      console.log("No YouTube videos found for query:", searchQuery);
      return new Response(
        JSON.stringify({ error: "No YouTube videos found" }),
        { status: 404, headers: corsHeaders }
      );
    }

    const videoId = youtubeData.items[0].id.videoId;
    const videoTitle = youtubeData.items[0].snippet.title;
    
    console.log(`Found YouTube video: "${videoTitle}" (${videoId})`);

    return new Response(
      JSON.stringify({ 
        videoId, 
        title: videoTitle 
      }),
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
