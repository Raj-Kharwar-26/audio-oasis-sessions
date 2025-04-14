import React, { useEffect } from 'react';
import { useSession } from '@/context/SessionContext';
import { useAuth } from '@/context/AuthContext';
import { 
  Play, Pause, SkipBack, SkipForward, 
  Music, Volume2, Users, Headphones
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { PlayerState } from '@/types';
import { formatTime } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

const MusicPlayer: React.FC = () => {
  const { currentSession, playerState, playPause, nextSong, previousSong, seekTo, youtubePlayer } = useSession();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  if (!currentSession || !currentSession.playlist.length) {
    return (
      <div className="glass-card p-4 rounded-lg text-center">
        <p>No songs in the playlist</p>
      </div>
    );
  }
  
  const currentSong = currentSession.playlist[currentSession.currentSongIndex];
  const isHost = user?.id === currentSession.hostId;
  
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
    <div className="glass-card p-4 rounded-lg">
      {/* Hidden YouTube player */}
      <div id="youtube-player" style={playerContainerStyle}></div>
      
      <div className="flex flex-col md:flex-row gap-4 items-center">
        {/* Album art */}
        <div className="relative w-24 h-24 md:w-28 md:h-28 shrink-0">
          {currentSong.cover ? (
            <img 
              src={currentSong.cover} 
              alt={`${currentSong.title} cover`} 
              className="w-full h-full object-cover rounded-md"
            />
          ) : (
            <div className="w-full h-full bg-secondary flex items-center justify-center rounded-md">
              <Music className="h-10 w-10 text-primary" />
            </div>
          )}
          
          {/* Audio visualizer */}
          {playerState === PlayerState.PLAYING && (
            <div className="absolute bottom-2 left-2 right-2 audio-visualizer h-4">
              <span className="animate-wave-1 h-full"></span>
              <span className="animate-wave-2 h-3/4"></span>
              <span className="animate-wave-3 h-full"></span>
              <span className="animate-wave-4 h-2/4"></span>
              <span className="animate-wave-5 h-3/4"></span>
            </div>
          )}
        </div>
        
        {/* Song info and controls */}
        <div className="flex-1 w-full">
          <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-2">
            <div className="text-center md:text-left">
              <h3 className="text-lg font-semibold truncate max-w-[200px] md:max-w-xs">
                {currentSong.title}
              </h3>
              <p className="text-sm text-muted-foreground truncate max-w-[200px] md:max-w-xs">
                {currentSong.artist}
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 justify-center md:justify-end">
              <span className="text-xs bg-secondary px-2 py-1 rounded-full flex items-center gap-1">
                <Headphones size={12} />
                {playerState === PlayerState.PLAYING ? 'Playing' : 'Paused'}
              </span>
              <span className="text-xs bg-secondary px-2 py-1 rounded-full flex items-center gap-1">
                <Users size={12} />
                {currentSession.users.length}
              </span>
              <span className="text-xs bg-secondary px-2 py-1 rounded-full flex items-center gap-1">
                <Volume2 size={12} />
                Host: {currentSession.users.find(u => u.id === currentSession.hostId)?.name}
              </span>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mt-4 space-y-2">
            <Slider
              value={[currentSession.progress]}
              max={currentSong.duration || 200} // Fallback duration if not available
              step={1}
              disabled={!isHost}
              onValueChange={([value]) => {
                if (isHost) seekTo(value);
              }}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatTime(currentSession.progress)}</span>
              <span>{formatTime(currentSong.duration || 200)}</span>
            </div>
          </div>
          
          {/* Playback controls */}
          <div className="flex justify-center items-center gap-2 mt-2">
            <Button 
              variant="ghost" 
              size="icon"
              disabled={!isHost}
              onClick={previousSong}
              className={isMobile ? "h-10 w-10" : ""}
            >
              <SkipBack size={isMobile ? 20 : 16} />
            </Button>
            
            <Button 
              size="icon"
              disabled={!isHost}
              onClick={playPause}
              className={isHost ? `hover:bg-primary ${isMobile ? "h-12 w-12" : ""}` : "opacity-75"}
            >
              {playerState === PlayerState.PLAYING ? (
                <Pause size={isMobile ? 24 : 20} />
              ) : (
                <Play size={isMobile ? 24 : 20} />
              )}
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon"
              disabled={!isHost}
              onClick={nextSong}
              className={isMobile ? "h-10 w-10" : ""}
            >
              <SkipForward size={isMobile ? 20 : 16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicPlayer;
