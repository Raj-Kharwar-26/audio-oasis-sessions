import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSession } from '@/context/SessionContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { Link, useLocation } from 'react-router-dom';
import { Music, Search, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
interface LayoutProps {
  children: React.ReactNode;
}
const Layout: React.FC<LayoutProps> = ({
  children
}) => {
  const {
    user,
    isAuthenticated,
    logout
  } = useAuth();
  const {
    currentSession,
    leaveSession
  } = useSession();
  const location = useLocation();
  const handleLogout = () => {
    if (currentSession) {
      leaveSession();
    }
    logout();
  };
  return <div className="min-h-screen flex flex-col bg-gradient-to-br from-black via-gray-900 to-night-900">
      {/* Header with logo and user info */}
      <header className="glass-morphism p-4 sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-gradient text-xl md:text-2xl font-bold tracking-tight">
              Audio Oasis Sessions
            </span>
          </div>
          
          {isAuthenticated && <div className="flex items-center gap-3">
              {currentSession && <span className="text-sm text-oasis-300 hidden md:inline-block">
                  Session: {currentSession.name}
                </span>}
              <Avatar className="h-8 w-8 border border-primary/20">
                <AvatarFallback className="bg-primary/10 text-white">
                  {getInitials(user?.name || 'User')}
                </AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </div>}
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-1 container mx-auto p-4 md:p-6">
        {isAuthenticated && <div className="mb-6 flex justify-center">
            <div className="flex gap-4 p-1 bg-secondary/20 rounded-lg my-[20px] mx-0">
              <Link to="/">
                <Button variant={location.pathname === '/' ? "default" : "ghost"} className={cn("gap-2", location.pathname === '/' ? "bg-primary" : "")}>
                  <Users size={16} />
                  Sessions
                </Button>
              </Link>
              <Link to="/explore">
                <Button variant={location.pathname === '/explore' ? "default" : "ghost"} className={cn("gap-2", location.pathname === '/explore' ? "bg-primary" : "")}>
                  <Search size={16} />
                  Explore Music
                </Button>
              </Link>
            </div>
          </div>}
        
        {children}
      </main>
      
      {/* Footer */}
      <footer className="py-4 text-center text-sm text-muted-foreground">
        <p>© 2025 Audio Oasis Sessions - Share music together</p>
      </footer>
    </div>;
};
export default Layout;