
import React from 'react';
import { useSession } from '@/context/SessionContext';
import { useAuth } from '@/context/AuthContext';
import { Song } from '@/types';
import { Button } from '@/components/ui/button';
import { formatTime, truncate } from '@/lib/utils';
import { Heart, Music, Trash2, Play } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import AddSongForm from './AddSongForm';

const SongItem: React.FC<{ 
  song: Song; 
  isPlaying: boolean; 
  isHost: boolean;
  onPlay: () => void;
  onVote: () => void;
  onRemove: () => void;
  currentUserId: string;
}> = ({ song, isPlaying, isHost, onPlay, onVote, onRemove, currentUserId }) => {
  const hasVoted = song.votes.includes(currentUserId);
  const canRemove = isHost || song.addedBy === currentUserId;
  
  return (
    <div className={`flex items-center p-3 rounded-md gap-3 ${isPlaying ? 'bg-secondary/40' : 'hover:bg-secondary/20'}`}>
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
        <p className="font-medium truncate">{song.title}</p>
        <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
      </div>
      
      {/* Duration + Controls */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-muted-foreground">{formatTime(song.duration)}</span>
        
        <Button
          variant="ghost"
          size="icon"
          className={`h-8 w-8 ${hasVoted ? 'text-primary' : 'text-muted-foreground'}`}
          onClick={onVote}
          title={hasVoted ? 'Remove vote' : 'Vote for this song'}
        >
          <Heart size={16} className={hasVoted ? 'fill-primary' : ''} />
          {song.votes.length > 0 && (
            <span className="absolute -top-1 -right-1 text-[10px] bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center">
              {song.votes.length}
            </span>
          )}
        </Button>
        
        {isPlaying ? (
          <div className="h-8 w-8 flex items-center justify-center">
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
              className="h-8 w-8"
              onClick={onPlay}
              title="Play this song"
            >
              <Play size={16} />
            </Button>
          )
        )}
        
        {canRemove && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={onRemove}
            title="Remove from playlist"
          >
            <Trash2 size={16} />
          </Button>
        )}
      </div>
    </div>
  );
};

const Playlist: React.FC = () => {
  const { currentSession, voteSong, removeSong, seekTo } = useSession();
  const { user } = useAuth();
  
  if (!currentSession || !user) return null;
  
  const isHost = user.id === currentSession.hostId;
  
  // Function to play a specific song (host only)
  const playSong = (index: number) => {
    if (!isHost || !currentSession) return;
    
    // Simple simulation - in a real app, this would update the current song in the session
    seekTo(0); // Reset progress
  };
  
  return (
    <div className="glass-card rounded-lg overflow-hidden">
      <Tabs defaultValue="queue">
        <TabsList className="w-full">
          <TabsTrigger value="queue" className="flex-1">Queue ({currentSession.playlist.length})</TabsTrigger>
          <TabsTrigger value="add" className="flex-1">Add Songs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="queue" className="p-2">
          <ScrollArea className="h-[350px] pr-4">
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
                  currentUserId={user.id}
                />
              ))}
              
              {currentSession.playlist.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Music className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No songs in the playlist yet</p>
                  <p className="text-sm">Add songs to get started</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="add">
          <AddSongForm />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Playlist;
