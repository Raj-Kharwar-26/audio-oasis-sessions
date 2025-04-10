
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Play, Pause, Plus, AlertCircle } from 'lucide-react';
import { Song } from '@/types';
import { useSession } from '@/context/SessionContext';
import { useAuth } from '@/context/AuthContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatTime } from '@/lib/utils';
import { toast } from 'sonner';
import { searchSongs } from '@/services/spotify';

const SongSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPlayingSong, setCurrentPlayingSong] = useState<Song | null>(null);
  const [audio] = useState(new Audio());
  const [audioPlaying, setAudioPlaying] = useState(false);
  const { currentSession, addSong } = useSession();
  const { user } = useAuth();
  
  // Clean up audio when component unmounts
  useEffect(() => {
    return () => {
      if (audio) {
        audio.pause();
        audio.src = '';
      }
    };
  }, [audio]);
  
  // Add event listeners to audio element
  useEffect(() => {
    const handleEnded = () => {
      setCurrentPlayingSong(null);
      setAudioPlaying(false);
    };
    
    const handleError = (e: ErrorEvent) => {
      console.error("Audio playback error:", e);
      toast.error("Couldn't play this song preview");
      setCurrentPlayingSong(null);
      setAudioPlaying(false);
    };
    
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError as EventListener);
    
    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError as EventListener);
    };
  }, [audio]);
  
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const songs = await searchSongs(query);
      setResults(songs);
      
      if (songs.length === 0) {
        toast.info(`No results found for "${query}"`);
      }
    } catch (error) {
      console.error("Error searching songs:", error);
      toast.error("Failed to search songs. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  const handlePlayPause = (song: Song) => {
    if (!song.url) {
      toast.error("No preview available for this song");
      return;
    }
    
    if (currentPlayingSong && currentPlayingSong.id === song.id) {
      // Already playing this song, so pause/resume
      if (audio.paused) {
        audio.play()
          .then(() => setAudioPlaying(true))
          .catch(err => {
            console.error("Error playing audio:", err);
            toast.error("Failed to play song preview");
            setAudioPlaying(false);
          });
      } else {
        audio.pause();
        setAudioPlaying(false);
      }
    } else {
      // Play a new song
      if (currentPlayingSong) {
        audio.pause();
      }
      
      audio.src = song.url;
      audio.play()
        .then(() => {
          setCurrentPlayingSong(song);
          setAudioPlaying(true);
        })
        .catch(err => {
          console.error("Error playing audio:", err);
          toast.error("Failed to play song preview");
          setAudioPlaying(false);
        });
    }
  };
  
  const handleAddToSession = (song: Song) => {
    if (!currentSession || !user) {
      toast.error("You need to join a session first to add songs");
      return;
    }
    
    addSong({
      title: song.title,
      artist: song.artist,
      album: song.album,
      cover: song.cover,
      duration: song.duration,
      url: song.url
    });
    
    toast.success(`Added "${song.title}" to the session playlist`);
  };
  
  return (
    <div className="glass-card p-6 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Search for Songs</h2>
      
      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <Input
          placeholder="Search by song, artist, or lyrics"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="bg-secondary/50"
        />
        <Button type="submit" disabled={loading}>
          {loading ? "Searching..." : <Search className="h-4 w-4" />}
        </Button>
      </form>
      
      {results.length > 0 ? (
        <ScrollArea className="h-[350px] pr-4">
          <div className="space-y-2">
            {results.map(song => (
              <div key={song.id} className="flex items-center p-3 rounded-md hover:bg-secondary/20 gap-3">
                <div className="h-12 w-12 shrink-0 rounded overflow-hidden">
                  {song.cover ? (
                    <img 
                      src={song.cover} 
                      alt={`${song.title} cover`} 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-secondary flex items-center justify-center">
                      <Search className="h-4 w-4" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{song.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground">{formatTime(song.duration)}</span>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handlePlayPause(song)}
                    disabled={!song.url}
                    title={song.url ? "Play preview" : "No preview available"}
                  >
                    {currentPlayingSong && currentPlayingSong.id === song.id && audioPlaying ? (
                      <Pause size={16} />
                    ) : (
                      <>
                        {song.url ? (
                          <Play size={16} />
                        ) : (
                          <AlertCircle size={16} className="text-muted-foreground" />
                        )}
                      </>
                    )}
                  </Button>
                  
                  {currentSession && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleAddToSession(song)}
                      title="Add to session playlist"
                    >
                      <Plus size={16} />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      ) : query && !loading ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No songs found for "{query}"</p>
        </div>
      ) : !query ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>Search for songs to play or add to your session</p>
        </div>
      ) : null}
    </div>
  );
};

export default SongSearch;
