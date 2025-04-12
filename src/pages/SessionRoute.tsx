
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSession } from '@/context/SessionContext';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout';
import { Loader2 } from 'lucide-react';
import AuthForm from '@/components/AuthForm';

const SessionRoute: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { joinSession, currentSession } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    // If already in a session, don't try to join another
    if (currentSession) {
      setIsLoading(false);
      return;
    }
    
    // Wait for auth to be ready
    if (authLoading) return;
    
    // If not authenticated, we'll show the auth form
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }
    
    if (roomId) {
      setIsLoading(true);
      setError(null);
      
      joinSession(roomId)
        .then(success => {
          if (!success) {
            setError('Session not found or has ended');
          }
        })
        .catch(err => {
          console.error('Error joining session:', err);
          setError('Error joining session');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setError('Invalid session ID');
      setIsLoading(false);
    }
  }, [roomId, joinSession, authLoading, isAuthenticated, currentSession]);
  
  // Redirect to home if already in the session
  useEffect(() => {
    if (currentSession) {
      navigate('/');
    }
  }, [currentSession, navigate]);
  
  if (authLoading || isLoading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
          <Loader2 size={40} className="animate-spin mb-4 text-primary" />
          <h2 className="text-2xl font-semibold">Loading Session</h2>
          <p className="text-muted-foreground">Please wait while we connect you to the session</p>
        </div>
      </Layout>
    );
  }
  
  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-semibold mb-2">Sign in to join the session</h2>
          <p className="text-muted-foreground">You need to sign in first to join the shared session</p>
        </div>
        <AuthForm />
      </Layout>
    );
  }
  
  if (error) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
          <div className="glass-card p-8 rounded-lg max-w-md">
            <h2 className="text-2xl font-semibold mb-4 text-destructive">Session Not Found</h2>
            <p className="mb-6">{error}</p>
            <p className="text-muted-foreground mb-4">
              The session might have ended or the room ID might be incorrect.
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
            >
              Go to Home Page
            </button>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Joining Session...</h2>
          <p className="text-muted-foreground">Redirecting you to the session</p>
        </div>
      </div>
    </Layout>
  );
};

export default SessionRoute;
