
import React, { useState, useEffect } from 'react';
import { useSession } from '@/context/SessionContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Users, Music, Plus, Trash2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { getUserSessions, deleteSession } from '@/services/spotify';
import { formatDistanceToNow } from 'date-fns';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const SessionList: React.FC = () => {
  const { sessions, joinSession, createSession } = useSession();
  const { user } = useAuth();
  const [newSessionName, setNewSessionName] = useState('');
  const [joinSessionId, setJoinSessionId] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [userSessions, setUserSessions] = useState<any[]>([]);
  
  useEffect(() => {
    // Check for session ID in URL when component mounts
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session');
    
    if (sessionId) {
      // Try to join the session from URL parameter
      joinSession(sessionId);
      
      // Clear the URL parameter
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [joinSession]);
  
  useEffect(() => {
    if (user) {
      // Load user sessions
      const sessions = getUserSessions();
      setUserSessions(sessions);
    }
  }, [user, sessions]);
  
  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    createSession(newSessionName);
    setNewSessionName('');
    setIsCreateDialogOpen(false);
  };
  
  const handleJoinById = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinSessionId.trim()) {
      toast.error('Please enter a valid session ID');
      return;
    }
    
    joinSession(joinSessionId.trim());
    setJoinSessionId('');
    setIsJoinDialogOpen(false);
  };
  
  const handleDeleteSession = (sessionId: string) => {
    if (deleteSession(sessionId)) {
      setUserSessions(prev => prev.filter(s => s.id !== sessionId));
      toast.success('Session deleted');
    } else {
      toast.error('Failed to delete session');
    }
  };

  // Get creation timestamp for mock sessions (for consistent UI)
  const getSessionTimestamp = (session: any) => {
    if (session.timestamp) return session.timestamp;
    // For mock sessions, generate a random timestamp in the last 24 hours
    return Date.now() - Math.floor(Math.random() * 24 * 60 * 60 * 1000);
  };
  
  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center text-center space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold text-gradient">
          Join a Listening Session
        </h1>
        <p className="text-lg text-muted-foreground max-w-md">
          Listen to music with friends in perfect sync, chat, and collaborate on playlists
        </p>
      </div>
      
      <div className="flex justify-between">
        <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              Join by ID
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Join by Session ID</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleJoinById} className="space-y-4 mt-4">
              <Input
                placeholder="Enter session ID"
                value={joinSessionId}
                onChange={e => setJoinSessionId(e.target.value)}
                className="bg-secondary/50"
                required
              />
              <Button type="submit" className="w-full" disabled={!joinSessionId.trim()}>
                Join Session
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus size={16} />
              Create Session
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a New Session</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateSession} className="space-y-4 mt-4">
              <Input
                placeholder="Session name"
                value={newSessionName}
                onChange={e => setNewSessionName(e.target.value)}
                className="bg-secondary/50"
                required
              />
              <Button type="submit" className="w-full" disabled={!newSessionName.trim()}>
                Create
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      {userSessions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Your Sessions</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userSessions.map(session => (
              <Card key={session.id} className="glass-card overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">{session.name}</CardTitle>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteSession(session.id)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                  <CardDescription className="flex items-center gap-1">
                    <Users size={14} />
                    <span>{session.users.length} listener{session.users.length !== 1 ? 's' : ''}</span>
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 rounded bg-secondary flex items-center justify-center">
                      <Music className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {session.playlist.length} songs in playlist
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock size={12} />
                        Created {formatDistanceToNow(session.timestamp || getSessionTimestamp(session), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter>
                  <Button 
                    className="w-full" 
                    onClick={() => joinSession(session.id)}
                  >
                    Join Session
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Browse Sessions</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map(session => (
            <Card key={session.id} className="glass-card overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1">
              <CardHeader>
                <CardTitle className="text-xl">{session.name}</CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <Users size={14} />
                  <span>{session.users.length} listener{session.users.length !== 1 ? 's' : ''}</span>
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded bg-secondary flex items-center justify-center">
                    <Music className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {session.playlist.length} songs in playlist
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Hosted by {session.users.find(u => u.id === session.hostId)?.name}
                    </p>
                  </div>
                </div>
                
                <Separator className="mb-4 bg-border/30" />
                
                <div className="space-y-2">
                  <p className="text-sm font-medium">Current listeners:</p>
                  <div className="flex flex-wrap gap-2">
                    {session.users.map(user => (
                      <span key={user.id} className="text-xs px-2 py-1 rounded-full bg-secondary">
                        {user.name}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
              
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={() => joinSession(session.id)}
                >
                  Join Session
                </Button>
              </CardFooter>
            </Card>
          ))}
          
          {sessions.length === 0 && userSessions.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center p-8 glass-card rounded-lg">
              <Music className="h-16 w-16 text-primary/50 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Sessions Available</h3>
              <p className="text-muted-foreground text-center">
                Create a new session to start listening with friends
              </p>
              <Button className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
                Create Session
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionList;
