
import React, { useEffect, useState } from 'react';
import { useSession } from '@/context/SessionContext';
import { useAuth } from '@/context/AuthContext';
import { 
  Play, Pause, SkipBack, SkipForward, 
  Music, Volume2, Users, Youtube, Music2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { PlayerState } from '@/types';
import { formatTime } from '@/lib/utils';

const MusicPlayer: React.FC = () => {
  const { currentSession, playerState, playPause, nextSong, previousSong, seekTo, isUsingYouTube } = useSession();
  const { user } = useAuth();
  const [youtubeProgress, setYoutubeProgress] = useState<number>(0);
  
  // For YouTube playback, we need to update the progress based on the YouTube player
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isUsingYouTube && playerState === PlayerState.PLAYING && window.YT && window.YT.Player) {
      interval = setInterval(() => {
        try {
          const player = document.getElementById('youtube-player') as any;
          if (player && player.getCurrentTime) {
            const currentTime = Math.floor(player.getCurrentTime());
            setYoutubeProgress(currentTime);
          }
        } catch (error) {
          console.error("Error getting YouTube progress:", error);
        }
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isUsingYouTube, playerState]);
  
  if (!currentSession || !currentSession.playlist.length) {
    return (
      <div className="glass-card p-4 rounded-lg text-center">
        <p>No songs in the playlist</p>
      </div>
    );
  }
  
  const currentSong = currentSession.playlist[currentSession.currentSongIndex];
  const isHost = user?.id === currentSession.hostId;
  const currentProgress = isUsingYouTube ? youtubeProgress : currentSession.progress;
  
  return (
    <div className="glass-card p-4 rounded-lg">
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
          
          {/* Audio source indicator */}
          <div className="absolute top-2 right-2 bg-black bg-opacity-60 rounded-full p-1.5">
            {isUsingYouTube ? (
              <Youtube size={16} className="text-red-500" />
            ) : (
              <Music2 size={16} className="text-green-500" />
            )}
          </div>
          
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
              <div className="text-xs text-muted-foreground mt-1">
                {isUsingYouTube ? 'Full song via YouTube' : 'Preview via Spotify'}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Users size={12} />
                {currentSession.users.length}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Volume2 size={12} />
                Host: {currentSession.users.find(u => u.id === currentSession.hostId)?.name}
              </span>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mt-4 space-y-2">
            <Slider
              value={[currentProgress]}
              max={currentSong.duration}
              step={1}
              disabled={!isHost}
              onValueChange={([value]) => {
                if (isHost) seekTo(value);
              }}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatTime(currentProgress)}</span>
              <span>{formatTime(currentSong.duration)}</span>
            </div>
          </div>
          
          {/* Playback controls */}
          <div className="flex justify-center items-center gap-2 mt-2">
            <Button 
              variant="ghost" 
              size="icon"
              disabled={!isHost}
              onClick={previousSong}
            >
              <SkipBack size={20} />
            </Button>
            
            <Button 
              size="icon"
              disabled={!isHost}
              onClick={playPause}
              className={isHost ? 'hover:bg-primary' : 'opacity-75'}
            >
              {playerState === PlayerState.PLAYING ? (
                <Pause size={20} />
              ) : (
                <Play size={20} />
              )}
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon"
              disabled={!isHost}
              onClick={nextSong}
            >
              <SkipForward size={20} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicPlayer;
