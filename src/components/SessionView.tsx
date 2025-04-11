
import React, { useState } from 'react';
import { useSession } from '@/context/SessionContext';
import { Button } from '@/components/ui/button';
import { 
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Copy, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import MusicPlayer from './MusicPlayer';
import Playlist from './Playlist';
import ChatBox from './ChatBox';

const SessionView: React.FC = () => {
  const { currentSession, leaveSession } = useSession();
  const [isShareDrawerOpen, setIsShareDrawerOpen] = useState(false);
  
  if (!currentSession) return null;
  
  const shareUrl = `${window.location.origin}/?session=${currentSession.id}`;
  
  const copyLinkToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success('Share link copied to clipboard!');
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
        
        <Drawer open={isShareDrawerOpen} onOpenChange={setIsShareDrawerOpen}>
          <DrawerTrigger asChild>
            <Button size="sm" variant="outline" className="gap-2">
              <Share2 size={16} />
              Invite
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Invite friends to join</DrawerTitle>
              <DrawerDescription>
                Share this link with friends to invite them to your listening session
              </DrawerDescription>
            </DrawerHeader>
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Input 
                  value={shareUrl} 
                  readOnly 
                  className="bg-secondary/50"
                />
                <Button size="icon" onClick={copyLinkToClipboard}>
                  <Copy size={16} />
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>Session ID: <span className="font-mono">{currentSession.id}</span></p>
              </div>
            </div>
            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant="outline">Close</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
      
      <MusicPlayer />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Playlist />
        <ChatBox />
      </div>
    </div>
  );
};

export default SessionView;
