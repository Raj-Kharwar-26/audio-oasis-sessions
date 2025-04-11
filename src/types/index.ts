
export interface User {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  createdAt?: number;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  cover?: string;
  duration: number;
  url: string;
  addedBy: string;
  votes: string[];
  youtubeId?: string;
}

export interface Message {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
}

export interface Session {
  id: string;
  name: string;
  hostId: string;
  users: User[];
  playlist: Song[];
  currentSongIndex: number;
  isPlaying: boolean;
  progress: number;
  timestamp?: number;
}

export type SongSuggestion = Omit<Song, 'id' | 'addedBy' | 'votes'>;

export enum PlayerState {
  PLAYING = 'playing',
  PAUSED = 'paused',
  LOADING = 'loading',
  ERROR = 'error',
}
