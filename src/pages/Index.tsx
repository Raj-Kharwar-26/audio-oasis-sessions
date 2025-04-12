
import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { useSession } from '@/context/SessionContext';
import AuthForm from '@/components/AuthForm';
import SessionList from '@/components/SessionList';
import SessionView from '@/components/SessionView';
import JoinSessionForm from '@/components/JoinSessionForm';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Session } from '@/types';
import { Share, Link, Copy, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Index = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { currentSession, sessions, mySessions, joinSession, getSessionShareLink } = useSession();
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  
  const handleCopy = (text: string, what: string) => {
    navigator.clipboard.writeText(text)
      .then(() => toast.success(`${what} copied to clipboard`))
      .catch(() => toast.error('Failed to copy to clipboard'));
  };
  
  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-semibold">Loading...</h2>
            <p className="text-muted-foreground">Please wait</p>
          </div>
        </div>
      </Layout>
    );
  }
  
  if (!isAuthenticated) {
    return (
      <Layout>
        <AuthForm />
      </Layout>
    );
  }
  
  if (currentSession) {
    return (
      <Layout>
        <SessionView />
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="space-y-8">
        {/* Join Session by Room ID */}
        <div className="glass-card p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Join a Session by Room ID</h2>
          <JoinSessionForm />
        </div>
        
        {/* My Sessions Section */}
        {mySessions.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">My Sessions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mySessions.map(session => (
                <Card key={session.id} className="glass-card overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1">
                  <CardHeader>
                    <CardTitle className="text-xl">{session.name}</CardTitle>
                    <div className="text-sm text-muted-foreground">
                      <span>Created by you</span>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">
                        {session.playlist.length} songs in playlist
                      </p>
                      <p className="text-sm font-medium flex items-center gap-1">
                        <UserPlus size={14} />
                        <span>{session.users.length} listeners</span>
                      </p>
                      
                      {session.playlist.length > 0 && session.playlist[session.currentSongIndex] && (
                        <div className="mt-4 p-2 bg-secondary/20 rounded-md">
                          <p className="text-xs text-muted-foreground">Currently playing:</p>
                          <p className="text-sm font-medium">{session.playlist[session.currentSongIndex].title}</p>
                          <p className="text-xs">{session.playlist[session.currentSongIndex].artist}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  
                  <div className="flex px-6 pb-6 gap-2">
                    <Button 
                      className="flex-1" 
                      onClick={() => joinSession(session.id)}
                    >
                      Join
                    </Button>
                    <Button 
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setSelectedSession(session);
                        setShowShareDialog(true);
                      }}
                    >
                      <Share size={16} />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
        
        {/* All Sessions */}
        <SessionList />
      </div>
      
      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Session</DialogTitle>
          </DialogHeader>
          {selectedSession && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Room ID</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs"
                    onClick={() => handleCopy(selectedSession.roomId, 'Room ID')}
                  >
                    <Copy size={14} className="mr-1" />
                    Copy
                  </Button>
                </div>
                <div className="flex items-center gap-2 bg-secondary/20 p-2 rounded-md">
                  <code className="text-md">{selectedSession.roomId}</code>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Share Link</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs"
                    onClick={() => handleCopy(getSessionShareLink(selectedSession.id), 'Share link')}
                  >
                    <Copy size={14} className="mr-1" />
                    Copy
                  </Button>
                </div>
                <div className="flex items-center gap-2 bg-secondary/20 p-2 rounded-md overflow-x-auto">
                  <Link size={14} />
                  <code className="text-xs">{getSessionShareLink(selectedSession.id)}</code>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Index;
