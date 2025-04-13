import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, Song, Message, User, PlayerState, SongSuggestion } from '@/types';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';
import { YouTubePlayer } from '@/lib/YouTubePlayer';

// Mock data for fallback
import { mockSessions, mockSongs } from '@/lib/mockData';

interface SessionContextType {
  currentSession: Session | null;
  sessions: Session[];
  mySessions: Session[];
  messages: Message[];
  playerState: PlayerState;
  youtubePlayer: YouTubePlayer | null;
  createSession: (name: string) => Promise<string | null>;
  joinSession: (sessionIdOrRoomId: string) => Promise<boolean>;
  leaveSession: () => Promise<void>;
  endSession: (sessionId: string) => Promise<void>;
  sendMessage: (text: string) => void;
  addSong: (song: SongSuggestion) => void;
  voteSong: (songId: string) => void;
  removeSong: (songId: string) => void;
  playPause: () => void;
  nextSong: () => void;
  previousSong: () => void;
  seekTo: (progress: number) => void;
  getSuggestions: () => SongSuggestion[];
  getSessionShareLink: (sessionId: string) => string;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

// Helper function to convert Supabase session to frontend Session type
const mapSupabaseSession = (
  sessionData: any, 
  usersData: any[], 
  playlistData: any[]
): Session => {
  return {
    id: sessionData.id,
    name: sessionData.name,
    hostId: sessionData.creator_id,
    users: usersData.map(userData => ({
      id: userData.user_id,
      name: userData.user_name || 'Unknown User',
      email: '',
      createdAt: new Date(userData.joined_at).getTime()
    })),
    playlist: playlistData.map(song => ({
      id: song.id,
      title: song.title,
      artist: song.artist,
      album: song.album || '',
      cover: song.cover || '',
      duration: song.duration || 0,
      url: song.url,
      youtubeId: song.youtube_id,
      addedBy: song.added_by,
      votes: song.votes || []
    })),
    currentSongIndex: sessionData.current_song_index || 0,
    isPlaying: sessionData.is_playing || false,
    progress: sessionData.progress || 0,
    roomId: sessionData.room_id || '',
  };
};

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [mySessions, setMySessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [playerState, setPlayerState] = useState<PlayerState>(PlayerState.PAUSED);
  const [youtubePlayer, setYoutubePlayer] = useState<YouTubePlayer | null>(null);
  const navigate = useNavigate();

  // Load sessions from Supabase
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const fetchSessions = async () => {
      try {
        const { data: sessionsData, error } = await supabase
          .from('sessions')
          .select('*')
          .eq('status', 'active');
        
        if (error) throw error;
        
        const allSessions: Session[] = [];
        
        for (const sessionData of sessionsData) {
          // Get users for each session
          const { data: usersData, error: usersError } = await supabase
            .from('session_users')
            .select('*')
            .eq('session_id', sessionData.id);
          
          if (usersError) throw usersError;
          
          // Get playlist for each session
          const { data: playlistData, error: playlistError } = await supabase
            .from('session_playlist')
            .select('*, songs(*)')
            .eq('session_id', sessionData.id)
            .order('position', { ascending: true });
          
          if (playlistError) throw playlistError;
          
          const playlist = playlistData.map(item => item.songs);
          
          allSessions.push(mapSupabaseSession(sessionData, usersData, playlist));
        }
        
        setSessions(allSessions);
        
        // Filter my sessions
        if (user) {
          setMySessions(allSessions.filter(session => session.hostId === user.id));
        }
      } catch (error) {
        console.error('Error fetching sessions:', error);
        toast.error('Failed to load sessions');
        
        // Fallback to mock data if there's an error
        setSessions(mockSessions);
      }
    };
    
    fetchSessions();
    
    // Subscribe to session changes
    const sessionsChannel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sessions'
        },
        () => {
          fetchSessions();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(sessionsChannel);
    };
  }, [isAuthenticated, user]);

  // Set up YouTube player effect
  useEffect(() => {
    if (!currentSession) return;
    
    const currentSong = currentSession.playlist[currentSession.currentSongIndex];
    if (!currentSong || !currentSong.youtubeId) return;
    
    if (!youtubePlayer) {
      const player = new YouTubePlayer('youtube-player');
      player.initialize()
        .then(() => {
          player.loadVideoById(currentSong.youtubeId);
          if (currentSession.isPlaying) {
            player.playVideo();
            setPlayerState(PlayerState.PLAYING);
          } else {
            player.pauseVideo();
            setPlayerState(PlayerState.PAUSED);
          }
          player.seekTo(currentSession.progress);
          setYoutubePlayer(player);
        })
        .catch(error => {
          console.error('Failed to initialize YouTube player:', error);
          setPlayerState(PlayerState.ERROR);
        });
    } else {
      youtubePlayer.loadVideoById(currentSong.youtubeId);
      if (currentSession.isPlaying) {
        youtubePlayer.playVideo();
        setPlayerState(PlayerState.PLAYING);
      } else {
        youtubePlayer.pauseVideo();
        setPlayerState(PlayerState.PAUSED);
      }
      youtubePlayer.seekTo(currentSession.progress);
    }
  }, [currentSession]);

  // Add YouTube player ended event listener for autoplay
  useEffect(() => {
    const handleSongEnded = () => {
      if (currentSession) {
        // Only auto-play if there are more songs in the playlist
        if (currentSession.currentSongIndex < currentSession.playlist.length - 1) {
          nextSong();
        }
      }
    };

    document.addEventListener('youtube-player-ended', handleSongEnded);
    
    return () => {
      document.removeEventListener('youtube-player-ended', handleSongEnded);
    };
  }, [currentSession]);

  // Cleanup player on unmount
  useEffect(() => {
    return () => {
      if (youtubePlayer) {
        youtubePlayer.destroy();
      }
    };
  }, []);

  // Progress sync effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (currentSession && currentSession.isPlaying && playerState === PlayerState.PLAYING) {
      interval = setInterval(async () => {
        if (!youtubePlayer) return;
        
        const currentTime = await youtubePlayer.getCurrentTime();
        
        setCurrentSession(prev => {
          if (!prev) return prev;
          
          const currentSong = prev.playlist[prev.currentSongIndex];
          if (!currentSong) return prev;
          
          return {
            ...prev,
            progress: currentTime
          };
        });
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [currentSession, playerState, youtubePlayer]);

  const createSession = async (name: string): Promise<string | null> => {
    if (!user) {
      toast.error('You must be logged in to create a session');
      return null;
    }
    
    if (!name.trim()) {
      toast.error('Session name cannot be empty');
      return null;
    }
    
    try {
      // Create session in Supabase
      const { data: sessionData, error } = await supabase
        .from('sessions')
        .insert({
          name: name.trim(),
          creator_id: user.id,
          room_id: null, // Will be auto-generated by the trigger
          status: 'active',
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Add creator as a user in the session
      const { error: userError } = await supabase
        .from('session_users')
        .insert({
          session_id: sessionData.id,
          user_id: user.id,
          user_name: user.name
        });
      
      if (userError) throw userError;
      
      // Create initial welcome message
      const welcomeMsg: Message = {
        id: `msg_${Date.now()}`,
        userId: 'system',
        userName: 'System',
        text: `Welcome to "${name}" session! Add some songs to the playlist and enjoy the music together.`,
        timestamp: Date.now(),
      };
      setMessages([welcomeMsg]);
      
      // Update local sessions state
      const newSession = mapSupabaseSession(
        sessionData, 
        [{ session_id: sessionData.id, user_id: user.id, user_name: user.name, joined_at: new Date() }], 
        []
      );
      
      setSessions(prev => [...prev, newSession]);
      
      if (user.id === sessionData.creator_id) {
        setMySessions(prev => [...prev, newSession]);
      }
      
      // Set current session and redirect to home
      setCurrentSession(newSession);
      navigate('/');
      
      toast.success(`Session "${name}" created!`);
      return sessionData.room_id;
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error('Failed to create session');
      return null;
    }
  };

  const joinSession = async (sessionIdOrRoomId: string): Promise<boolean> => {
    if (!user) {
      toast.error('You must be logged in to join a session');
      return false;
    }
    
    try {
      // Check if this is a room ID (shorter, alphanumeric) or a UUID
      const isRoomId = sessionIdOrRoomId.length < 36;
      
      // Query by room_id or direct id based on the input
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select('*')
        .eq(isRoomId ? 'room_id' : 'id', sessionIdOrRoomId)
        .eq('status', 'active')
        .single();
      
      if (sessionError) {
        if (sessionError.code === 'PGRST116') {
          toast.error('Session not found or has ended');
        } else {
          throw sessionError;
        }
        return false;
      }
      
      // Get users for the session
      const { data: usersData, error: usersError } = await supabase
        .from('session_users')
        .select('*')
        .eq('session_id', sessionData.id);
      
      if (usersError) throw usersError;
      
      // Get playlist for the session
      const { data: playlistData, error: playlistError } = await supabase
        .from('session_playlist')
        .select('*, songs(*)')
        .eq('session_id', sessionData.id)
        .order('position', { ascending: true });
      
      if (playlistError) throw playlistError;
      
      const playlist = playlistData.map(item => item.songs);
      
      // Check if user is already in the session
      const isUserInSession = usersData.some(u => u.user_id === user.id);
      
      // If not, add them
      if (!isUserInSession) {
        const { error: joinError } = await supabase
          .from('session_users')
          .insert({
            session_id: sessionData.id,
            user_id: user.id,
            user_name: user.name
          });
        
        if (joinError) throw joinError;
        
        // Add join message
        const joinMsg: Message = {
          id: `msg_${Date.now()}`,
          userId: 'system',
          userName: 'System',
          text: `${user.name} joined the session`,
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, joinMsg]);
      }
      
      // Set current session
      const session = mapSupabaseSession(sessionData, usersData, playlist);
      setCurrentSession(session);
      setPlayerState(session.isPlaying ? PlayerState.PLAYING : PlayerState.PAUSED);
      
      // Redirect to the session view
      navigate('/');
      
      toast.success(`Joined "${session.name}" session!`);
      return true;
    } catch (error) {
      console.error('Error joining session:', error);
      toast.error('Failed to join session');
      return false;
    }
  };

  const leaveSession = async () => {
    if (!user || !currentSession) return;
    
    try {
      // Remove user from session_users
      const { error } = await supabase
        .from('session_users')
        .delete()
        .eq('session_id', currentSession.id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // If user is host, consider ending the session
      if (currentSession.hostId === user.id) {
        await endSession(currentSession.id);
      } else {
        // Add leave message
        const leaveMsg: Message = {
          id: `msg_${Date.now()}`,
          userId: 'system',
          userName: 'System',
          text: `${user.name} left the session`,
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, leaveMsg]);
      }
      
      // Clean up
      if (youtubePlayer) {
        youtubePlayer.pauseVideo();
        youtubePlayer.destroy();
        setYoutubePlayer(null);
      }
      
      setCurrentSession(null);
      setPlayerState(PlayerState.PAUSED);
      setMessages([]);
      
      // Navigate back to home
      navigate('/');
    } catch (error) {
      console.error('Error leaving session:', error);
      toast.error('Failed to leave session');
    }
  };

  const endSession = async (sessionId: string) => {
    if (!user) return;
    
    try {
      // Update session status to 'ended'
      const { error } = await supabase
        .from('sessions')
        .update({ status: 'ended' })
        .eq('id', sessionId)
        .eq('creator_id', user.id);
      
      if (error) throw error;
      
      toast.info(`Session has been closed`);
      
      // Clean up if this is the current session
      if (currentSession && currentSession.id === sessionId) {
        if (youtubePlayer) {
          youtubePlayer.pauseVideo();
          youtubePlayer.destroy();
          setYoutubePlayer(null);
        }
        
        setCurrentSession(null);
        setPlayerState(PlayerState.PAUSED);
        setMessages([]);
      }
      
      // Refresh sessions
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      setMySessions(prev => prev.filter(s => s.id !== sessionId));
    } catch (error) {
      console.error('Error ending session:', error);
      toast.error('Failed to end session');
    }
  };

  const sendMessage = (text: string) => {
    if (!user || !currentSession || !text.trim()) return;
    
    const newMessage: Message = {
      id: `msg_${Date.now()}`,
      userId: user.id,
      userName: user.name,
      text: text.trim(),
      timestamp: Date.now(),
    };
    
    setMessages(prev => [...prev, newMessage]);
  };

  const addSong = async (song: SongSuggestion) => {
    if (!user || !currentSession) return;
    
    try {
      // Add song to database
      const { data: songData, error: songError } = await supabase
        .from('songs')
        .insert({
          title: song.title,
          artist: song.artist,
          album: song.album || '',
          cover: song.cover || '',
          duration: song.duration || 0,
          url: song.url,
          youtube_id: song.youtubeId,
          added_by: user.id,
        })
        .select()
        .single();
      
      if (songError) throw songError;
      
      // Get current playlist length
      const { data: playlistData, error: playlistCountError } = await supabase
        .from('session_playlist')
        .select('position')
        .eq('session_id', currentSession.id)
        .order('position', { ascending: false })
        .limit(1);
      
      if (playlistCountError) throw playlistCountError;
      
      const position = playlistData.length > 0 ? playlistData[0].position + 1 : 0;
      
      // Add to session playlist
      const { error: addError } = await supabase
        .from('session_playlist')
        .insert({
          session_id: currentSession.id,
          song_id: songData.id,
          added_by: user.id,
          position,
        });
      
      if (addError) throw addError;
      
      // Update local state
      setCurrentSession(prev => {
        if (!prev) return prev;
        
        const newSong: Song = {
          ...song,
          id: songData.id,
          addedBy: user.id,
          votes: [],
          youtubeId: song.youtubeId,
        };
        
        return {
          ...prev,
          playlist: [...prev.playlist, newSong],
        };
      });
      
      // Add message
      const songMsg: Message = {
        id: `msg_${Date.now()}`,
        userId: 'system',
        userName: 'System',
        text: `${user.name} added "${song.title}" by ${song.artist} to the playlist`,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, songMsg]);
      
      toast.success(`Added "${song.title}" to the playlist`);
    } catch (error) {
      console.error('Error adding song:', error);
      toast.error('Failed to add song to playlist');
    }
  };

  const voteSong = async (songId: string) => {
    if (!user || !currentSession) return;
    
    try {
      // Find the song in the playlist
      const songIndex = currentSession.playlist.findIndex(s => s.id === songId);
      if (songIndex === -1) return;
      
      const song = currentSession.playlist[songIndex];
      
      // Check if user has already voted
      const hasVoted = song.votes.includes(user.id);
      
      if (hasVoted) {
        // Remove vote
        const { error } = await supabase
          .from('song_votes')
          .delete()
          .eq('song_id', songId)
          .eq('user_id', user.id);
        
        if (error) throw error;
        
        // Update local state
        setCurrentSession(prev => {
          if (!prev) return prev;
          
          const updatedPlaylist = [...prev.playlist];
          updatedPlaylist[songIndex] = {
            ...updatedPlaylist[songIndex],
            votes: updatedPlaylist[songIndex].votes.filter(id => id !== user.id)
          };
          
          return {
            ...prev,
            playlist: updatedPlaylist
          };
        });
      } else {
        // Add vote
        const { error } = await supabase
          .from('song_votes')
          .insert({
            song_id: songId,
            user_id: user.id,
          });
        
        if (error) throw error;
        
        // Update local state
        setCurrentSession(prev => {
          if (!prev) return prev;
          
          const updatedPlaylist = [...prev.playlist];
          updatedPlaylist[songIndex] = {
            ...updatedPlaylist[songIndex],
            votes: [...updatedPlaylist[songIndex].votes, user.id]
          };
          
          return {
            ...prev,
            playlist: updatedPlaylist
          };
        });
      }
    } catch (error) {
      console.error('Error voting for song:', error);
      toast.error('Failed to vote for song');
    }
  };

  const removeSong = async (songId: string) => {
    if (!user || !currentSession) return;
    
    try {
      const song = currentSession.playlist.find(s => s.id === songId);
      if (!song) return;
      
      // Check permissions
      if (user.id !== currentSession.hostId && user.id !== song.addedBy) {
        toast.error("You don't have permission to remove this song");
        return;
      }
      
      // Remove from playlist
      const { error } = await supabase
        .from('session_playlist')
        .delete()
        .eq('session_id', currentSession.id)
        .eq('song_id', songId);
      
      if (error) throw error;
      
      // Update local state
      const removedIndex = currentSession.playlist.findIndex(s => s.id === songId);
      let updatedIndex = currentSession.currentSongIndex;
      
      if (removedIndex < currentSession.currentSongIndex) {
        updatedIndex--;
      } else if (removedIndex === currentSession.currentSongIndex) {
        updatedIndex = Math.min(updatedIndex, currentSession.playlist.length - 2);
        
        // Update the current song index in the database
        const { error: updateError } = await supabase
          .from('sessions')
          .update({
            current_song_index: Math.max(0, updatedIndex),
            progress: removedIndex === currentSession.currentSongIndex ? 0 : currentSession.progress,
          })
          .eq('id', currentSession.id);
        
        if (updateError) throw updateError;
      }
      
      setCurrentSession(prev => {
        if (!prev) return prev;
        
        return {
          ...prev,
          playlist: prev.playlist.filter(s => s.id !== songId),
          currentSongIndex: Math.max(0, updatedIndex),
          progress: removedIndex === prev.currentSongIndex ? 0 : prev.progress,
        };
      });
      
      toast.success(`Removed "${song.title}" from playlist`);
    } catch (error) {
      console.error('Error removing song:', error);
      toast.error('Failed to remove song from playlist');
    }
  };

  const playPause = async () => {
    if (!currentSession || !youtubePlayer) return;
    
    if (user?.id !== currentSession.hostId) {
      toast.error('Only the host can control playback');
      return;
    }
    
    try {
      const newIsPlaying = !currentSession.isPlaying;
      
      // Update in database
      const { error } = await supabase
        .from('sessions')
        .update({ is_playing: newIsPlaying })
        .eq('id', currentSession.id);
      
      if (error) throw error;
      
      // Update local state
      setCurrentSession(prev => {
        if (!prev) return prev;
        
        return {
          ...prev,
          isPlaying: newIsPlaying,
        };
      });
      
      // Control player
      if (newIsPlaying) {
        youtubePlayer.playVideo();
        setPlayerState(PlayerState.PLAYING);
      } else {
        youtubePlayer.pauseVideo();
        setPlayerState(PlayerState.PAUSED);
      }
    } catch (error) {
      console.error('Error toggling playback:', error);
      toast.error('Failed to control playback');
    }
  };

  const nextSong = async () => {
    if (!currentSession || !youtubePlayer) return;
    
    if (user?.id !== currentSession.hostId) {
      toast.error('Only the host can control playback');
      return;
    }
    
    if (currentSession.playlist.length <= 1) {
      return;
    }
    
    try {
      const nextIndex = (currentSession.currentSongIndex + 1) % currentSession.playlist.length;
      
      // Update in database
      const { error } = await supabase
        .from('sessions')
        .update({
          current_song_index: nextIndex,
          progress: 0,
        })
        .eq('id', currentSession.id);
      
      if (error) throw error;
      
      // Update local state
      setCurrentSession(prev => {
        if (!prev) return prev;
        
        return {
          ...prev,
          currentSongIndex: nextIndex,
          progress: 0,
        };
      });
      
      // Load next song
      const nextSong = currentSession.playlist[nextIndex];
      if (nextSong && nextSong.youtubeId) {
        await youtubePlayer.loadVideoById(nextSong.youtubeId);
        if (currentSession.isPlaying) {
          await youtubePlayer.playVideo();
          setPlayerState(PlayerState.PLAYING);
        } else {
          await youtubePlayer.pauseVideo();
          setPlayerState(PlayerState.PAUSED);
        }
      }
    } catch (error) {
      console.error('Error changing to next song:', error);
      toast.error('Failed to change song');
    }
  };

  const previousSong = async () => {
    if (!currentSession || !youtubePlayer) return;
    
    if (user?.id !== currentSession.hostId) {
      toast.error('Only the host can control playback');
      return;
    }
    
    if (currentSession.playlist.length <= 1) {
      return;
    }
    
    try {
      // If we're more than 3 seconds into the song, just restart it
      const currentTime = await youtubePlayer.getCurrentTime();
      if (currentTime > 3) {
        await seekTo(0);
        return;
      }
      
      // Otherwise go to previous song
      const prevIndex = (currentSession.currentSongIndex - 1 + currentSession.playlist.length) % currentSession.playlist.length;
      
      // Update in database
      const { error } = await supabase
        .from('sessions')
        .update({
          current_song_index: prevIndex,
          progress: 0,
        })
        .eq('id', currentSession.id);
      
      if (error) throw error;
      
      // Update local state
      setCurrentSession(prev => {
        if (!prev) return prev;
        
        return {
          ...prev,
          currentSongIndex: prevIndex,
          progress: 0,
        };
      });
      
      // Load previous song
      const prevSong = currentSession.playlist[prevIndex];
      if (prevSong && prevSong.youtubeId) {
        await youtubePlayer.loadVideoById(prevSong.youtubeId);
        if (currentSession.isPlaying) {
          await youtubePlayer.playVideo();
          setPlayerState(PlayerState.PLAYING);
        } else {
          await youtubePlayer.pauseVideo();
          setPlayerState(PlayerState.PAUSED);
        }
      }
    } catch (error) {
      console.error('Error changing to previous song:', error);
      toast.error('Failed to change song');
    }
  };

  const seekTo = async (progress: number) => {
    if (!currentSession || !youtubePlayer) return;
    
    if (user?.id !== currentSession.hostId) {
      toast.error('Only the host can control playback');
      return;
    }
    
    try {
      // Update in database
      const { error } = await supabase
        .from('sessions')
        .update({ progress })
        .eq('id', currentSession.id);
      
      if (error) throw error;
      
      // Update local state
      setCurrentSession(prev => {
        if (!prev) return prev;
        
        return {
          ...prev,
          progress,
        };
      });
      
      // Seek in player
      youtubePlayer.seekTo(progress);
    } catch (error) {
      console.error('Error seeking:', error);
      toast.error('Failed to seek');
    }
  };

  const getSuggestions = (): SongSuggestion[] => {
    if (!currentSession) return [];
    
    const suggestions = [...mockSongs]
      .filter(song => !currentSession.playlist.some(s => s.title === song.title))
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
      
    return suggestions;
  };

  const getSessionShareLink = (sessionId: string): string => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return '';
    
    return `${window.location.origin}/session/${session.roomId}`;
  };

  return (
    <SessionContext.Provider value={{
      currentSession,
      sessions,
      mySessions,
      messages,
      playerState,
      youtubePlayer,
      createSession,
      joinSession,
      leaveSession,
      endSession,
      sendMessage,
      addSong,
      voteSong,
      removeSong,
      playPause,
      nextSong,
      previousSong,
      seekTo,
      getSuggestions,
      getSessionShareLink,
    }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = (): SessionContextType => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};
