
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const YOUTUBE_API_KEY = Deno.env.get("YOUTUBE_API_KEY");

interface SearchRequest {
  query: string;
  userId?: string;
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { query } = await req.json() as SearchRequest;
    
    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Query parameter is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    if (!YOUTUBE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'YouTube API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Construct search query for music
    const searchQuery = `${query} audio`;
    
    // Call YouTube API
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&q=${encodeURIComponent(
      searchQuery
    )}&type=video&key=${YOUTUBE_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to search YouTube');
    }

    // Format results to match our Song type
    const songs = data.items.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      artist: item.snippet.channelTitle,
      album: "",
      cover: item.snippet.thumbnails.high.url,
      duration: 0, // YouTube API doesn't provide duration in search results
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      youtubeId: item.id.videoId,
      addedBy: "",
      votes: []
    }));

    return new Response(
      JSON.stringify({ tracks: songs }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("YouTube search error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
