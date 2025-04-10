
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Play, Pause, Plus } from 'lucide-react';
import { Song } from '@/types';
import { useSession } from '@/context/SessionContext';
import { useAuth } from '@/context/AuthContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatTime } from '@/lib/utils';
import { toast } from 'sonner';

// Mock API for song search - in a real app, this would be an API call
const searchSongs = async (query: string): Promise<Song[]> => {
  // We'll simulate a network request with a timeout
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // This is the mock data - in a real app, this would be from an API
  const allSongs = [
    {
      id: "song_1",
      title: "Blinding Lights",
      artist: "The Weeknd",
      album: "After Hours",
      cover: "https://i.scdn.co/image/ab67616d0000b273a594547e5f5927d0507051e0",
      duration: 201,
      url: "https://p.scdn.co/mp3-preview/9696cfad3e4114a6e25967d63bc4a2c3d0206260?cid=774b29d4f13844c495f206cafdad9c86",
      addedBy: "system",
      votes: []
    },
    {
      id: "song_2",
      title: "Shape of You",
      artist: "Ed Sheeran",
      album: "÷ (Divide)",
      cover: "https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96",
      duration: 234,
      url: "https://p.scdn.co/mp3-preview/84462d8e1e4d0f9e5ccd06f0da390f65843774a2?cid=774b29d4f13844c495f206cafdad9c86",
      addedBy: "system",
      votes: []
    },
    {
      id: "song_3",
      title: "Dance Monkey",
      artist: "Tones And I",
      album: "The Kids Are Coming",
      cover: "https://i.scdn.co/image/ab67616d0000b27360be9dde82c8b8ca62efe930",
      duration: 210,
      url: "https://p.scdn.co/mp3-preview/7a910d90859e4d2fa3b13afdf0a77669f0f5faaa?cid=774b29d4f13844c495f206cafdad9c86",
      addedBy: "system",
      votes: []
    },
    {
      id: "song_4",
      title: "Uptown Funk",
      artist: "Mark Ronson ft. Bruno Mars",
      album: "Uptown Special",
      cover: "https://i.scdn.co/image/ab67616d0000b273e419ccba0baa7bd5962dc082",
      duration: 270,
      url: "https://p.scdn.co/mp3-preview/32e9b52e35d9575e54738bb5a06facf54c4853ca?cid=774b29d4f13844c495f206cafdad9c86",
      addedBy: "system",
      votes: []
    },
    {
      id: "song_5",
      title: "Levitating",
      artist: "Dua Lipa",
      album: "Future Nostalgia",
      cover: "https://i.scdn.co/image/ab67616d0000b2734e0362c225863f6ae922b836",
      duration: 203,
      url: "https://p.scdn.co/mp3-preview/fedbedb9fecac4762c8c1cddad58fc19f490d597?cid=774b29d4f13844c495f206cafdad9c86",
      addedBy: "system",
      votes: []
    },
    {
      id: "song_6",
      title: "Heat Waves",
      artist: "Glass Animals",
      album: "Dreamland",
      cover: "https://i.scdn.co/image/ab67616d0000b2739e495fb707973f3390850eea",
      duration: 238,
      url: "https://p.scdn.co/mp3-preview/1126b5d7829da5b3c39b0017d2460aaaafae3219?cid=774b29d4f13844c495f206cafdad9c86",
      addedBy: "system",
      votes: []
    },
    {
      id: "song_7",
      title: "Bad Guy",
      artist: "Billie Eilish",
      album: "WHEN WE ALL FALL ASLEEP, WHERE DO WE GO?",
      cover: "https://i.scdn.co/image/ab67616d0000b27382b243023b937fd579a35533",
      duration: 194,
      url: "https://p.scdn.co/mp3-preview/4ad596e5f5229066901c11d7f5947d8d5d246b44?cid=774b29d4f13844c495f206cafdad9c86",
      addedBy: "system",
      votes: []
    },
    {
      id: "song_8",
      title: "Someone You Loved",
      artist: "Lewis Capaldi",
      album: "Divinely Uninspired To A Hellish Extent",
      cover: "https://i.scdn.co/image/ab67616d0000b2739460e08032fe37c1149f88fd",
      duration: 182,
      url: "https://p.scdn.co/mp3-preview/aee99b40fa3f7da01d9a26fbb92904befcb31d85?cid=774b29d4f13844c495f206cafdad9c86",
      addedBy: "system",
      votes: []
    }
  ];
  
  if (!query) return [];
  
  // Filter songs based on query (title, artist, album)
  return allSongs.filter(song => 
    song.title.toLowerCase().includes(query.toLowerCase()) || 
    song.artist.toLowerCase().includes(query.toLowerCase()) ||
    (song.album && song.album.toLowerCase().includes(query.toLowerCase()))
  );
};

const SongSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPlayingSong, setCurrentPlayingSong] = useState<Song | null>(null);
  const [audio] = useState(new Audio());
  const { currentSession, addSongToSession } = useSession();
  const { user } = useAuth();
  
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const songs = await searchSongs(query);
      setResults(songs);
    } catch (error) {
      console.error("Error searching songs:", error);
      toast.error("Failed to search songs. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  const handlePlayPause = (song: Song) => {
    if (currentPlayingSong && currentPlayingSong.id === song.id) {
      // Already playing this song, so pause/resume
      if (audio.paused) {
        audio.play();
      } else {
        audio.pause();
      }
      
      // Update UI state
      setCurrentPlayingSong({...currentPlayingSong});
    } else {
      // Play a new song
      if (currentPlayingSong) {
        audio.pause();
      }
      
      audio.src = song.url;
      audio.play();
      setCurrentPlayingSong(song);
      
      // Add event listener for when song ends
      audio.onended = () => {
        setCurrentPlayingSong(null);
      };
    }
  };
  
  const handleAddToSession = (song: Song) => {
    if (!currentSession || !user) {
      toast.error("You need to join a session first to add songs");
      return;
    }
    
    addSongToSession({
      title: song.title,
      artist: song.artist,
      album: song.album,
      cover: song.cover,
      duration: song.duration,
      url: song.url
    });
    
    toast.success(`Added "${song.title}" to the session playlist`);
  };
  
  return (
    <div className="glass-card p-6 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Search for Songs</h2>
      
      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <Input
          placeholder="Search by song, artist, or lyrics"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="bg-secondary/50"
        />
        <Button type="submit" disabled={loading}>
          {loading ? "Searching..." : <Search className="h-4 w-4" />}
        </Button>
      </form>
      
      {results.length > 0 ? (
        <ScrollArea className="h-[350px] pr-4">
          <div className="space-y-2">
            {results.map(song => (
              <div key={song.id} className="flex items-center p-3 rounded-md hover:bg-secondary/20 gap-3">
                <div className="h-12 w-12 shrink-0 rounded overflow-hidden">
                  {song.cover ? (
                    <img 
                      src={song.cover} 
                      alt={`${song.title} cover`} 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-secondary flex items-center justify-center">
                      <Search className="h-4 w-4" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{song.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground">{formatTime(song.duration)}</span>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handlePlayPause(song)}
                  >
                    {currentPlayingSong && currentPlayingSong.id === song.id && !audio.paused ? (
                      <Pause size={16} />
                    ) : (
                      <Play size={16} />
                    )}
                  </Button>
                  
                  {currentSession && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleAddToSession(song)}
                      title="Add to session playlist"
                    >
                      <Plus size={16} />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      ) : query && !loading ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No songs found for "{query}"</p>
        </div>
      ) : !query ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>Search for songs to play or add to your session</p>
        </div>
      ) : null}
    </div>
  );
};

export default SongSearch;
