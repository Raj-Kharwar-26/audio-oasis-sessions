
import React, { useState } from 'react';
import { useSession } from '@/context/SessionContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';

const JoinSessionForm: React.FC = () => {
  const [roomId, setRoomId] = useState('');
  const [joining, setJoining] = useState(false);
  const { joinSession } = useSession();

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!roomId.trim()) return;
    
    setJoining(true);
    try {
      await joinSession(roomId.trim());
    } finally {
      setJoining(false);
      setRoomId('');
    }
  };

  return (
    <form onSubmit={handleJoin} className="flex gap-2 w-full">
      <Input
        placeholder="Enter room ID to join"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
        className="bg-secondary/50 flex-grow"
      />
      <Button 
        type="submit" 
        disabled={joining || !roomId.trim()}
        className="shrink-0"
      >
        {joining ? "Joining..." : (
          <>
            <LogIn className="mr-2 h-4 w-4" />
            Join
          </>
        )}
      </Button>
    </form>
  );
};

export default JoinSessionForm;
