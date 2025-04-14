
import React, { useState } from 'react';
import { useSession } from '@/context/SessionContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LogIn, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const JoinSessionForm: React.FC = () => {
  const [roomId, setRoomId] = useState('');
  const [joining, setJoining] = useState(false);
  const { joinSession } = useSession();
  const navigate = useNavigate();

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!roomId.trim()) return;
    
    setJoining(true);
    try {
      const success = await joinSession(roomId.trim());
      if (!success) {
        toast.error('Failed to join session. It may no longer be active.');
      }
    } catch (error) {
      console.error('Error joining session:', error);
      toast.error('An error occurred while joining the session.');
    } finally {
      setJoining(false);
      setRoomId('');
    }
  };

  const handleSessionLink = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    
    // Check if it's a session link
    if (input.includes('/session/')) {
      try {
        const url = new URL(input);
        const pathParts = url.pathname.split('/');
        const sessionId = pathParts[pathParts.length - 1];
        setRoomId(sessionId);
      } catch (error) {
        // Not a valid URL, just set the input as is
        setRoomId(input);
      }
    } else {
      // Regular input
      setRoomId(input);
    }
  };

  return (
    <form onSubmit={handleJoin} className="flex flex-col gap-2 w-full">
      <Input
        placeholder="Enter room ID or paste share link"
        value={roomId}
        onChange={handleSessionLink}
        className="bg-secondary/50 flex-grow"
      />
      <div className="flex gap-2">
        <Button 
          type="submit" 
          disabled={joining || !roomId.trim()}
          className="flex-1"
        >
          {joining ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Joining...
            </>
          ) : (
            <>
              <LogIn className="mr-2 h-4 w-4" />
              Join Session
            </>
          )}
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => navigate('/session/demo')}
          className="flex-1"
        >
          Try Demo
        </Button>
      </div>
    </form>
  );
};

export default JoinSessionForm;
