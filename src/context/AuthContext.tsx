
import React, { createContext, useState, useContext, useEffect } from 'react';
import { User } from '@/types';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log('Auth state changed:', event);
        setSession(newSession);
        
        if (newSession?.user) {
          setSupabaseUser(newSession.user);
          setUser({
            id: newSession.user.id,
            name: newSession.user.user_metadata?.name || newSession.user.email?.split('@')[0] || 'User',
            email: newSession.user.email,
            createdAt: new Date(newSession.user.created_at).getTime()
          });
        } else {
          setSupabaseUser(null);
          setUser(null);
        }
      }
    );

    // THEN check for existing session
    const initAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        
        if (currentSession?.user) {
          setSupabaseUser(currentSession.user);
          setUser({
            id: currentSession.user.id,
            name: currentSession.user.user_metadata?.name || currentSession.user.email?.split('@')[0] || 'User',
            email: currentSession.user.email,
            createdAt: new Date(currentSession.user.created_at).getTime()
          });
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        throw error;
      }
      
      toast.success(`Welcome back!`);
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.message || 'Failed to login');
    }
  };
  
  const signup = async (name: string, email: string, password: string) => {
    if (!name.trim() || !email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name.trim()
          }
        }
      });
      
      if (error) {
        throw error;
      }
      
      toast.success(`Welcome to Audio Oasis, ${name}!`);
    } catch (error) {
      console.error('Signup error:', error);
      toast.error(error.message || 'Failed to sign up');
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      toast.info('You have been logged out');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      supabaseUser,
      session,
      isAuthenticated: !!user, 
      isLoading,
      login, 
      signup,
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
