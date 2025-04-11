
import { toast } from "sonner";

// Interface for YouTube Player
interface YouTubePlayerState {
  player: any | null;
  isReady: boolean;
  isPlaying: boolean;
  currentVideoId: string | null;
  volume: number;
  position: number;
}

// Initial state
const playerState: YouTubePlayerState = {
  player: null,
  isReady: false,
  isPlaying: false,
  currentVideoId: null,
  volume: 80,
  position: 0,
};

// Load YouTube API
export const loadYouTubeAPI = (): Promise<void> => {
  return new Promise((resolve) => {
    if (window.YT) {
      resolve();
      return;
    }

    window.onYouTubeIframeAPIReady = () => {
      resolve();
    };

    // Load the YouTube IFrame Player API code asynchronously
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
  });
};

// Initialize the YouTube player
export const initializePlayer = (elementId: string): Promise<void> => {
  return new Promise(async (resolve) => {
    if (playerState.player) {
      resolve();
      return;
    }

    await loadYouTubeAPI();

    playerState.player = new window.YT.Player(elementId, {
      height: '0',
      width: '0',
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        enablejsapi: 1,
        modestbranding: 1,
        playsinline: 1,
        rel: 0,
        showinfo: 0,
        iv_load_policy: 3,
      },
      events: {
        onReady: () => {
          console.log('YouTube player is ready');
          playerState.isReady = true;
          playerState.player.setVolume(playerState.volume);
          resolve();
        },
        onStateChange: (event: any) => {
          // Update playing state based on the player state
          playerState.isPlaying = event.data === window.YT.PlayerState.PLAYING;
          
          // Handle video ended
          if (event.data === window.YT.PlayerState.ENDED) {
            // You could dispatch an event or call a callback here
            console.log('Video ended');
            window.dispatchEvent(new CustomEvent('youtube-player-ended'));
          }
        },
        onError: (event: any) => {
          console.error('YouTube player error:', event.data);
          toast.error('Error playing this song');
        }
      }
    });

    // Update position periodically when playing
    setInterval(() => {
      if (playerState.isPlaying && playerState.player && playerState.isReady) {
        playerState.position = Math.floor(playerState.player.getCurrentTime());
      }
    }, 1000);
  });
};

// Search for a song on YouTube
export const searchYouTube = async (query: string): Promise<string | null> => {
  try {
    // Here we would typically make an API call to YouTube Data API
    // For now, we'll simulate this by constructing a search URL
    // In a real implementation, you should use the YouTube Data API
    
    // For the purposes of this demo, you can set up a proxy server
    // or handle API keys securely on the backend
    
    // Let's use a simple approach for now
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const response = await fetch(searchUrl);
    const html = await response.text();
    
    // Extract video ID from the search results (this is a simple regex approach)
    const regex = /\/watch\?v=([a-zA-Z0-9_-]{11})/;
    const match = regex.exec(html);
    
    if (match && match[1]) {
      return match[1];
    }
    
    return null;
  } catch (error) {
    console.error('Error searching YouTube:', error);
    return null;
  }
};

// Play a song using a search query (artist + title)
export const playSongByQuery = async (query: string): Promise<boolean> => {
  if (!playerState.isReady) {
    toast.error('YouTube player is not ready');
    return false;
  }
  
  try {
    const videoId = await searchYouTube(query);
    
    if (!videoId) {
      toast.error('No matching YouTube video found');
      return false;
    }
    
    return playSongById(videoId);
  } catch (error) {
    console.error('Error playing song:', error);
    toast.error('Failed to play song');
    return false;
  }
};

// Play a song by YouTube videoId
export const playSongById = (videoId: string): boolean => {
  if (!playerState.isReady) {
    console.error('YouTube player is not ready');
    return false;
  }
  
  try {
    playerState.player.loadVideoById(videoId);
    playerState.currentVideoId = videoId;
    playerState.isPlaying = true;
    return true;
  } catch (error) {
    console.error('Error playing song by ID:', error);
    return false;
  }
};

// Pause the player
export const pausePlayer = (): void => {
  if (playerState.isReady && playerState.player) {
    playerState.player.pauseVideo();
    playerState.isPlaying = false;
  }
};

// Resume the player
export const resumePlayer = (): void => {
  if (playerState.isReady && playerState.player) {
    playerState.player.playVideo();
    playerState.isPlaying = true;
  }
};

// Stop the player
export const stopPlayer = (): void => {
  if (playerState.isReady && playerState.player) {
    playerState.player.stopVideo();
    playerState.isPlaying = false;
    playerState.currentVideoId = null;
  }
};

// Seek to a specific position in seconds
export const seekTo = (seconds: number): void => {
  if (playerState.isReady && playerState.player) {
    playerState.player.seekTo(seconds, true);
  }
};

// Set player volume (0-100)
export const setVolume = (volume: number): void => {
  const clampedVolume = Math.max(0, Math.min(100, volume));
  playerState.volume = clampedVolume;
  
  if (playerState.isReady && playerState.player) {
    playerState.player.setVolume(clampedVolume);
  }
};

// Get current player state
export const getPlayerState = (): YouTubePlayerState => {
  return { ...playerState };
};
