
import React, { useEffect, useRef } from 'react';
import * as YouTubeService from '@/services/youtubePlayer';
import { useSession } from '@/context/SessionContext';
import { PlayerState } from '@/types';
import { toast } from 'sonner';

interface YouTubePlayerProps {
  visible?: boolean;
}

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({ visible = false }) => {
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playerReadyRef = useRef(false);
  const { currentSession, playerState: sessionPlayerState } = useSession();
  
  useEffect(() => {
    // Initialize YouTube player
    const initPlayer = async () => {
      if (!playerContainerRef.current) return;
      
      try {
        await YouTubeService.initializePlayer('youtube-player');
        playerReadyRef.current = true;
        console.log('YouTube player initialized');
      } catch (error) {
        console.error('Failed to initialize YouTube player:', error);
        toast.error('Failed to initialize YouTube player');
      }
    };
    
    initPlayer();
    
    // Clean up
    return () => {
      if (playerReadyRef.current) {
        YouTubeService.stopPlayer();
      }
    };
  }, []);
  
  // Handle session player state changes
  useEffect(() => {
    if (!playerReadyRef.current || !currentSession) return;
    
    const handleSessionPlayerChange = async () => {
      if (sessionPlayerState === PlayerState.PLAYING) {
        // The session is playing, so we need to make sure YouTube is playing the right song
        const currentSong = currentSession.playlist[currentSession.currentSongIndex];
        if (!currentSong) return;
        
        const query = `${currentSong.artist} ${currentSong.title}`;
        
        try {
          const success = await YouTubeService.playSongByQuery(query);
          if (!success) {
            console.error('Failed to play song on YouTube');
          }
        } catch (error) {
          console.error('Error playing song on YouTube:', error);
        }
      } else {
        // The session is paused, so pause YouTube
        YouTubeService.pausePlayer();
      }
    };
    
    handleSessionPlayerChange();
  }, [sessionPlayerState, currentSession]);
  
  // Handle song progress changes
  useEffect(() => {
    if (!playerReadyRef.current || !currentSession) return;
    
    const currentYouTubeState = YouTubeService.getPlayerState();
    
    // Only seek if there's a significant difference to avoid loops
    if (Math.abs(currentYouTubeState.position - currentSession.progress) > 3) {
      YouTubeService.seekTo(currentSession.progress);
    }
  }, [currentSession?.progress]);
  
  return (
    <div 
      ref={playerContainerRef} 
      className={`youtube-player-container ${visible ? '' : 'hidden'}`}
    >
      <div id="youtube-player"></div>
    </div>
  );
};

export default YouTubePlayer;
