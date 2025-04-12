
export class YouTubePlayer {
  private player: YT.Player | null = null;
  private containerId: string;
  private isReady: boolean = false;
  private readyPromise: Promise<void>;
  private readyResolve!: () => void;
  private readyReject!: (error: Error) => void;

  constructor(containerId: string) {
    this.containerId = containerId;
    this.readyPromise = new Promise<void>((resolve, reject) => {
      this.readyResolve = resolve;
      this.readyReject = reject;
    });
    this.loadYouTubeApi();
  }

  private loadYouTubeApi(): void {
    // If already loaded, return
    if (window.YT) {
      return;
    }

    // Create a global callback
    (window as any).onYouTubeIframeAPIReady = () => {
      // YouTube API is ready
      console.log("YouTube API is ready");
    };

    // Load the script
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
  }

  public async initialize(): Promise<void> {
    if (this.player) {
      return this.readyPromise;
    }

    try {
      // Wait for the YouTube API to load
      await this.waitForYouTubeApi();

      // Create the player
      return new Promise<void>((resolve, reject) => {
        const playerContainer = document.getElementById(this.containerId);
        if (!playerContainer) {
          reject(new Error(`Container with ID "${this.containerId}" not found`));
          return;
        }

        this.player = new YT.Player(this.containerId, {
          height: '0',
          width: '0',
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            enablejsapi: 1,
            fs: 0,
            modestbranding: 1,
            playsinline: 1,
            rel: 0,
          },
          events: {
            onReady: () => {
              this.isReady = true;
              this.readyResolve();
              resolve();
            },
            onError: (event) => {
              console.error("YouTube player error:", event.data);
              reject(new Error(`YouTube player error: ${event.data}`));
            },
            onStateChange: (event) => {
              console.log("YouTube player state changed:", event.data);
            }
          }
        });
      });
    } catch (error) {
      this.readyReject(error);
      throw error;
    }
  }

  private waitForYouTubeApi(): Promise<void> {
    return new Promise<void>((resolve) => {
      const checkYT = () => {
        if (window.YT && window.YT.Player) {
          resolve();
        } else {
          setTimeout(checkYT, 100);
        }
      };
      
      checkYT();
    });
  }

  public async loadVideoById(videoId: string): Promise<void> {
    await this.readyPromise;
    this.player?.loadVideoById(videoId, 0, 'default');
  }

  public async playVideo(): Promise<void> {
    await this.readyPromise;
    this.player?.playVideo();
  }

  public async pauseVideo(): Promise<void> {
    await this.readyPromise;
    this.player?.pauseVideo();
  }

  public async seekTo(seconds: number): Promise<void> {
    await this.readyPromise;
    this.player?.seekTo(seconds, true);
  }

  public async getCurrentTime(): Promise<number> {
    await this.readyPromise;
    return this.player?.getCurrentTime() || 0;
  }

  public async getDuration(): Promise<number> {
    await this.readyPromise;
    return this.player?.getDuration() || 0;
  }

  public destroy(): void {
    if (this.player) {
      this.player.destroy();
      this.player = null;
      this.isReady = false;
      this.readyPromise = new Promise<void>((resolve, reject) => {
        this.readyResolve = resolve;
        this.readyReject = reject;
      });
    }
  }
}

// Add YouTube Player API types
declare global {
  interface Window {
    YT: typeof YT;
    onYouTubeIframeAPIReady: () => void;
  }
}
