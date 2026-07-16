'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link2, ExternalLink, Globe, Smartphone, RefreshCcw, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const MOCK_APPS = [
  {
    id: '1',
    name: 'Main Storefront',
    url: 'https://mystore.com',
    type: 'web',
    status: 'online',
    lastPing: '2 mins ago',
    frameworkVersion: '@kiq/novus-pulse v0.1.0',
    owner: 'Sarah Jenkins',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
  },
  {
    id: '2',
    name: 'Mobile Companion App',
    url: 'exp://localhost:19000',
    type: 'mobile',
    status: 'offline',
    lastPing: '3 days ago',
    frameworkVersion: '@kiq/novus-pulse v0.1.0',
    owner: 'Dev Team',
    image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&q=80',
  }
];

export default function ConnectedAppsPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Successfully synced with deployments');
    }, 1000);
  };

  return (
    <div className="space-y-8 max-w-[1200px] mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Link2 className="h-7 w-7 text-brand" /> Connected Apps
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Websites and apps currently connected to your Novus Pulse API.
          </p>
        </div>
        <Button 
          variant="outline" 
          className="border-border-strong text-white hover:bg-surface-2"
          onClick={handleRefresh}
          disabled={loading}
        >
          {loading ? <RefreshCcw className="h-4 w-4 animate-spin mr-2" /> : <RefreshCcw className="h-4 w-4 mr-2" />}
          Refresh Status
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {MOCK_APPS.map((app) => (
          <Card key={app.id} className="bg-surface border-border-strong overflow-hidden flex flex-col shadow-lg">
            {/* App Preview Image */}
            <div className="h-40 w-full relative border-b border-border-strong group">
              <img 
                src={app.image} 
                alt={app.name} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent" />
              
              {/* Status Badge */}
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10">
                <div className={cn("w-2 h-2 rounded-full", app.status === 'online' ? "bg-green-500 animate-pulse" : "bg-neutral-500")} />
                <span className="text-xs font-medium text-white capitalize">{app.status}</span>
              </div>

              {/* Type Icon */}
              <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md p-1.5 rounded-md border border-white/10">
                {app.type === 'web' ? <Globe className="h-4 w-4 text-white" /> : <Smartphone className="h-4 w-4 text-white" />}
              </div>
            </div>

            {/* App Details */}
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-white text-lg">{app.name}</h3>
                  <a href={app.url} target="_blank" rel="noopener noreferrer" className="text-brand text-sm hover:underline flex items-center gap-1 mt-0.5">
                    {app.url} <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-white -mr-2 -mt-2">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </div>

              <div className="space-y-3 mt-auto pt-4 border-t border-border-strong/50">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Framework</span>
                  <span className="text-neutral-300 font-mono text-xs bg-surface-2 px-1.5 py-0.5 rounded">{app.frameworkVersion}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Owner</span>
                  <span className="text-neutral-300">{app.owner}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Last Ping</span>
                  <span className="text-neutral-300">{app.lastPing}</span>
                </div>
              </div>
            </div>
          </Card>
        ))}

        {/* Add New App Card */}
        <Card className="bg-surface/50 border-border-strong border-dashed overflow-hidden flex flex-col items-center justify-center p-8 text-center shadow-none min-h-[360px] group cursor-pointer hover:bg-surface transition-colors">
          <div className="w-16 h-16 rounded-full bg-brand/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Link2 className="h-8 w-8 text-brand" />
          </div>
          <h3 className="font-bold text-white text-lg">Connect New App</h3>
          <p className="text-sm text-neutral-400 mt-2 max-w-xs">
            Install the <code className="text-brand bg-brand/10 px-1 py-0.5 rounded">@kiq/novus-pulse</code> framework via NPM in your Next.js or React app to see it appear here automatically.
          </p>
        </Card>
      </div>
    </div>
  );
}
