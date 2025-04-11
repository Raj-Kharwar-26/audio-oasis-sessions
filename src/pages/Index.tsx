
import React, { useEffect } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { useSession } from '@/context/SessionContext';
import AuthForm from '@/components/AuthForm';
import SessionList from '@/components/SessionList';
import SessionView from '@/components/SessionView';
import { toast } from 'sonner';

const Index = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { currentSession, joinSession } = useSession();
  
  useEffect(() => {
    if (isAuthenticated) {
      // Check for session ID in URL when component mounts
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('session');
      
      if (sessionId) {
        // Try to join the session from URL parameter
        console.log("Attempting to join session from URL:", sessionId);
        joinSession(sessionId);
        
        // Clear the URL parameter
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, [isAuthenticated, joinSession]);
  
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
