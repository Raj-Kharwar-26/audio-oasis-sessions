
import React, { useState } from 'react';
import { useSession } from '@/context/SessionContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Share, Copy, Link, Users, Sparkles } from 'lucide-react';
import MusicPlayer from './MusicPlayer';
import Playlist from './Playlist';
import ChatBox from './ChatBox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SongSuggestions from './SongSuggestions';

const SessionView: React.FC = () => {
  const { currentSession, leaveSession, getSessionShareLink } = useSession();
  const { user } = useAuth();
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('queue');
  
  if (!currentSession) return null;
  
  const handleCopy = (text: string, what: string) => {
    navigator.clipboard.writeText(text)
      .then(() => toast.success(`${what} copied to clipboard`))
      .catch(() => toast.error('Failed to copy to clipboard'));
  };
  
  const isHost = user?.id === currentSession.hostId;
  
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
          onClick={leaveSession}
        >
          <ArrowLeft size={16} />
          Leave Session
        </Button>
        
        <h2 className="text-xl font-semibold flex items-center gap-2">
          {currentSession.name}
          <span className="text-xs bg-secondary/50 px-2 py-1 rounded-full flex items-center gap-1">
            <Users size={12} />
            {currentSession.users.length}
          </span>
        </h2>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
          onClick={() => setShowShareDialog(true)}
        >
          <Share size={16} />
          Invite Friends
        </Button>
      </div>
      
      <MusicPlayer />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-lg overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full">
              <TabsTrigger value="queue" className="flex-1">Queue ({currentSession.playlist.length})</TabsTrigger>
              <TabsTrigger value="add" className="flex-1">Add Songs</TabsTrigger>
              {isHost && (
                <TabsTrigger value="ai-dj" className="flex-1 gap-1">
                  <Sparkles size={14} className="text-primary" />
                  AI-DJ
                </TabsTrigger>
              )}
            </TabsList>
            <div className="p-4">
              {activeTab === 'queue' && <Playlist />}
              {activeTab === 'add' && <SongSuggestions />}
              {activeTab === 'ai-dj' && isHost && (
                <div className="space-y-4 py-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">AI-DJ Suggestions</h3>
                    <Button size="sm" variant="secondary" className="gap-1">
                      <Sparkles size={14} />
                      Refresh Suggestions
                    </Button>
                  </div>
                  <SongSuggestions isAiDj={true} />
                </div>
              )}
            </div>
          </Tabs>
        </div>
        <ChatBox />
      </div>
      
      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Friends to Join</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Room ID</p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 px-2 text-xs"
                  onClick={() => handleCopy(currentSession.roomId, 'Room ID')}
                >
                  <Copy size={14} className="mr-1" />
                  Copy
                </Button>
              </div>
              <div className="flex items-center gap-2 bg-secondary/20 p-2 rounded-md">
                <code className="text-md">{currentSession.roomId}</code>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Share Link</p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 px-2 text-xs"
                  onClick={() => handleCopy(getSessionShareLink(currentSession.id), 'Share link')}
                >
                  <Copy size={14} className="mr-1" />
                  Copy
                </Button>
              </div>
              <div className="flex items-center gap-2 bg-secondary/20 p-2 rounded-md overflow-x-auto">
                <Link size={14} />
                <code className="text-xs">{getSessionShareLink(currentSession.id)}</code>
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Anyone with this link or ID can join your listening session in real-time
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SessionView;
