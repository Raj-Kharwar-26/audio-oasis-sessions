
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
import { searchYouTubeSongs } from '@/services/youtube';
import { YouTubePlayer } from '@/lib/YouTubePlayer';

const SongSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPlayingSong, setCurrentPlayingSong] = useState<Song | null>(null);
  const [previewPlayer, setPreviewPlayer] = useState<YouTubePlayer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const { currentSession, addSong } = useSession();
  const { user } = useAuth();
  
  // Initialize YouTube preview player
  useEffect(() => {
    const player = new YouTubePlayer('preview-player');
    player.initialize()
      .then(() => {
        setPreviewPlayer(player);
      })
      .catch(error => {
        console.error('Failed to initialize YouTube preview player:', error);
      });
    
    return () => {
      if (previewPlayer) {
        previewPlayer.destroy();
      }
    };
  }, []);
  
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const songs = await searchYouTubeSongs(query);
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
  
  const handlePlayPause = async (song: Song) => {
    if (!previewPlayer) {
      toast.error("Preview player is not ready yet");
      return;
    }
    
    if (!song.youtubeId) {
      toast.error("No YouTube ID available for this song");
      return;
    }
    
    if (currentPlayingSong && currentPlayingSong.id === song.id) {
      // Already playing this song, so pause/resume
      if (isPlaying) {
        await previewPlayer.pauseVideo();
        setIsPlaying(false);
      } else {
        await previewPlayer.playVideo();
        setIsPlaying(true);
      }
    } else {
      // Play a new song
      await previewPlayer.loadVideoById(song.youtubeId);
      await previewPlayer.playVideo();
      setCurrentPlayingSong(song);
      setIsPlaying(true);
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
      url: song.url,
      youtubeId: song.youtubeId
    });
    
    toast.success(`Added "${song.title}" to the session playlist`);
  };
  
  // Hidden YouTube player div
  const playerContainerStyle = {
    position: 'absolute',
    top: '-9999px',
    left: '-9999px',
    width: '0',
    height: '0',
    opacity: 0,
    pointerEvents: 'none',
  } as React.CSSProperties;
  
  return (
    <div className="glass-card p-6 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Search for Songs</h2>
      
      {/* Hidden YouTube player for previews */}
      <div id="preview-player" style={playerContainerStyle}></div>
      
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
                    disabled={!song.youtubeId}
                    title={song.youtubeId ? "Play preview" : "No preview available"}
                  >
                    {currentPlayingSong && currentPlayingSong.id === song.id && isPlaying ? (
                      <Pause size={16} />
                    ) : (
                      <>
                        {song.youtubeId ? (
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
