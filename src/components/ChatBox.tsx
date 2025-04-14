import React, { useState, useRef, useEffect } from 'react';
import { useSession } from '@/context/SessionContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Music, ArrowUp, ArrowDown } from 'lucide-react';
import { Message, SongSuggestion } from '@/types';
import { getInitials, stringToGradient } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

const ChatMessage: React.FC<{ message: Message; currentUserId: string }> = ({ message, currentUserId }) => {
  const isCurrentUser = message.userId === currentUserId;
  const isSystem = message.userId === 'system';
  const isMobile = useIsMobile();
  
  const date = new Date(message.timestamp);
  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  if (isSystem) {
    return (
      <div className="py-1 px-2 my-1 text-xs text-center text-muted-foreground">
        {message.text}
      </div>
    );
  }
  
  return (
    <div className={`flex items-start gap-2 mb-2 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
      <Avatar className={`${isMobile ? "h-6 w-6" : "h-8 w-8"} shrink-0`}>
        <AvatarFallback className={`bg-gradient-to-br ${stringToGradient(message.userId)}`}>
          {getInitials(message.userName)}
        </AvatarFallback>
      </Avatar>
      
      <div className={`max-w-[75%] ${isCurrentUser ? 'items-end' : 'items-start'}`}>
        <div className={`px-3 py-2 rounded-lg ${
          isCurrentUser 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-secondary text-secondary-foreground'
        }`}>
          {!isCurrentUser && (
            <p className="text-xs font-medium mb-1">{message.userName}</p>
          )}
          <p className="text-sm break-words">{message.text}</p>
        </div>
        <span className="text-[10px] text-muted-foreground mx-1">{time}</span>
      </div>
    </div>
  );
};

const ChatBox: React.FC = () => {
  const { messages, sendMessage, currentSession, addSong } = useSession();
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollArea = scrollAreaRef.current;
      scrollArea.scrollTop = scrollArea.scrollHeight;
    }
  }, [messages]);
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !user) return;
    
    if (newMessage.startsWith('/')) {
      handleChatCommand(newMessage);
    } else {
      sendMessage(newMessage);
    }
    
    setNewMessage('');
  };
  
  const handleChatCommand = (commandText: string) => {
    const commandParts = commandText.trim().substring(1).split(' ');
    const command = commandParts[0].toLowerCase();
    
    switch (command) {
      case 'help':
        sendMessage('/help - Show available commands');
        sendMessage('/song <title> - Search for a song to add to playlist');
        sendMessage('/up - Show more chat history');
        sendMessage('/down - Show less chat history');
        break;
      case 'song':
        const songQuery = commandParts.slice(1).join(' ');
        if (songQuery) {
          const mockSong: SongSuggestion = {
            title: songQuery,
            artist: 'Artist from chat search',
            duration: 180,
            url: '',
            youtubeId: '',
          };
          addSong(mockSong);
          sendMessage(`Added "${songQuery}" to the playlist`);
        }
        break;
      case 'up':
        setIsExpanded(true);
        break;
      case 'down':
        setIsExpanded(false);
        break;
      default:
        sendMessage(`Unknown command: ${command}. Type /help for available commands.`);
    }
  };
  
  if (!user || !currentSession) return null;
  
  return (
    <div className={`glass-card rounded-lg overflow-hidden flex flex-col ${isExpanded ? 'h-[450px]' : 'h-[350px]'}`}>
      <div className="p-3 border-b border-border/50 flex justify-between items-center">
        <h3 className="font-medium">Chat</h3>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon"
            className="h-6 w-6"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Show less" : "Show more"}
          >
            {isExpanded ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
          </Button>
        </div>
      </div>
      
      <ScrollArea className="flex-1 p-3" ref={scrollAreaRef}>
        <div className="space-y-1 pb-2">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-center p-4">
              <p className="text-muted-foreground">
                Welcome to "{currentSession.name}" session! Start the conversation!
              </p>
            </div>
          ) : (
            messages.map(message => (
              <ChatMessage 
                key={message.id} 
                message={message} 
                currentUserId={user.id} 
              />
            ))
          )}
        </div>
      </ScrollArea>
      
      <form onSubmit={handleSendMessage} className="p-3 border-t border-border/50 flex gap-2">
        <Input
          placeholder="Type a message or /command..."
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          className="bg-secondary/50"
        />
        <Button 
          type="submit" 
          size={isMobile ? "sm" : "icon"} 
          disabled={!newMessage.trim()}
          className={isMobile ? "px-3" : ""}
        >
          <Send size={16} />
        </Button>
      </form>
    </div>
  );
};

export default ChatBox;
