
import { supabase } from "@/integrations/supabase/client";
import { Song } from "@/types";
import { toast } from "sonner";

export async function searchSongs(query: string): Promise<Song[]> {
  try {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData.user?.id;
    
    if (!userId) {
      console.error("User not authenticated");
      toast.error("You must be logged in to search for songs");
      return [];
    }
    
    console.log("Invoking Spotify search function with query:", query);
    const { data, error } = await supabase.functions.invoke("spotify-search", {
      body: { 
        query,
        userId
      },
    });

    if (error) {
      console.error("Error searching songs:", error);
      toast.error("Failed to search songs. Please try again.");
      return [];
    }

    console.log("Spotify search response:", data);

    if (!data || !Array.isArray(data.tracks) || data.tracks.length === 0) {
      console.warn("No tracks returned from search or invalid response format");
      return [];
    }

    return data.tracks.map((track: any) => ({
      id: track.id,
      title: track.title,
      artist: track.artist,
      album: track.album || "",
      cover: track.cover || "",
      duration: track.duration || 0,
      url: track.url || "",
      votes: track.votes || [],
      addedBy: track.addedBy || userId || "system"
    }));
  } catch (error) {
    console.error("Error searching songs:", error);
    toast.error("Failed to search songs. Please try again.");
    return [];
  }
}

export async function addSongToDatabase(song: Song): Promise<string | null> {
  try {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData.user?.id;
    
    if (!userId) {
      console.error("User not authenticated");
      toast.error("You must be logged in to add songs");
      return null;
    }
    
    const { data, error } = await supabase
      .from("songs")
      .insert({
        id: song.id,
        title: song.title,
        artist: song.artist,
        album: song.album,
        cover: song.cover,
        duration: song.duration,
        url: song.url,
        added_by: song.addedBy || userId
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error adding song to database:", error);
      toast.error("Failed to add song to database");
      return null;
    }

    toast.success(`"${song.title}" added to database`);
    return data?.id || null;
  } catch (error) {
    console.error("Error adding song to database:", error);
    toast.error("Failed to add song to database");
    return null;
  }
}
