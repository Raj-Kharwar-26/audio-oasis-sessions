import React, { useState } from 'react';
import { useSession } from '@/context/SessionContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Users, Music, Plus, LogIn } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
const SessionList: React.FC = () => {
  const {
    sessions,
    joinSession,
    createSession
  } = useSession();
  const [newSessionName, setNewSessionName] = useState('');
  const [roomIdToJoin, setRoomIdToJoin] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionName.trim()) {
      toast.error("Session name can't be empty");
      return;
    }
    setIsCreatingSession(true);
    try {
      const roomId = await createSession(newSessionName);
      if (roomId) {
        toast.success(`Session "${newSessionName}" created!`);
        setNewSessionName('');
        setIsCreateDialogOpen(false);
      }
    } finally {
      setIsCreatingSession(false);
    }
  };
  const handleJoinByRoomId = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomIdToJoin.trim()) {
      toast.error("Room ID can't be empty");
      return;
    }
    const success = await joinSession(roomIdToJoin.trim());
    if (success) {
      setRoomIdToJoin('');
      setIsJoinDialogOpen(false);
    }
  };
  return <div className="space-y-8">
      <div className="flex flex-col items-center text-center space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold text-gradient">
          Join a Listening Session
        </h1>
        <p className="text-lg text-muted-foreground max-w-md">
          Listen to music with friends in perfect sync, chat, and collaborate on playlists
        </p>
      </div>
      
      <div className="flex justify-center gap-3">
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
              <Input placeholder="Session name" value={newSessionName} onChange={e => setNewSessionName(e.target.value)} className="bg-secondary/50" required />
              <Button type="submit" className="w-full" disabled={isCreatingSession || !newSessionName.trim()}>
                {isCreatingSession ? "Creating..." : "Create"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        
        <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              <LogIn size={16} />
              Join by ID
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Join by Room ID</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleJoinByRoomId} className="space-y-4 mt-4">
              <Input placeholder="Enter Room ID" value={roomIdToJoin} onChange={e => setRoomIdToJoin(e.target.value)} className="bg-secondary/50" required />
              <Button type="submit" className="w-full" disabled={!roomIdToJoin.trim()}>
                Join Session
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      
    </div>;
};
export default SessionList;