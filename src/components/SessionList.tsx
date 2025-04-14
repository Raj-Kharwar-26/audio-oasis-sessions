
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Music, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSession } from '@/context/SessionContext';
import { toast } from 'sonner';
import JoinSessionForm from './JoinSessionForm';
import { useIsMobile } from '@/hooks/use-mobile';

const SessionList: React.FC = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { createSession, mySessions } = useSession();
  const isMobile = useIsMobile();

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sessionName.trim()) return;
    
    setIsCreating(true);
    try {
      const result = await createSession(sessionName.trim());
      if (!result) {
        toast.error('Failed to create session');
      }
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error('An error occurred while creating the session');
    } finally {
      setIsCreating(false);
      setSessionName('');
      setShowCreateForm(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center text-center space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold text-gradient">
          Music Explorer
        </h1>
        <p className="text-lg text-muted-foreground max-w-md">
          Discover and listen to your favorite music
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Join session card */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Join Session</h2>
            <JoinSessionForm />
          </CardContent>
        </Card>
        
        {/* Create session card */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Create Session</h2>
            {showCreateForm ? (
              <form onSubmit={handleCreateSession} className="flex flex-col gap-2">
                <Input
                  placeholder="Session name"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  className="bg-secondary/50"
                  disabled={isCreating}
                />
                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    className="flex-1"
                    disabled={isCreating || !sessionName.trim()}
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Session'
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowCreateForm(false)}
                    disabled={isCreating}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <Button 
                onClick={() => setShowCreateForm(true)} 
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create New Session
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* My Sessions display */}
      {mySessions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">My Sessions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mySessions.map(session => (
              <Card key={session.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/20 p-2 rounded-full">
                      <Music size={20} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{session.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {session.users.length} {session.users.length === 1 ? 'user' : 'users'} • Room ID: {session.roomId}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionList;
