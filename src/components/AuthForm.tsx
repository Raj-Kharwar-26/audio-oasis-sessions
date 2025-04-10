
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { Music } from 'lucide-react';

const AuthForm: React.FC = () => {
  const [name, setName] = useState('');
  const { login } = useAuth();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(name);
  };
  
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center">
      <div className="glass-card w-full max-w-md p-8 space-y-8">
        <div className="flex flex-col items-center space-y-2 mb-8">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Music className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-center text-gradient">Audio Oasis Sessions</h1>
          <p className="text-center text-muted-foreground">
            Listen to music with friends in perfect sync
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium leading-none">
              Your Name
            </label>
            <Input 
              id="name"
              placeholder="Enter your name" 
              value={name}
              onChange={e => setName(e.target.value)}
              className="bg-secondary/50"
              required
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={!name.trim()}>
            Start Listening
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AuthForm;
