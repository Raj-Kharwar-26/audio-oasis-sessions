
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Home, LogIn } from 'lucide-react';
import { useSession } from '@/context/SessionContext';
import { useAuth } from '@/context/AuthContext';
import SessionView from '@/components/SessionView';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

const SessionRoute: React.FC = () => {
  const navigate = useNavigate();
  const { roomId } = useParams<{ roomId: string }>();
  const { joinSession } = useSession();
  const { isAuthenticated, isLoading } = useAuth();
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  
  useEffect(() => {
    // Auto-join the session if the user is authenticated and roomId is provided
    if (roomId && isAuthenticated && !isLoading) {
      handleJoinSession();
    }
  }, [roomId, isAuthenticated, isLoading]);
  
  const handleJoinSession = async () => {
    if (!roomId || !isAuthenticated) return;
    
    setJoining(true);
    setError('');
    
    try {
      const success = await joinSession(roomId);
      if (!success) {
        setError('Failed to join session. It may no longer be active or you may not have permission to join.');
      }
    } catch (err) {
      setError('An error occurred while joining the session.');
      console.error(err);
    } finally {
      setJoining(false);
    }
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
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
          <div className="glass-card p-8 rounded-lg max-w-md">
            <h2 className="text-2xl font-semibold mb-4">Authentication Required</h2>
            <p className="mb-6">You need to sign in to join this music session.</p>
            <Button
              onClick={() => navigate('/')}
              className="gap-2"
            >
              <LogIn size={16} />
              Sign In to Continue
            </Button>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        {error ? (
          <Card className="max-w-md w-full">
            <CardContent className="p-6 text-center">
              <h2 className="text-2xl font-semibold mb-4">Session Error</h2>
              <p className="mb-6 text-destructive">{error}</p>
              <Button
                onClick={() => navigate('/')}
                className="gap-2"
              >
                <Home size={16} />
                Go to Home Page
              </Button>
            </CardContent>
          </Card>
        ) : joining ? (
          <div className="text-center">
            <h2 className="text-2xl font-semibold">Joining Session...</h2>
            <p className="text-muted-foreground">Please wait</p>
          </div>
        ) : (
          <Card className="max-w-md w-full">
            <CardContent className="p-6">
              <h2 className="text-2xl font-semibold mb-4 text-center">Join Listening Session</h2>
              <p className="mb-6 text-center text-muted-foreground">
                You're about to join a music session with room ID: <strong>{roomId}</strong>
              </p>
              <div className="flex flex-col gap-4">
                <Button 
                  onClick={handleJoinSession} 
                  className="w-full"
                  disabled={joining}
                >
                  {joining ? "Joining..." : "Join Session"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/')}
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default SessionRoute;
