
import React, { createContext, useState, useContext, useEffect } from 'react';
import { User } from '@/types';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => void;
  signup: (name: string, email: string, password: string) => void;
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

  const login = (email: string, password: string) => {
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }
    
    // In a real app, we would make API call to validate credentials
    // For demo purposes, we'll simulate a successful login with any credentials
    
    // Check if a user with this email exists in localStorage for demo purposes
    const allUsers = JSON.parse(localStorage.getItem('audioOasisUsers') || '[]');
    const existingUser = allUsers.find((u: any) => u.email === email);
    
    if (existingUser) {
      // Simulate password check
      if (password === existingUser.password) {
        const authUser: User = {
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email,
          createdAt: existingUser.createdAt
        };
        
        setUser(authUser);
        localStorage.setItem('audioOasisUser', JSON.stringify(authUser));
        toast.success(`Welcome back, ${authUser.name}!`);
      } else {
        toast.error('Invalid password');
      }
    } else {
      toast.error('No account found with that email');
    }
  };
  
  const signup = (name: string, email: string, password: string) => {
    if (!name.trim() || !email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    
    // In a real app, we would make API call to create user
    // For demo purposes, we'll simulate a successful signup
    
    // Check if a user with this email already exists
    const allUsers = JSON.parse(localStorage.getItem('audioOasisUsers') || '[]');
    if (allUsers.some((u: any) => u.email === email)) {
      toast.error('An account with this email already exists');
      return;
    }
    
    const newUser: User & { password: string } = {
      id: `user_${Date.now()}`,
      name: name.trim(),
      email,
      password, // In real app, password would be hashed
      createdAt: Date.now()
    };
    
    // Save to "database" (localStorage)
    allUsers.push(newUser);
    localStorage.setItem('audioOasisUsers', JSON.stringify(allUsers));
    
    // Log in the new user
    const authUser: User = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      createdAt: newUser.createdAt
    };
    
    setUser(authUser);
    localStorage.setItem('audioOasisUser', JSON.stringify(authUser));
    toast.success(`Welcome to Audio Oasis, ${name}!`);
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
