
import { Session, Song } from '@/types';

export const mockSongs: Song[] = [
  {
    id: 'song_1',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    album: 'After Hours',
    cover: 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36',
    duration: 203,
    url: '#',
    addedBy: 'user_1',
    votes: ['user_1', 'user_2'],
  },
  {
    id: 'song_2',
    title: 'As It Was',
    artist: 'Harry Styles',
    album: "Harry's House",
    cover: 'https://i.scdn.co/image/ab67616d0000b273b46f74097655d7f353caab14',
    duration: 167,
    url: '#',
    addedBy: 'user_2',
    votes: ['user_2'],
  },
  {
    id: 'song_3',
    title: 'Bad Guy',
    artist: 'Billie Eilish',
    album: 'When We All Fall Asleep, Where Do We Go?',
    cover: 'https://i.scdn.co/image/ab67616d0000b273d55a1a1cd77bea3ec91b8971',
    duration: 194,
    url: '#',
    addedBy: 'user_1',
    votes: [],
  },
  {
    id: 'song_4',
    title: 'Levitating',
    artist: 'Dua Lipa',
    album: 'Future Nostalgia',
    cover: 'https://i.scdn.co/image/ab67616d0000b273bd26ede1ae69327010d49946',
    duration: 203,
    url: '#',
    addedBy: 'user_3',
    votes: ['user_1'],
  },
  {
    id: 'song_5',
    title: 'Peaches',
    artist: 'Justin Bieber ft. Daniel Caesar, Giveon',
    album: 'Justice',
    cover: 'https://i.scdn.co/image/ab67616d0000b273e6f407c7f3a0ec98845e4431',
    duration: 198,
    url: '#',
    addedBy: 'user_2',
    votes: ['user_2', 'user_3'],
  },
  {
    id: 'song_6',
    title: 'Save Your Tears',
    artist: 'The Weeknd & Ariana Grande',
    album: 'After Hours',
    cover: 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36',
    duration: 215,
    url: '#',
    addedBy: 'user_3',
    votes: ['user_1', 'user_3'],
  },
  {
    id: 'song_7',
    title: 'Stay',
    artist: 'The Kid LAROI & Justin Bieber',
    album: 'F*CK LOVE 3: OVER YOU',
    cover: 'https://i.scdn.co/image/ab67616d0000b2739e690225ad4445530612cca9',
    duration: 222,
    url: '#',
    addedBy: 'user_1',
    votes: ['user_1'],
  },
  {
    id: 'song_8',
    title: 'good 4 u',
    artist: 'Olivia Rodrigo',
    album: 'SOUR',
    cover: 'https://i.scdn.co/image/ab67616d0000b273a91c10fe9472d9bd89802e5a',
    duration: 178,
    url: '#',
    addedBy: 'user_2',
    votes: ['user_2'],
  },
  {
    id: 'song_9',
    title: 'Montero (Call Me By Your Name)',
    artist: 'Lil Nas X',
    album: 'MONTERO',
    cover: 'https://i.scdn.co/image/ab67616d0000b2737d61a8fbb3d6142982c23993',
    duration: 209,
    url: '#',
    addedBy: 'user_3',
    votes: ['user_3'],
  },
  {
    id: 'song_10',
    title: 'drivers license',
    artist: 'Olivia Rodrigo',
    album: 'SOUR',
    cover: 'https://i.scdn.co/image/ab67616d0000b273a91c10fe9472d9bd89802e5a',
    duration: 244,
    url: '#',
    addedBy: 'user_1',
    votes: ['user_1', 'user_2', 'user_3'],
  },
];

// Mock user for default sessions
const mockUsers = [
  { id: 'user_1', name: 'Alex' },
  { id: 'user_2', name: 'Sam' },
  { id: 'user_3', name: 'Jordan' },
];

export const mockSessions: Session[] = [
  {
    id: 'session_1',
    name: 'Chill Vibes Only',
    hostId: 'user_1',
    users: [mockUsers[0], mockUsers[1]],
    playlist: [mockSongs[0], mockSongs[3], mockSongs[5]],
    currentSongIndex: 0,
    isPlaying: false,
    progress: 0,
  },
  {
    id: 'session_2',
    name: "Sam's Playlist Party",
    hostId: 'user_2',
    users: [mockUsers[1], mockUsers[2]],
    playlist: [mockSongs[1], mockSongs[4], mockSongs[7]],
    currentSongIndex: 0,
    isPlaying: false,
    progress: 0,
  },
];

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};
