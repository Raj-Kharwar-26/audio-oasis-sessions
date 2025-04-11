
import React, { useEffect } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { useSession } from '@/context/SessionContext';
import AuthForm from '@/components/AuthForm';
import SessionList from '@/components/SessionList';
import SessionView from '@/components/SessionView';
import { toast } from 'sonner';
import { getSession } from '@/services/spotify';

const Index = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { currentSession, joinSession } = useSession();
  
  useEffect(() => {
    // Check for session ID in URL when component mounts
    const checkSessionInUrl = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('session');
      
      if (sessionId) {
        console.log("Found session ID in URL:", sessionId);
        // Get the session from storage
        const session = await getSession(sessionId);
        
        if (session) {
          console.log("Session found, joining:", session.name);
          // Join the session
          joinSession(sessionId);
          toast.success(`Joined session: ${session.name}`);
        } else {
          console.log("Session not found:", sessionId);
          toast.error('Session not found or has ended');
        }
        
        // Clear the URL parameter
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
    };
    
    if (isAuthenticated && !isLoading) {
      checkSessionInUrl();
    }
  }, [isAuthenticated, isLoading, joinSession]);
  
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
  
  return (
    <Layout>
      {currentSession ? <SessionView /> : <SessionList />}
    </Layout>
  );
};

export default Index;
