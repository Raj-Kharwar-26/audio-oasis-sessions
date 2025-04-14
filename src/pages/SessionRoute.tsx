
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';

const SessionRoute: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <Layout>
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <div className="glass-card p-8 rounded-lg max-w-md">
          <h2 className="text-2xl font-semibold mb-4">Feature Unavailable</h2>
          <p className="mb-6">The session feature is currently unavailable.</p>
          <Button
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <Home size={16} />
            Go to Home Page
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default SessionRoute;
