
import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import AuthForm from '@/components/AuthForm';
import SongSearch from '@/components/SongSearch';
import { Button } from '@/components/ui/button';
import { Plus, Users } from 'lucide-react';
import SessionView from '@/components/SessionView';
import { useSession } from '@/context/SessionContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const Explore: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { currentSession, createSession } = useSession();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
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

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) {
      toast.error("Room name can't be empty");
      return;
    }
    
    setIsCreating(true);
    try {
      await createSession(roomName);
      toast.success(`Session "${roomName}" created successfully!`);
      setRoomName('');
      setShowCreateDialog(false);
    } catch (error) {
      console.error("Error creating session:", error);
      toast.error("Failed to create room. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };
  
  // If in a session, show the session view
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
        <div className="flex flex-col items-center text-center space-y-4 mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-gradient">
            Explore Music
          </h1>
          <p className="text-lg text-muted-foreground max-w-md">
            Discover and listen to music from YouTube
          </p>
          
          {/* Create Room Button */}
          <Button 
            onClick={() => setShowCreateDialog(true)}
            className="mt-2 gap-2"
            size="lg"
          >
            <Plus size={16} />
            <Users size={16} />
            Create Listening Room
          </Button>
        </div>
        
        <SongSearch />
      </div>
      
      {/* Create Room Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a Listening Room</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateRoom} className="space-y-4 mt-4">
            <div>
              <Input
                placeholder="Enter room name"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="bg-secondary/50"
                disabled={isCreating}
                autoFocus
              />
            </div>
            <Button type="submit" className="w-full" disabled={isCreating}>
              {isCreating ? "Creating..." : "Create Room"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Explore;
