
import React, { useState, useEffect } from 'react';
import { useSession } from '@/context/SessionContext';
import { Song, SongSuggestion } from '@/types';
import { Button } from '@/components/ui/button';
import { Play, Pause, Music, Plus, Sparkles } from 'lucide-react';
import { formatTime } from '@/lib/utils';
import { YouTubePlayer } from '@/lib/YouTubePlayer';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import AddSongForm from './AddSongForm';

interface SuggestionItemProps {
  song: SongSuggestion;
  isPlaying: boolean;
  onPlay: () => void;
  onAdd: () => void;
  isAiSuggestion?: boolean;
}

const SuggestionItem: React.FC<SuggestionItemProps> = ({ 
  song, 
  isPlaying, 
  onPlay, 
  onAdd,
  isAiSuggestion = false
}) => {
  return (
    <div className="flex items-center p-3 rounded-md gap-3 hover:bg-secondary/20">
      {/* Cover image or placeholder */}
      <div className="h-10 w-10 shrink-0 rounded overflow-hidden">
        {song.cover ? (
          <img 
            src={song.cover} 
            alt={`${song.title} cover`} 
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-secondary flex items-center justify-center">
            <Music className="h-4 w-4" />
          </div>
        )}
      </div>
      
      {/* Song info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">{song.title}</p>
          {isAiSuggestion && (
            <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles size={10} />
              AI
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
      </div>
      
      {/* Duration + Controls */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-muted-foreground">{formatTime(song.duration)}</span>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onPlay}
          title={isPlaying ? "Pause preview" : "Play preview"}
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-primary"
          onClick={onAdd}
          title="Add to playlist"
        >
          <Plus size={16} />
        </Button>
      </div>
    </div>
  );
};

const SongSuggestions: React.FC<{ isAiDj?: boolean }> = ({ isAiDj = false }) => {
  const { getSuggestions, addSong } = useSession();
  const [suggestions, setSuggestions] = useState<SongSuggestion[]>([]);
  const [playingSongId, setPlayingSongId] = useState<string | null>(null);
  const [previewPlayer, setPreviewPlayer] = useState<YouTubePlayer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Initialize YouTube preview player
  useEffect(() => {
    const player = new YouTubePlayer('preview-player');
    player.initialize().then(() => {
      setPreviewPlayer(player);
    }).catch(error => {
      console.error('Failed to initialize preview player:', error);
    });
    
    return () => {
      if (previewPlayer) {
        previewPlayer.destroy();
      }
    };
  }, []);
  
  // Get suggestions (either AI or regular)
  useEffect(() => {
    if (isAiDj) {
      // Get AI-powered suggestions based on current playlist and user preferences
      const aiSuggestions = getSuggestions();
      setSuggestions(aiSuggestions);
    } else {
      // Get regular suggestions
      const regularSuggestions = getSuggestions();
      setSuggestions(regularSuggestions);
    }
  }, [isAiDj, getSuggestions]);
  
  const handlePlayPause = (song: SongSuggestion) => {
    if (!previewPlayer || !song.youtubeId) return;
    
    if (playingSongId === song.youtubeId) {
      // Already playing this song, pause it
      previewPlayer.pauseVideo();
      setPlayingSongId(null);
    } else {
      // Play a new song
      previewPlayer.loadVideoById(song.youtubeId);
      previewPlayer.playVideo();
      setPlayingSongId(song.youtubeId);
    }
  };
  
  const handleAddSong = (song: SongSuggestion) => {
    addSong(song);
    toast.success(`Added "${song.title}" to playlist`);
  };
  
  // This div is for the hidden YouTube player
  const playerContainerStyle = {
    position: 'absolute',
    top: '-9999px',
    left: '-9999px',
    width: '0',
    height: '0',
    opacity: 0,
    pointerEvents: 'none',
  } as React.CSSProperties;
  
  if (isAiDj) {
    return (
      <div>
        <div id="preview-player" style={playerContainerStyle}></div>
        
        {suggestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-6">
            <Sparkles className="h-12 w-12 mb-4 text-primary/50" />
            <h3 className="text-lg font-medium mb-2">AI-DJ is thinking...</h3>
            <p className="text-muted-foreground text-sm">
              Our AI is analyzing your playlist and preferences to suggest songs
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {suggestions.map((song) => (
              <SuggestionItem
                key={song.youtubeId || song.title}
                song={song}
                isPlaying={playingSongId === song.youtubeId}
                onPlay={() => handlePlayPause(song)}
                onAdd={() => handleAddSong(song)}
                isAiSuggestion={true}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div>
      <div id="preview-player" style={playerContainerStyle}></div>
      
      <div className="space-y-4">
        <Input
          placeholder="Search for songs to add..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-secondary/50"
        />
        
        <AddSongForm />
        
        <div className="space-y-1">
          <h3 className="text-sm font-medium">Suggested for you:</h3>
          
          {suggestions.length === 0 ? (
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-muted-foreground">No suggestions available</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {suggestions.map((song) => (
                <SuggestionItem
                  key={song.youtubeId || song.title}
                  song={song}
                  isPlaying={playingSongId === song.youtubeId}
                  onPlay={() => handlePlayPause(song)}
                  onAdd={() => handleAddSong(song)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SongSuggestions;
