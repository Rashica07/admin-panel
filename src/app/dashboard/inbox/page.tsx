'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MessageCircle, Search, Send, User, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const MOCK_CONVERSATIONS = [
  { id: '1', user: 'Sarah Jenkins', lastMessage: 'Is this item available in medium?', time: '2m ago', unread: true },
  { id: '2', user: 'Michael Chen', lastMessage: 'Thanks for the quick response!', time: '1h ago', unread: false },
  { id: '3', user: 'Emma Watson', lastMessage: 'When will my order ship?', time: '3h ago', unread: false },
  { id: '4', user: 'David Smith', lastMessage: 'Do you ship to Canada?', time: 'Yesterday', unread: false },
];

export default function InboxPage() {
  const [activeChat, setActiveChat] = useState(MOCK_CONVERSATIONS[0].id);
  const [message, setMessage] = useState('');

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="mb-4">
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <MessageCircle className="h-7 w-7 text-green-500" /> Unified Inbox
        </h1>
        <p className="text-sm text-neutral-400 mt-1">
          Chat with your site visitors in real-time. (WhatsApp integration pending).
        </p>
      </div>

      <Card className="flex-1 bg-surface border-border-strong overflow-hidden flex shadow-lg">
        {/* Left Sidebar: Conversations List */}
        <div className="w-[320px] border-r border-border-strong flex flex-col bg-surface">
          <div className="p-4 border-b border-border-strong">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <Input 
                placeholder="Search messages..." 
                className="pl-9 bg-surface-2 border-border-strong text-sm h-9"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {MOCK_CONVERSATIONS.map((chat) => (
              <button
                key={chat.id}
                onClick={() => setActiveChat(chat.id)}
                className={cn(
                  "w-full p-4 flex items-start gap-3 border-b border-border-strong/50 text-left transition-colors hover:bg-surface-2",
                  activeChat === chat.id ? "bg-brand/5 border-l-2 border-l-brand" : "border-l-2 border-l-transparent"
                )}
              >
                <div className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center shrink-0 overflow-hidden">
                  <User className="h-5 w-5 text-neutral-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className={cn("font-medium text-sm truncate", chat.unread ? "text-white" : "text-neutral-300")}>
                      {chat.user}
                    </span>
                    <span className="text-[10px] text-neutral-500 shrink-0">{chat.time}</span>
                  </div>
                  <p className={cn("text-xs truncate", chat.unread ? "text-brand font-medium" : "text-neutral-500")}>
                    {chat.lastMessage}
                  </p>
                </div>
                {chat.unread && (
                  <div className="w-2 h-2 rounded-full bg-brand mt-1.5 shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Right Area: Chat History */}
        <div className="flex-1 flex flex-col bg-[#0a0a0a] relative">
          {/* Chat Header */}
          <div className="h-16 border-b border-border-strong px-6 flex items-center justify-between bg-surface/50 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-brand/10 flex items-center justify-center">
                <User className="h-4 w-4 text-brand" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm">
                  {MOCK_CONVERSATIONS.find(c => c.id === activeChat)?.user}
                </h3>
                <span className="text-xs text-green-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Online
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="border-border-strong text-neutral-400">
                <CheckCircle2 className="h-4 w-4 mr-2" /> Mark as resolved
              </Button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            <div className="flex flex-col gap-4">
              <div className="flex justify-center">
                <span className="text-[10px] font-medium text-neutral-500 bg-surface-2 px-3 py-1 rounded-full uppercase tracking-wider">
                  Today
                </span>
              </div>
              
              <div className="flex items-end gap-2 max-w-[80%]">
                <div className="w-6 h-6 rounded-full bg-surface-2 flex items-center justify-center shrink-0">
                  <User className="h-3 w-3 text-neutral-500" />
                </div>
                <div className="bg-surface-2 text-neutral-200 p-3 rounded-2xl rounded-bl-sm text-sm border border-border-strong">
                  Hi! I was looking at the summer collection.
                </div>
              </div>
              
              <div className="flex items-end gap-2 max-w-[80%]">
                <div className="w-6 h-6 rounded-full bg-surface-2 flex items-center justify-center shrink-0">
                  <User className="h-3 w-3 text-neutral-500" />
                </div>
                <div className="bg-surface-2 text-neutral-200 p-3 rounded-2xl rounded-bl-sm text-sm border border-border-strong">
                  Is this item available in medium?
                </div>
                <span className="text-[10px] text-neutral-500 mb-1">2m ago</span>
              </div>
            </div>
          </div>

          {/* Chat Input */}
          <div className="p-4 bg-surface border-t border-border-strong">
            <div className="flex gap-2 items-end">
              <Input 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your reply..." 
                className="flex-1 bg-surface-2 border-border-strong text-sm h-11 rounded-full px-4 text-white"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && message.trim()) {
                    setMessage('');
                    toast.success('Message sent!');
                  }
                }}
              />
              <Button 
                className="h-11 w-11 rounded-full shrink-0 bg-brand hover:bg-brand/90"
                onClick={() => {
                  if (message.trim()) {
                    setMessage('');
                    toast.success('Message sent!');
                  }
                }}
              >
                <Send className="h-4 w-4 text-white" />
              </Button>
            </div>
            <div className="mt-2 text-center">
               <span className="text-[10px] text-neutral-500 flex justify-center items-center gap-1">
                 <Clock className="h-3 w-3" /> Usually replies instantly
               </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
