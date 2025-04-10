
import React, { useState } from 'react';
import { useSession } from '@/context/SessionContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Music, Search, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { SongSuggestion } from '@/types';
import { formatTime } from '@/lib/utils';

const AddSongForm: React.FC = () => {
  const { addSong, getSuggestions } = useSession();
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [duration, setDuration] = useState(180); // Default 3 minutes
  
  // Get AI suggestions
  const suggestions = getSuggestions();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !artist.trim()) return;
    
    const newSong: SongSuggestion = {
      title: title.trim(),
      artist: artist.trim(),
      album: album.trim() || undefined,
      duration,
      url: '#', // Placeholder URL
    };
    
    addSong(newSong);
    
    // Reset form
    setTitle('');
    setArtist('');
    setAlbum('');
    setDuration(180);
  };
  
  const handleAddSuggestion = (suggestion: SongSuggestion) => {
    addSong(suggestion);
  };
  
  return (
    <div className="p-4">
      <Tabs defaultValue="manual">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="manual" className="flex-1">
            <Search className="h-4 w-4 mr-2" />
            Add Manually
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex-1">
            <Sparkles className="h-4 w-4 mr-2" />
            AI Suggestions
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="manual">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Song Title</Label>
              <Input
                id="title"
                placeholder="Enter song title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="artist">Artist</Label>
              <Input
                id="artist"
                placeholder="Enter artist name"
                value={artist}
                onChange={e => setArtist(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="album">Album (optional)</Label>
              <Input
                id="album"
                placeholder="Enter album name"
                value={album}
                onChange={e => setAlbum(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="duration">Duration ({formatTime(duration)})</Label>
              <Input
                id="duration"
                type="range"
                min={30}
                max={600}
                step={10}
                value={duration}
                onChange={e => setDuration(Number(e.target.value))}
                className="cursor-pointer"
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={!title.trim() || !artist.trim()}>
              Add to Playlist
            </Button>
          </form>
        </TabsContent>
        
        <TabsContent value="ai">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">AI DJ Suggestions</h3>
              <Sparkles className="h-5 w-5 text-primary animate-pulse-slow" />
            </div>
            
            <ScrollArea className="h-[280px] pr-2">
              <div className="space-y-3">
                {suggestions.map((suggestion, index) => (
                  <Card key={index} className="hover:bg-secondary/20 transition-colors">
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="h-12 w-12 rounded bg-secondary flex items-center justify-center shrink-0">
                        <Music className="h-6 w-6 text-primary" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{suggestion.title}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {suggestion.artist}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatTime(suggestion.duration)}
                        </p>
                      </div>
                      
                      <Button 
                        size="sm"
                        onClick={() => handleAddSuggestion(suggestion)}
                      >
                        Add
                      </Button>
                    </CardContent>
                  </Card>
                ))}
                
                {suggestions.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      No suggestions available
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AddSongForm;
