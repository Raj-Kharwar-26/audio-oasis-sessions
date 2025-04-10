import React, { createContext, useState, useContext, useEffect } from 'react';
import { User } from '@/types';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (name: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// For demo purposes, we're using localStorage for auth
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is stored in localStorage
    const storedUser = localStorage.getItem('audioOasisUser');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('audioOasisUser');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (name: string) => {
    if (!name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    
    const newUser: User = {
      id: `user_${Date.now()}`,
      name: name.trim(),
    };
    
    setUser(newUser);
    localStorage.setItem('audioOasisUser', JSON.stringify(newUser));
    toast.success(`Welcome, ${name}!`);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('audioOasisUser');
    toast.info('You have been logged out');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      isLoading,
      login, 
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
