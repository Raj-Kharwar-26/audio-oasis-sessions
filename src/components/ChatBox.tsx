
import React, { useState, useRef, useEffect } from 'react';
import { useSession } from '@/context/SessionContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send } from 'lucide-react';
import { Message } from '@/types';
import { getInitials, stringToGradient } from '@/lib/utils';

const ChatMessage: React.FC<{ message: Message; currentUserId: string }> = ({ message, currentUserId }) => {
  const isCurrentUser = message.userId === currentUserId;
  const isSystem = message.userId === 'system';
  
  // Format timestamp
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
      <Avatar className="h-8 w-8 shrink-0">
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
  const { messages, sendMessage, currentSession } = useSession();
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollArea = scrollAreaRef.current;
      scrollArea.scrollTop = scrollArea.scrollHeight;
    }
  }, [messages]);
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !user) return;
    
    sendMessage(newMessage);
    setNewMessage('');
  };
  
  if (!user || !currentSession) return null;
  
  return (
    <div className="glass-card rounded-lg overflow-hidden flex flex-col h-[350px]">
      <div className="p-3 border-b border-border/50">
        <h3 className="font-medium">Chat</h3>
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
          placeholder="Type a message..."
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          className="bg-secondary/50"
        />
        <Button type="submit" size="icon" disabled={!newMessage.trim()}>
          <Send size={16} />
        </Button>
      </form>
    </div>
  );
};

export default ChatBox;
