import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Session, Song, Message, User, PlayerState, SongSuggestion } from '@/types';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { getYouTubeVideoId, saveSession, getSession, getUserSessions, deleteSession } from '@/services/spotify';

// Mock data for the demo
import { mockSongs } from '@/lib/mockData';

// Define YouTube player interface
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface SessionContextType {
  currentSession: Session | null;
  sessions: Session[];
  messages: Message[];
  playerState: PlayerState;
  createSession: (name: string) => void;
  joinSession: (sessionId: string) => void;
  leaveSession: () => void;
  sendMessage: (text: string) => void;
  addSong: (song: SongSuggestion) => void;
  voteSong: (songId: string) => void;
  removeSong: (songId: string) => void;
  playPause: () => void;
  nextSong: () => void;
  previousSong: () => void;
  seekTo: (progress: number) => void;
  getSuggestions: () => SongSuggestion[];
  isUsingYouTube: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [playerState, setPlayerState] = useState<PlayerState>(PlayerState.PAUSED);
  const [isUsingYouTube, setIsUsingYouTube] = useState<boolean>(false);
  const [youtubeApiLoaded, setYoutubeApiLoaded] = useState<boolean>(false);
  const youtubePlayer = useRef<any>(null);
  const currentVideoId = useRef<string | null>(null);

  // Load sessions from storage on mount
  useEffect(() => {
    if (user) {
      const userSessions = getUserSessions();
      if (userSessions.length > 0) {
        setSessions(userSessions);
        console.log(`Loaded ${userSessions.length} sessions from storage`);
      }
    }
  }, [user]);

  // Load YouTube IFrame API
  useEffect(() => {
    if (!youtubeApiLoaded) {
      console.log("Loading YouTube IFrame API...");
      // Check if there's already a script tag for YouTube API
      if (!document.getElementById('youtube-iframe-api')) {
        const tag = document.createElement('script');
        tag.id = 'youtube-iframe-api';
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      }

      // Set up the callback for when the API is ready
      window.onYouTubeIframeAPIReady = () => {
        setYoutubeApiLoaded(true);
        console.log('YouTube IFrame API ready');
      };

      // Check if YouTube API is already loaded (in case the script was already there)
      if (window.YT && window.YT.Player) {
        setYoutubeApiLoaded(true);
        console.log('YouTube IFrame API already loaded');
      }
    }
  }, [youtubeApiLoaded]);

  // Initialize YouTube player when API is loaded
  useEffect(() => {
    if (youtubeApiLoaded && !youtubePlayer.current) {
      console.log("Initializing YouTube player...");
      
      // Make sure the element exists before creating the player
      if (!document.getElementById('youtube-player')) {
        const playerDiv = document.createElement('div');
        playerDiv.id = 'youtube-player';
        playerDiv.style.position = 'absolute';
        playerDiv.style.width = '1px';
        playerDiv.style.height = '1px';
        playerDiv.style.overflow = 'hidden';
        playerDiv.style.opacity = '0';
        document.body.appendChild(playerDiv);
      }
      
      try {
        youtubePlayer.current = new window.YT.Player('youtube-player', {
          height: '0',
          width: '0',
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            rel: 0,
            enablejsapi: 1
          },
          events: {
            onReady: (event: any) => {
              console.log('YouTube player ready');
            },
            onStateChange: (event: any) => {
              if (event.data === window.YT.PlayerState.ENDED) {
                // Auto-proceed to next song
                nextSong();
              } else if (event.data === window.YT.PlayerState.PLAYING) {
                setPlayerState(PlayerState.PLAYING);
              } else if (event.data === window.YT.PlayerState.PAUSED) {
                setPlayerState(PlayerState.PAUSED);
              }
            },
            onError: (event: any) => {
              console.error('YouTube player error:', event.data);
              toast.error('Failed to play the song. Trying next song...');
              setIsUsingYouTube(false);
              nextSong();
            }
          }
        });
      } catch (error) {
        console.error("Error initializing YouTube player:", error);
        toast.error("Failed to initialize YouTube player. Music preview will be used instead.");
      }
    }
  }, [youtubeApiLoaded]);

  // Handle YouTube playback when session or song changes
  useEffect(() => {
    const loadYouTubeVideo = async () => {
      if (!currentSession || !youtubeApiLoaded || !youtubePlayer.current) return;
      
      const currentSong = currentSession.playlist[currentSession.currentSongIndex];
      if (!currentSong) return;
      
      try {
        // Check if the song already has a youtubeId
        let videoId = currentSong.youtubeId;
        
        // If not, try to get one
        if (!videoId) {
          videoId = await getYouTubeVideoId(currentSong.title, currentSong.artist);
          
          // Save the videoId to the song for future use
          if (videoId) {
            const updatedPlaylist = [...currentSession.playlist];
            updatedPlaylist[currentSession.currentSongIndex] = {
              ...currentSong,
              youtubeId: videoId
            };
            
            setCurrentSession(prev => {
              if (!prev) return prev;
              return {
                ...prev,
                playlist: updatedPlaylist
              };
            });
          }
        }
        
        if (videoId) {
          console.log(`Loading YouTube video: ${videoId}`);
          currentVideoId.current = videoId;
          youtubePlayer.current.loadVideoById(videoId);
          
          if (currentSession.isPlaying) {
            youtubePlayer.current.playVideo();
          } else {
            youtubePlayer.current.pauseVideo();
          }
          
          setIsUsingYouTube(true);
        } else {
          console.log("No YouTube video found, falling back to Spotify preview");
          setIsUsingYouTube(false);
        }
      } catch (error) {
        console.error('Error loading YouTube video:', error);
        setIsUsingYouTube(false);
      }
    };
    
    if (currentSession?.isPlaying && youtubeApiLoaded) {
      loadYouTubeVideo();
    }
  }, [currentSession?.currentSongIndex, currentSession?.isPlaying, youtubeApiLoaded]);

  // Original timer for non-YouTube playback
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (currentSession && currentSession.isPlaying && playerState === PlayerState.PLAYING && !isUsingYouTube) {
      interval = setInterval(() => {
        setCurrentSession(prev => {
          if (!prev) return prev;
          
          const currentSong = prev.playlist[prev.currentSongIndex];
          if (!currentSong) return prev;
          
          const newProgress = prev.progress + 1;
          
          if (newProgress >= currentSong.duration) {
            const nextIndex = (prev.currentSongIndex + 1) % prev.playlist.length;
            return {
              ...prev,
              currentSongIndex: nextIndex,
              progress: 0
            };
          }
          
          return {
            ...prev,
            progress: newProgress
          };
        });
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [currentSession, playerState, isUsingYouTube]);

  const createSession = (name: string) => {
    if (!user) {
      toast.error('You must be logged in to create a session');
      return;
    }
    
    if (!name.trim()) {
      toast.error('Session name cannot be empty');
      return;
    }
    
    const sessionId = `session_${Date.now()}`;
    console.log(`Creating new session: ${name} (ID: ${sessionId})`);
    
    const newSession: Session = {
      id: sessionId,
      name: name.trim(),
      hostId: user.id,
      users: [user],
      playlist: [],
      currentSongIndex: 0,
      isPlaying: false,
      progress: 0,
      timestamp: Date.now()
    };
    
    setSessions(prev => [newSession, ...prev]);
    setCurrentSession(newSession);
    setPlayerState(PlayerState.PAUSED);
    
    const welcomeMsg: Message = {
      id: `msg_${Date.now()}`,
      userId: 'system',
      userName: 'System',
      text: `Welcome to "${name}" session! Add some songs to the playlist and enjoy the music together.`,
      timestamp: Date.now(),
    };
    setMessages([welcomeMsg]);
    
    // Save session to storage
    saveSession(newSession);
    
    toast.success(`Session "${name}" created!`);
  };

  const joinSession = async (sessionId: string) => {
    if (!user) {
      toast.error('You must be logged in to join a session');
      return;
    }
    
    console.log(`Attempting to join session: ${sessionId}`);
    
    // First check user sessions
    let userSessions = getUserSessions();
    let session = userSessions.find(s => s.id === sessionId);
    
    // Then check all sessions
    if (!session) {
      session = sessions.find(s => s.id === sessionId);
    }
    
    // If still not found, try to get from storage
    if (!session) {
      session = await getSession(sessionId);
    }
    
    if (!session) {
      console.error(`Session not found: ${sessionId}`);
      toast.error('Session not found or has ended');
      return;
    }
    
    console.log(`Found session: ${session.name} (ID: ${session.id})`);
    
    if (!session.users.find(u => u.id === user.id)) {
      const updatedSession = {
        ...session,
        users: [...session.users, user]
      };
      
      setSessions(prev => 
        prev.map(s => s.id === sessionId ? updatedSession : s)
      );
      
      // Update session in storage
      saveSession(updatedSession);
      
      const joinMsg: Message = {
        id: `msg_${Date.now()}`,
        userId: 'system',
        userName: 'System',
        text: `${user.name} joined the session`,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, joinMsg]);
      
      session = updatedSession;
    }
    
    setCurrentSession(session);
    setPlayerState(session.isPlaying ? PlayerState.PLAYING : PlayerState.PAUSED);
    
    toast.success(`Joined "${session.name}" session!`);
  };

  const leaveSession = () => {
    if (!user || !currentSession) return;
    
    if (currentSession.hostId === user.id) {
      toast.info(`Session "${currentSession.name}" has been closed`);
      setSessions(prev => 
        prev.filter(s => s.id !== currentSession.id)
      );
      
      // Remove session from storage
      deleteSession(currentSession.id);
    } else {
      const updatedSession = {
        ...currentSession,
        users: currentSession.users.filter(u => u.id !== user.id)
      };
      
      setSessions(prev => 
        prev.map(s => s.id === currentSession.id ? updatedSession : s)
      );
      
      // Update session in storage
      saveSession(updatedSession);
      
      const leaveMsg: Message = {
        id: `msg_${Date.now()}`,
        userId: 'system',
        userName: 'System',
        text: `${user.name} left the session`,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, leaveMsg]);
    }
    
    // Stop YouTube player if active
    if (isUsingYouTube && youtubePlayer.current) {
      youtubePlayer.current.stopVideo();
    }
    
    setCurrentSession(null);
    setPlayerState(PlayerState.PAUSED);
    setMessages([]);
    setIsUsingYouTube(false);
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

  const addSong = (song: SongSuggestion) => {
    if (!user || !currentSession) return;
    
    const newSong: Song = {
      ...song,
      id: `song_${Date.now()}`,
      addedBy: user.id,
      votes: [],
    };
    
    const updatedSession = {
      ...currentSession,
      playlist: [...currentSession.playlist, newSong],
    };
    
    setCurrentSession(updatedSession);
    setSessions(prev => 
      prev.map(s => s.id === currentSession.id ? updatedSession : s)
    );
    
    // Update session in storage
    saveSession(updatedSession);
    
    const songMsg: Message = {
      id: `msg_${Date.now()}`,
      userId: 'system',
      userName: 'System',
      text: `${user.name} added "${song.title}" by ${song.artist} to the playlist`,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, songMsg]);
    
    toast.success(`Added "${song.title}" to the playlist`);
  };

  const voteSong = (songId: string) => {
    if (!user || !currentSession) return;
    
    const songIndex = currentSession.playlist.findIndex(s => s.id === songId);
    if (songIndex === -1) return;
    
    const song = currentSession.playlist[songIndex];
    
    let updatedVotes;
    if (song.votes.includes(user.id)) {
      updatedVotes = song.votes.filter(id => id !== user.id);
    } else {
      updatedVotes = [...song.votes, user.id];
    }
    
    const updatedSong = {
      ...song,
      votes: updatedVotes,
    };
    
    const updatedPlaylist = [...currentSession.playlist];
    updatedPlaylist[songIndex] = updatedSong;
    
    if (songIndex !== currentSession.currentSongIndex) {
      const currentSong = updatedPlaylist[currentSession.currentSongIndex];
      const remainingSongs = updatedPlaylist
        .filter((_, i) => i !== currentSession.currentSongIndex)
        .sort((a, b) => b.votes.length - a.votes.length);
      
      updatedPlaylist.splice(0, updatedPlaylist.length);
      updatedPlaylist.push(currentSong, ...remainingSongs);
    }
    
    const updatedSession = {
      ...currentSession,
      playlist: updatedPlaylist,
      currentSongIndex: 0,
    };
    
    setCurrentSession(updatedSession);
    setSessions(prev => 
      prev.map(s => s.id === currentSession.id ? updatedSession : s)
    );
    
    // Update session in storage
    saveSession(updatedSession);
  };

  const removeSong = (songId: string) => {
    if (!user || !currentSession) return;
    
    const song = currentSession.playlist.find(s => s.id === songId);
    if (!song || (user.id !== currentSession.hostId && user.id !== song.addedBy)) {
      toast.error("You don't have permission to remove this song");
      return;
    }
    
    const updatedPlaylist = currentSession.playlist.filter(s => s.id !== songId);
    
    let updatedIndex = currentSession.currentSongIndex;
    const removedIndex = currentSession.playlist.findIndex(s => s.id === songId);
    
    if (removedIndex < currentSession.currentSongIndex) {
      updatedIndex--;
    } else if (removedIndex === currentSession.currentSongIndex) {
      updatedIndex = Math.min(updatedIndex, updatedPlaylist.length - 1);
      
      // If using YouTube, stop the current video
      if (isUsingYouTube && youtubePlayer.current) {
        youtubePlayer.current.stopVideo();
        setIsUsingYouTube(false);
      }
    }
    
    const updatedSession = {
      ...currentSession,
      playlist: updatedPlaylist,
      currentSongIndex: Math.max(0, updatedIndex),
      progress: removedIndex === currentSession.currentSongIndex ? 0 : currentSession.progress,
    };
    
    setCurrentSession(updatedSession);
    setSessions(prev => 
      prev.map(s => s.id === currentSession.id ? updatedSession : s)
    );
    
    // Update session in storage
    saveSession(updatedSession);
    
    toast.success(`Removed "${song.title}" from playlist`);
  };

  const playPause = () => {
    if (!currentSession) return;
    
    if (user?.id !== currentSession.hostId) {
      toast.error('Only the host can control playback');
      return;
    }
    
    const updatedSession = {
      ...currentSession,
      isPlaying: !currentSession.isPlaying,
    };
    
    setCurrentSession(updatedSession);
    setSessions(prev => 
      prev.map(s => s.id === currentSession.id ? updatedSession : s)
    );
    
    // Update session in storage
    saveSession(updatedSession);
    
    // Control YouTube playback if active
    if (isUsingYouTube && youtubePlayer.current) {
      if (updatedSession.isPlaying) {
        youtubePlayer.current.playVideo();
      } else {
        youtubePlayer.current.pauseVideo();
      }
    }
    
    setPlayerState(updatedSession.isPlaying ? PlayerState.PLAYING : PlayerState.PAUSED);
  };

  const nextSong = () => {
    if (!currentSession) return;
    
    if (user?.id !== currentSession.hostId) {
      toast.error('Only the host can control playback');
      return;
    }
    
    if (currentSession.playlist.length <= 1) {
      return;
    }
    
    const nextIndex = (currentSession.currentSongIndex + 1) % currentSession.playlist.length;
    
    const updatedSession = {
      ...currentSession,
      currentSongIndex: nextIndex,
      progress: 0,
    };
    
    setCurrentSession(updatedSession);
    setSessions(prev => 
      prev.map(s => s.id === currentSession.id ? updatedSession : s)
    );
    
    // Update session in storage
    saveSession(updatedSession);
    
    // Reset YouTube playback
    setIsUsingYouTube(false);
  };

  const previousSong = () => {
    if (!currentSession) return;
    
    if (user?.id !== currentSession.hostId) {
      toast.error('Only the host can control playback');
      return;
    }
    
    if (currentSession.playlist.length <= 1) {
      return;
    }
    
    if (currentSession.progress > 3) {
      const updatedSession = {
        ...currentSession,
        progress: 0,
      };
      
      setCurrentSession(updatedSession);
      setSessions(prev => 
        prev.map(s => s.id === currentSession.id ? updatedSession : s)
      );
      
      // Update session in storage
      saveSession(updatedSession);
      
      // Reset YouTube playback if active
      if (isUsingYouTube && youtubePlayer.current) {
        youtubePlayer.current.seekTo(0, true);
      }
      
      return;
    }
    
    const prevIndex = (currentSession.currentSongIndex - 1 + currentSession.playlist.length) % currentSession.playlist.length;
    
    const updatedSession = {
      ...currentSession,
      currentSongIndex: prevIndex,
      progress: 0,
    };
    
    setCurrentSession(updatedSession);
    setSessions(prev => 
      prev.map(s => s.id === currentSession.id ? updatedSession : s)
    );
    
    // Update session in storage
    saveSession(updatedSession);
    
    // Reset YouTube playback
    setIsUsingYouTube(false);
  };

  const seekTo = (progress: number) => {
    if (!currentSession) return;
    
    if (user?.id !== currentSession.hostId) {
      toast.error('Only the host can control playback');
      return;
    }
    
    const updatedSession = {
      ...currentSession,
      progress,
    };
    
    setCurrentSession(updatedSession);
    setSessions(prev => 
      prev.map(s => s.id === currentSession.id ? updatedSession : s)
    );
    
    // Update session in storage
    saveSession(updatedSession);
    
    // Seek in YouTube player if active
    if (isUsingYouTube && youtubePlayer.current) {
      youtubePlayer.current.seekTo(progress, true);
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

  return (
    <SessionContext.Provider value={{
      currentSession,
      sessions,
      messages,
      playerState,
      createSession,
      joinSession,
      leaveSession,
      sendMessage,
      addSong,
      voteSong,
      removeSong,
      playPause,
      nextSong,
      previousSong,
      seekTo,
      getSuggestions,
      isUsingYouTube,
    }}>
      {/* Hidden YouTube player */}
      <div id="youtube-player" style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', opacity: 0 }}></div>
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
