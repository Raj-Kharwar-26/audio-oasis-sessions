
import React, { useState } from 'react';
import { useSession } from '@/context/SessionContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Share } from 'lucide-react';
import MusicPlayer from './MusicPlayer';
import Playlist from './Playlist';
import ChatBox from './ChatBox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Copy, Link } from 'lucide-react';
import { toast } from 'sonner';

const SessionView: React.FC = () => {
  const { currentSession, leaveSession, getSessionShareLink } = useSession();
  const [showShareDialog, setShowShareDialog] = useState(false);
  
  if (!currentSession) return null;
  
  const handleCopy = (text: string, what: string) => {
    navigator.clipboard.writeText(text)
      .then(() => toast.success(`${what} copied to clipboard`))
      .catch(() => toast.error('Failed to copy to clipboard'));
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
          onClick={leaveSession}
        >
          <ArrowLeft size={16} />
          Leave Session
        </Button>
        
        <h2 className="text-xl font-semibold">
          {currentSession.name}
        </h2>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
          onClick={() => setShowShareDialog(true)}
        >
          <Share size={16} />
          Share
        </Button>
      </div>
      
      <MusicPlayer />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Playlist />
        <ChatBox />
      </div>
      
      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Session</DialogTitle>
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
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SessionView;
