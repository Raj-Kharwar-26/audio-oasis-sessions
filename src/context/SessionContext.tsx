import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, Song, Message, User, PlayerState, SongSuggestion } from '@/types';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

// Mock data for the demo
import { mockSessions, mockSongs } from '@/lib/mockData';

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
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>(mockSessions);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [playerState, setPlayerState] = useState<PlayerState>(PlayerState.PAUSED);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (currentSession && currentSession.isPlaying && playerState === PlayerState.PLAYING) {
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
  }, [currentSession, playerState]);

  const createSession = (name: string) => {
    if (!user) {
      toast.error('You must be logged in to create a session');
      return;
    }
    
    if (!name.trim()) {
      toast.error('Session name cannot be empty');
      return;
    }
    
    const newSession: Session = {
      id: `session_${Date.now()}`,
      name: name.trim(),
      hostId: user.id,
      users: [user],
      playlist: [mockSongs[0], mockSongs[1]],
      currentSongIndex: 0,
      isPlaying: false,
      progress: 0,
    };
    
    setSessions(prev => [...prev, newSession]);
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
    
    toast.success(`Session "${name}" created!`);
  };

  const joinSession = (sessionId: string) => {
    if (!user) {
      toast.error('You must be logged in to join a session');
      return;
    }
    
    const session = sessions.find(s => s.id === sessionId);
    if (!session) {
      toast.error('Session not found');
      return;
    }
    
    if (!session.users.find(u => u.id === user.id)) {
      const updatedSession = {
        ...session,
        users: [...session.users, user]
      };
      
      setSessions(prev => 
        prev.map(s => s.id === sessionId ? updatedSession : s)
      );
      
      const joinMsg: Message = {
        id: `msg_${Date.now()}`,
        userId: 'system',
        userName: 'System',
        text: `${user.name} joined the session`,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, joinMsg]);
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
    } else {
      const updatedSession = {
        ...currentSession,
        users: currentSession.users.filter(u => u.id !== user.id)
      };
      
      setSessions(prev => 
        prev.map(s => s.id === currentSession.id ? updatedSession : s)
      );
      
      const leaveMsg: Message = {
        id: `msg_${Date.now()}`,
        userId: 'system',
        userName: 'System',
        text: `${user.name} left the session`,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, leaveMsg]);
    }
    
    setCurrentSession(null);
    setPlayerState(PlayerState.PAUSED);
    setMessages([]);
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
