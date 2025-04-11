import { supabase } from "@/integrations/supabase/client";
import { Song, Session } from "@/types";
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

export async function getYouTubeVideoId(songTitle: string, artist: string): Promise<string | null> {
  try {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData.user?.id;
    
    if (!userId) {
      console.error("User not authenticated");
      toast.error("You must be logged in to play full songs");
      return null;
    }
    
    console.log(`Getting YouTube video for: ${songTitle} by ${artist}`);
    const { data, error } = await supabase.functions.invoke("youtube-search", {
      body: { 
        songTitle,
        artist,
        userId
      },
    });

    if (error) {
      console.error("Error getting YouTube video:", error);
      toast.error("Failed to load full song. Using preview instead.");
      return null;
    }

    if (!data || !data.videoId) {
      console.warn("No YouTube video ID returned");
      return null;
    }

    console.log(`Found YouTube video ID: ${data.videoId} for ${songTitle}`);
    return data.videoId;
  } catch (error) {
    console.error("Error getting YouTube video:", error);
    toast.error("Failed to load full song. Using preview instead.");
    return null;
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

export async function saveSession(session: Session): Promise<boolean> {
  try {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData.user?.id;
    
    if (!userId) {
      console.error("User not authenticated");
      toast.error("You must be logged in to save sessions");
      return false;
    }
    
    if (!session.timestamp) {
      session.timestamp = Date.now();
    }
    
    const savedSessions = JSON.parse(localStorage.getItem('userSessions') || '[]');
    const sessionExists = savedSessions.some((s: Session) => s.id === session.id);
    
    if (!sessionExists) {
      savedSessions.unshift(session);
      localStorage.setItem('userSessions', JSON.stringify(savedSessions));
      console.log(`New session saved: ${session.id} - ${session.name}`);
    } else {
      const updatedSessions = savedSessions.map((s: Session) => 
        s.id === session.id ? session : s
      );
      localStorage.setItem('userSessions', JSON.stringify(updatedSessions));
      console.log(`Session updated: ${session.id} - ${session.name}`);
    }
    
    return true;
  } catch (error) {
    console.error("Error saving session:", error);
    toast.error("Failed to save session");
    return false;
  }
}

export async function getSession(sessionId: string): Promise<Session | null> {
  try {
    if (!sessionId) {
      console.error("No session ID provided");
      return null;
    }
    
    console.log(`Attempting to find session: ${sessionId}`);
    
    const savedSessions = JSON.parse(localStorage.getItem('userSessions') || '[]');
    console.log(`Found ${savedSessions.length} total saved sessions`);
    
    const session = savedSessions.find((s: Session) => s.id === sessionId);
    
    if (!session) {
      console.warn(`Session not found: ${sessionId}`);
      return null;
    }
    
    console.log(`Session found: ${session.name} (ID: ${session.id})`);
    return session;
  } catch (error) {
    console.error("Error getting session:", error);
    return null;
  }
}

export function getUserSessions(): Session[] {
  try {
    const sessions = JSON.parse(localStorage.getItem('userSessions') || '[]');
    console.log(`Retrieved ${sessions.length} user sessions from storage`);
    return sessions;
  } catch (error) {
    console.error("Error getting user sessions:", error);
    return [];
  }
}

export function deleteSession(sessionId: string): boolean {
  try {
    const savedSessions = JSON.parse(localStorage.getItem('userSessions') || '[]');
    const initialCount = savedSessions.length;
    const updatedSessions = savedSessions.filter((s: Session) => s.id !== sessionId);
    
    if (initialCount === updatedSessions.length) {
      console.warn(`Session ${sessionId} not found for deletion`);
      return false;
    }
    
    localStorage.setItem('userSessions', JSON.stringify(updatedSessions));
    console.log(`Session ${sessionId} deleted. ${updatedSessions.length} sessions remaining.`);
    
    return true;
  } catch (error) {
    console.error("Error deleting session:", error);
    return false;
  }
}
