
import React from 'react';
import { useSession } from '@/context/SessionContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import MusicPlayer from './MusicPlayer';
import Playlist from './Playlist';
import ChatBox from './ChatBox';

const SessionView: React.FC = () => {
  const { currentSession, leaveSession } = useSession();
  
  if (!currentSession) return null;
  
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
