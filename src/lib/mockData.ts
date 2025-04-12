
import { Song, User, Session } from '@/types';

// Mock users for testing
export const mockUsers: User[] = [
  {
    id: 'user-1',
    name: 'Alice',
    email: 'alice@example.com',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Alice',
    createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'user-2',
    name: 'Bob',
    email: 'bob@example.com',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Bob',
    createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'user-3',
    name: 'Charlie',
    email: 'charlie@example.com',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Charlie',
    createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
  },
];

// Mock songs for testing
export const mockSongs: Song[] = [
  {
    id: 'song-1',
    title: 'Dreams',
    artist: 'Fleetwood Mac',
    album: 'Rumours',
    cover: 'https://upload.wikimedia.org/wikipedia/en/f/fb/FMacRumours.PNG',
    duration: 254,
    url: 'https://example.com/song1.mp3',
    youtubeId: 'mrZRURcb1cM',
    addedBy: 'user-1',
    votes: ['user-2'],
  },
  {
    id: 'song-2',
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
    album: 'A Night at the Opera',
    cover: 'https://upload.wikimedia.org/wikipedia/en/4/4d/Queen_A_Night_At_The_Opera.png',
    duration: 367,
    url: 'https://example.com/song2.mp3',
    youtubeId: 'fJ9rUzIMcZQ',
    addedBy: 'user-2',
    votes: ['user-1', 'user-3'],
  },
  {
    id: 'song-3',
    title: 'Billie Jean',
    artist: 'Michael Jackson',
    album: 'Thriller',
    cover: 'https://upload.wikimedia.org/wikipedia/en/5/55/Michael_Jackson_-_Thriller.png',
    duration: 294,
    url: 'https://example.com/song3.mp3',
    youtubeId: 'Zi_XfYzdYm4',
    addedBy: 'user-3',
    votes: [],
  },
  {
    id: 'song-4',
    title: 'Yesterday',
    artist: 'The Beatles',
    album: 'Help!',
    cover: 'https://upload.wikimedia.org/wikipedia/en/e/e7/Help%21_%28The_Beatles_album_-_cover_art%29.jpg',
    duration: 125,
    url: 'https://example.com/song4.mp3',
    youtubeId: 'wXTJBr9tt8Q',
    addedBy: 'user-1',
    votes: ['user-2'],
  },
  {
    id: 'song-5',
    title: 'Sweet Child o\' Mine',
    artist: 'Guns N\' Roses',
    album: 'Appetite for Destruction',
    cover: 'https://upload.wikimedia.org/wikipedia/en/6/60/GunsnRosesAppetiteforDestructionalbumcover.jpg',
    duration: 356,
    url: 'https://example.com/song5.mp3',
    youtubeId: '1w7OgIMMRc4',
    addedBy: 'user-2',
    votes: ['user-3'],
  },
];

// Mock sessions for testing
export const mockSessions: Session[] = [
  {
    id: 'session-1',
    name: 'Friday Night Party',
    hostId: 'user-1',
    users: [
      {
        id: 'user-1',
        name: 'Alice',
      },
      {
        id: 'user-2',
        name: 'Bob',
      },
    ],
    playlist: mockSongs.slice(0, 3),
    currentSongIndex: 0,
    isPlaying: false,
    progress: 0,
    roomId: 'ABCDEF',
  },
  {
    id: 'session-2',
    name: 'Chill Vibes',
    hostId: 'user-2',
    users: [
      {
        id: 'user-2',
        name: 'Bob',
      },
      {
        id: 'user-3',
        name: 'Charlie',
      },
    ],
    playlist: mockSongs.slice(1, 4),
    currentSongIndex: 0,
    isPlaying: false,
    progress: 0,
    roomId: 'GHIJKL',
  },
];
