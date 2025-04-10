
import { supabase } from "@/integrations/supabase/client";
import { Song } from "@/types";
import { toast } from "sonner";

export async function searchSongs(query: string): Promise<Song[]> {
  try {
    const user = supabase.auth.getUser();
    
    const { data, error } = await supabase.functions.invoke("spotify-search", {
      body: { 
        query,
        userId: (await user).data.user?.id
      },
    });

    if (error) {
      console.error("Error searching songs:", error);
      toast.error("Failed to search songs. Please try again.");
      return [];
    }

    return data.tracks || [];
  } catch (error) {
    console.error("Error searching songs:", error);
    toast.error("Failed to search songs. Please try again.");
    return [];
  }
}

export async function addSongToDatabase(song: Song): Promise<string | null> {
  try {
    const { data, error } = await supabase.from("songs").insert({
      id: song.id,
      title: song.title,
      artist: song.artist,
      album: song.album,
      cover: song.cover,
      duration: song.duration,
      url: song.url,
      added_by: song.addedBy
    }).select("id").single();

    if (error) {
      console.error("Error adding song to database:", error);
      return null;
    }

    return data.id;
  } catch (error) {
    console.error("Error adding song to database:", error);
    return null;
  }
}
