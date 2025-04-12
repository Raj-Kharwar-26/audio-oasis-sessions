
import { supabase } from "@/integrations/supabase/client";
import { Song } from "@/types";
import { toast } from "sonner";

export async function searchYouTubeSongs(query: string): Promise<Song[]> {
  try {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData.user?.id;
    
    console.log("Invoking YouTube search function with query:", query);
    const { data, error } = await supabase.functions.invoke("youtube-search", {
      body: { 
        query,
        userId
      },
    });

    if (error) {
      console.error("Error searching YouTube songs:", error);
      toast.error("Failed to search songs. Please try again.");
      return [];
    }

    if (!data || !data.tracks) {
      console.warn("No tracks returned from YouTube search");
      return [];
    }

    return data.tracks.map((track: any) => ({
      ...track,
      // Ensure all songs have the required properties
      votes: track.votes || [],
      addedBy: track.addedBy || userId || "system"
    }));
  } catch (error) {
    console.error("Error searching YouTube songs:", error);
    toast.error("Failed to search songs. Please try again.");
    return [];
  }
}

export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=1&controls=0`;
}
