
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Play, Pause, Plus, AlertCircle, SkipForward, SkipBack, Repeat, X, Music } from 'lucide-react';
import { Song } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatTime } from '@/lib/utils';
import { toast } from 'sonner';
import { searchYouTubeSongs } from '@/services/youtube';
import { YouTubePlayer } from '@/lib/YouTubePlayer';
import { Progress } from '@/components/ui/progress';
import { useIsMobile } from '@/hooks/use-mobile';

const SongSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPlayingSong, setCurrentPlayingSong] = useState<Song | null>(null);
  const [previewPlayer, setPreviewPlayer] = useState<YouTubePlayer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const isMobile = useIsMobile();
  
  useEffect(() => {
    const player = new YouTubePlayer('preview-player');
    player.initialize()
      .then(() => {
        setPreviewPlayer(player);
        console.log("YouTube player initialized successfully");
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
  
  useEffect(() => {
    if (!isPlaying || !previewPlayer) return;
    
    const interval = setInterval(async () => {
      try {
        const time = await previewPlayer.getCurrentTime();
        setCurrentTime(time);
      } catch (error) {
        console.error('Error getting current time:', error);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isPlaying, previewPlayer]);
  
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
      if (isPlaying) {
        await previewPlayer.pauseVideo();
        setIsPlaying(false);
      } else {
        await previewPlayer.playVideo();
        setIsPlaying(true);
      }
    } else {
      try {
        await previewPlayer.loadVideoById(song.youtubeId);
        await previewPlayer.playVideo();
        setCurrentPlayingSong(song);
        setIsPlaying(true);
        setCurrentTime(0);
        console.log(`Now playing: ${song.title} with ID: ${song.youtubeId}`);
      } catch (error) {
        console.error("Error playing song:", error);
        toast.error("Failed to play song. Please try again.");
      }
    }
  };
  
  const handleSeekForward = async () => {
    if (!previewPlayer || !currentPlayingSong) return;
    const newTime = currentTime + 10;
    await previewPlayer.seekTo(newTime);
    setCurrentTime(newTime);
  };
  
  const handleSeekBackward = async () => {
    if (!previewPlayer || !currentPlayingSong) return;
    const newTime = Math.max(0, currentTime - 10);
    await previewPlayer.seekTo(newTime);
    setCurrentTime(newTime);
  };
  
  const handleRestart = async () => {
    if (!previewPlayer || !currentPlayingSong) return;
    await previewPlayer.seekTo(0);
    setCurrentTime(0);
    if (!isPlaying) {
      await previewPlayer.playVideo();
      setIsPlaying(true);
    }
  };
  
  const handleProgressChange = async (value: number) => {
    if (!previewPlayer || !currentPlayingSong) return;
    await previewPlayer.seekTo(value);
    setCurrentTime(value);
  };
  
  const handleClosePlayer = async () => {
    if (!previewPlayer) return;
    await previewPlayer.pauseVideo();
    setIsPlaying(false);
    setCurrentPlayingSong(null);
    setCurrentTime(0);
  };
  
  const playerContainerStyle = {
    position: 'absolute',
    top: '-9999px',
    left: '-9999px',
    width: '0',
    height: '0',
    opacity: 0,
    pointerEvents: 'none',
  } as React.CSSProperties;
  
  const renderMobilePlayer = () => {
    if (!currentPlayingSong) return null;
    
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-2 z-10 glass-card">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 shrink-0 rounded overflow-hidden">
            {currentPlayingSong.cover ? (
              <img 
                src={currentPlayingSong.cover} 
                alt={`${currentPlayingSong.title} cover`} 
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-secondary flex items-center justify-center">
                <Search className="h-4 w-4" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0 mr-2">
            <p className="font-medium truncate text-sm">{currentPlayingSong.title}</p>
            <Progress value={(currentTime / currentPlayingSong.duration) * 100} className="h-1 mt-1" />
          </div>
          
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handlePlayPause(currentPlayingSong)}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleSeekForward}
            >
              <SkipForward size={16} />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:text-destructive"
              onClick={handleClosePlayer}
              title="Close player"
            >
              <X size={16} />
            </Button>
          </div>
        </div>
      </div>
    );
  };
  
  const renderDesktopPlayer = () => {
    if (!currentPlayingSong) return null;
    
    return (
      <div className="glass-card p-6 rounded-lg h-full flex flex-col relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-8 w-8 hover:text-destructive"
          onClick={handleClosePlayer}
          title="Close player"
        >
          <X size={16} />
        </Button>
        
        <h2 className="text-xl font-bold mb-6">Now Playing</h2>
        
        <div className="flex flex-col items-center mb-6">
          <div className="h-40 w-40 rounded-lg overflow-hidden mb-4">
            {currentPlayingSong.cover ? (
              <img 
                src={currentPlayingSong.cover} 
                alt={`${currentPlayingSong.title} cover`} 
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-secondary flex items-center justify-center">
                <Search className="h-12 w-12 text-primary" />
              </div>
            )}
          </div>
          
          <h3 className="text-lg font-semibold text-center">{currentPlayingSong.title}</h3>
          <p className="text-sm text-muted-foreground text-center">{currentPlayingSong.artist}</p>
        </div>
        
        <div className="space-y-4 mt-auto">
          <div>
            <div className="relative">
              <Progress 
                value={(currentTime / currentPlayingSong.duration) * 100} 
                className="h-2"
              />
              <input
                type="range"
                min="0"
                max={currentPlayingSong.duration}
                value={currentTime}
                onChange={(e) => handleProgressChange(Number(e.target.value))}
                className="absolute inset-0 opacity-0 cursor-pointer w-full"
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(currentPlayingSong.duration)}</span>
            </div>
          </div>
          
          <div className="flex justify-center items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRestart}
              title="Restart"
            >
              <Repeat size={18} />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSeekBackward}
              title="Rewind 10s"
            >
              <SkipBack size={18} />
            </Button>
            
            <Button
              size="icon"
              onClick={() => handlePlayPause(currentPlayingSong)}
              className="h-12 w-12 bg-primary hover:bg-primary/90"
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSeekForward}
              title="Forward 10s"
            >
              <SkipForward size={18} />
            </Button>
          </div>
        </div>
      </div>
    );
  };
  
  const renderSearchResults = () => (
    <div className="glass-card p-6 rounded-lg h-full">
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
        <ScrollArea className={isMobile ? "h-[350px]" : "h-[calc(100vh-320px)]"}>
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
                  
                  {/* Make play button more visible and touchable on mobile */}
                  <Button
                    variant="ghost"
                    size={isMobile ? "sm" : "icon"}
                    className={isMobile ? "h-10 w-10 bg-secondary/50" : "h-8 w-8"}
                    onClick={() => handlePlayPause(song)}
                    disabled={!song.youtubeId}
                    title={song.youtubeId ? "Play preview" : "No preview available"}
                  >
                    {currentPlayingSong && currentPlayingSong.id === song.id && isPlaying ? (
                      <Pause size={isMobile ? 20 : 16} />
                    ) : (
                      <>
                        {song.youtubeId ? (
                          <Play size={isMobile ? 20 : 16} />
                        ) : (
                          <AlertCircle size={isMobile ? 20 : 16} className="text-muted-foreground" />
                        )}
                      </>
                    )}
                  </Button>
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
          <p>Search for songs to play</p>
        </div>
      ) : null}
    </div>
  );
  
  const hiddenPlayer = (
    <div id="preview-player" style={playerContainerStyle}></div>
  );
  
  if (isMobile) {
    return (
      <>
        {hiddenPlayer}
        {renderSearchResults()}
        {currentPlayingSong && renderMobilePlayer()}
      </>
    );
  }
  
  return (
    <>
      {hiddenPlayer}
      {currentPlayingSong ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-1 md:col-span-2">
            {renderSearchResults()}
          </div>
          <div className="col-span-1">
            {renderDesktopPlayer()}
          </div>
        </div>
      ) : (
        renderSearchResults()
      )}
    </>
  );
};

export default SongSearch;
