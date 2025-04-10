
import React from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import AuthForm from '@/components/AuthForm';
import SongSearch from '@/components/SongSearch';

const Explore: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  
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
      <div className="space-y-8">
        <div className="flex flex-col items-center text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold text-gradient">
            Explore Music
          </h1>
          <p className="text-lg text-muted-foreground max-w-md">
            Discover and listen to music independently or add to your sessions
          </p>
        </div>
        
        <SongSearch />
      </div>
    </Layout>
  );
};

export default Explore;
