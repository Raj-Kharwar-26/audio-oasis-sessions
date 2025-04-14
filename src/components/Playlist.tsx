import React, { useState } from 'react';
import { useSession } from '@/context/SessionContext';
import { useAuth } from '@/context/AuthContext';
import { Song, SongSuggestion } from '@/types';
import { Button } from '@/components/ui/button';
import { formatTime } from '@/lib/utils';
import { Heart, Music, Trash2, Play, Volume2, ArrowUp, ArrowDown } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import AddSongForm from './AddSongForm';
import { useIsMobile } from '@/hooks/use-mobile';

const SongItem: React.FC<{ 
  song: Song; 
  isPlaying: boolean; 
  isHost: boolean;
  onPlay: () => void;
  onVote: () => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  currentUserId: string;
  index: number;
  totalSongs: number;
}> = ({ 
  song, 
  isPlaying, 
  isHost, 
  onPlay, 
  onVote, 
  onRemove, 
  onMoveUp,
  onMoveDown,
  currentUserId,
  index,
  totalSongs
}) => {
  const hasVoted = song.votes.includes(currentUserId);
  const canRemove = isHost || song.addedBy === currentUserId;
  const canReorder = isHost;
  const isMobile = useIsMobile();
  
  return (
    <div className={`flex items-center p-3 rounded-md gap-2 ${isPlaying ? 'bg-secondary/40' : 'hover:bg-secondary/20'}`}>
      {/* Position indicator */}
      <div className="flex-shrink-0 w-6 text-center text-sm text-muted-foreground">
        {index + 1}
      </div>
      
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
          {isPlaying && (
            <span className="text-xs text-primary flex items-center">
              <Volume2 size={12} className="mr-1" />
              Now Playing
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
      </div>
      
      {/* Duration + Controls */}
      <div className="flex items-center gap-1 shrink-0">
        <span className="text-xs text-muted-foreground">{formatTime(song.duration)}</span>
        
        <Button
          variant="ghost"
          size="icon"
          className={`${isMobile ? "h-10 w-10" : "h-8 w-8"} ${hasVoted ? 'text-primary' : 'text-muted-foreground'}`}
          onClick={onVote}
          title={hasVoted ? 'Remove vote' : 'Vote for this song'}
        >
          <Heart size={isMobile ? 18 : 16} className={hasVoted ? 'fill-primary' : ''} />
          {song.votes.length > 0 && (
            <span className="absolute -top-1 -right-1 text-[10px] bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center">
              {song.votes.length}
            </span>
          )}
        </Button>
        
        {isPlaying ? (
          <div className={`${isMobile ? "h-10 w-10" : "h-8 w-8"} flex items-center justify-center`}>
            <div className="audio-visualizer h-4">
              <span className="animate-wave-1 h-full"></span>
              <span className="animate-wave-2 h-3/4"></span>
              <span className="animate-wave-3 h-full"></span>
            </div>
          </div>
        ) : (
          isHost && (
            <Button
              variant="ghost"
              size="icon"
              className={isMobile ? "h-10 w-10" : "h-8 w-8"}
              onClick={onPlay}
              title="Play this song"
            >
              <Play size={isMobile ? 18 : 16} />
            </Button>
          )
        )}
        
        {canReorder && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className={`${isMobile ? "h-10 w-10" : "h-8 w-8"} text-muted-foreground`}
              onClick={onMoveUp}
              disabled={index === 0}
              title="Move up in playlist"
            >
              <ArrowUp size={isMobile ? 18 : 16} />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className={`${isMobile ? "h-10 w-10" : "h-8 w-8"} text-muted-foreground`}
              onClick={onMoveDown}
              disabled={index === totalSongs - 1}
              title="Move down in playlist"
            >
              <ArrowDown size={isMobile ? 18 : 16} />
            </Button>
          </>
        )}
        
        {canRemove && (
          <Button
            variant="ghost"
            size="icon"
            className={`${isMobile ? "h-10 w-10" : "h-8 w-8"} text-muted-foreground hover:text-destructive`}
            onClick={onRemove}
            title="Remove from playlist"
          >
            <Trash2 size={isMobile ? 18 : 16} />
          </Button>
        )}
      </div>
    </div>
  );
};

const Playlist: React.FC = () => {
  const { currentSession, voteSong, removeSong, reorderSong } = useSession();
  const { user } = useAuth();
  
  if (!currentSession || !user) return null;
  
  const isHost = user.id === currentSession.hostId;
  
  // Function to play a specific song (host only)
  const playSong = (index: number) => {
    if (!isHost || !currentSession) return;
    
    // This would be implemented in the session context
    reorderSong(index, currentSession.currentSongIndex);
  };
  
  // Function to move a song up or down in the playlist
  const moveSong = (fromIndex: number, direction: 'up' | 'down') => {
    if (!isHost) return;
    
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    
    if (toIndex < 0 || toIndex >= currentSession.playlist.length) {
      return; // Don't move if it would go out of bounds
    }
    
    reorderSong(fromIndex, toIndex);
  };
  
  return (
    <div>
      {currentSession.playlist.length === 0 ? (
        <div className="min-h-[300px] flex flex-col items-center justify-center text-center py-8">
          <Music className="h-12 w-12 mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-medium mb-2">No songs in the playlist</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Add songs from the search to get started
          </p>
          <AddSongForm />
        </div>
      ) : (
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-1">
            {currentSession.playlist.map((song, index) => (
              <SongItem 
                key={song.id}
                song={song}
                isPlaying={index === currentSession.currentSongIndex}
                isHost={isHost}
                onPlay={() => playSong(index)}
                onVote={() => voteSong(song.id)}
                onRemove={() => removeSong(song.id)}
                onMoveUp={() => moveSong(index, 'up')}
                onMoveDown={() => moveSong(index, 'down')}
                currentUserId={user.id}
                index={index}
                totalSongs={currentSession.playlist.length}
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default Playlist;
