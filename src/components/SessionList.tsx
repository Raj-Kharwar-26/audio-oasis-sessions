
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Music } from 'lucide-react';

const SessionList: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center text-center space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold text-gradient">
          Music Explorer
        </h1>
        <p className="text-lg text-muted-foreground max-w-md">
          Discover and listen to your favorite music
        </p>
      </div>
      
      <Card>
        <CardContent className="p-6 text-center">
          <div className="flex flex-col items-center justify-center py-8">
            <Music size={64} className="text-primary mb-4" />
            <h2 className="text-xl font-semibold mb-2">Explore Music</h2>
            <p className="text-muted-foreground">
              Search for your favorite songs and artists to start listening
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SessionList;
