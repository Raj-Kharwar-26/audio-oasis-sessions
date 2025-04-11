
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

    console.log("Searching YouTube for:", query);

    // For this demo, we'll create a simple function that simulates YouTube search results
    // In a real implementation, you would use the YouTube Data API
    // You would need to set up a YouTube API key in your Supabase secrets
    
    // Save search query to history if userId is provided
    if (userId) {
      await supabase.from("search_history").insert({
        user_id: userId,
        query,
      });
    }

    // This is a simulated response - in a real implementation, 
    // you would make an API call to YouTube Data API
    const videoId = await simulateYouTubeSearch(query);
    
    return new Response(
      JSON.stringify({ videoId }),
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

// Simulate YouTube search - in a real implementation, use the YouTube Data API
async function simulateYouTubeSearch(query: string): Promise<string | null> {
  try {
    // This is just a simulation - it generates a fake video ID
    // In a real implementation, you would make an API call to the YouTube Data API
    
    // Create a deterministic "video ID" based on the query string
    // This ensures the same query always returns the same ID
    const hash = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(query)
    );
    
    // Convert the hash to a string that looks like a YouTube video ID
    const hashArray = Array.from(new Uint8Array(hash));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Return first 11 characters to simulate a YouTube video ID
    return hashHex.substring(0, 11);
    
    // In a real implementation, use the YouTube API:
    /*
    const API_KEY = Deno.env.get("YOUTUBE_API_KEY");
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&key=${API_KEY}`
    );
    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      return data.items[0].id.videoId;
    }
    return null;
    */
  } catch (error) {
    console.error("Error in YouTube search:", error);
    return null;
  }
}
