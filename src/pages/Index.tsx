
import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { useSession } from '@/context/SessionContext';
import AuthForm from '@/components/AuthForm';
import SessionList from '@/components/SessionList';
import SessionView from '@/components/SessionView';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Session } from '@/types';
import { Share, Link, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Index = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { currentSession, getSessionShareLink } = useSession();
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  
  const handleCopy = (text: string, what: string) => {
    navigator.clipboard.writeText(text)
      .then(() => toast.success(`${what} copied to clipboard`))
      .catch(() => toast.error('Failed to copy to clipboard'));
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
        <AuthForm />
      </Layout>
    );
  }
  
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
        {/* All Sessions */}
        <SessionList />
      </div>
      
      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Session</DialogTitle>
          </DialogHeader>
          {selectedSession && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Room ID</p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-2 text-xs"
                    onClick={() => handleCopy(selectedSession.roomId, 'Room ID')}
                  >
                    <Copy size={14} className="mr-1" />
                    Copy
                  </Button>
                </div>
                <div className="flex items-center gap-2 bg-secondary/20 p-2 rounded-md">
                  <code className="text-md">{selectedSession.roomId}</code>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Share Link</p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-2 text-xs"
                    onClick={() => handleCopy(getSessionShareLink(selectedSession.id), 'Share link')}
                  >
                    <Copy size={14} className="mr-1" />
                    Copy
                  </Button>
                </div>
                <div className="flex items-center gap-2 bg-secondary/20 p-2 rounded-md overflow-x-auto">
                  <Link size={14} />
                  <code className="text-xs">{getSessionShareLink(selectedSession.id)}</code>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Index;
