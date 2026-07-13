'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPulseClient } from '@/lib/novus-pulse-client';
import { PlanGate } from '@/components/plan-gate';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Mail, CheckCircle2, Circle, Clock, Trash2, ArrowLeft, MailOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface Submission {
  id: string;
  formName: string;
  data: Record<string, any>;
  read: boolean;
  createdAt: string;
}

export default function FormsInboxPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [activeSubId, setActiveSubId] = useState<string | null>(null);

  const { data: submissions, isLoading } = useQuery({
    queryKey: ['submissions'],
    queryFn: async () => {
      const pulse = createPulseClient(session?.accessToken);
      return pulse.getSubmissions();
    },
    enabled: !!session?.accessToken,
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const pulse = createPulseClient(session?.accessToken);
      return pulse.markSubmissionRead(id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['submissions'] }),
  });

  const deleteSub = useMutation({
    mutationFn: async (id: string) => {
      const pulse = createPulseClient(session?.accessToken);
      return pulse.deleteSubmission(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      setActiveSubId(null);
      toast.success('Submission deleted successfully');
    },
  });

  const activeSub = submissions?.find((s: Submission) => s.id === activeSubId) || submissions?.[0];

  // Auto-mark as read when viewed
  if (activeSub && !activeSub.read && !markRead.isPending) {
    markRead.mutate(activeSub.id);
  }

  const unreadCount = submissions?.filter((s: Submission) => !s.read).length || 0;

  return (
    <PlanGate feature="forms">
      <div className="flex flex-col h-[calc(100vh-6rem)]">
        
        {/* Header */}
        <div className="mb-8 shrink-0 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Mail className="h-7 w-7 text-brand" /> Forms Inbox
            </h1>
            <p className="text-sm text-neutral-400 mt-2">
              View and manage submissions from your storefront's contact and intake forms.
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm font-medium">
            <span className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full", unreadCount > 0 ? "bg-brand/10 text-brand border border-brand/20" : "bg-surface-2 text-neutral-400 border border-border")}>
              {unreadCount > 0 && <span className="h-2 w-2 rounded-full bg-brand animate-pulse" />}
              {unreadCount} Unread
            </span>
            <span className="text-neutral-500">
              {submissions?.length || 0} Total
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="flex-1 animate-pulse rounded-xl bg-surface-2 border border-border-strong" />
        ) : (
          <div className="flex-1 grid lg:grid-cols-12 gap-6 min-h-0">
            
            {/* Sidebar List */}
            <Card className="lg:col-span-4 flex flex-col h-full np-surface border-border overflow-hidden anim-fade-up stagger-1">
              <CardHeader className="border-b border-border-strong/50 py-4 px-5 bg-surface-2/30 shrink-0">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <MailOpen className="h-4 w-4 text-neutral-500" /> All Messages
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-y-auto flex-1 custom-scrollbar">
                {submissions?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full p-8 text-center text-neutral-500">
                    <Mail className="h-10 w-10 mb-3 opacity-20" />
                    <p className="text-sm max-w-[200px]">Your inbox is empty. When visitors submit forms, they will appear here.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border-strong/30">
                    {submissions?.map((sub: Submission) => {
                      const isActive = activeSubId === sub.id || (!activeSubId && activeSub?.id === sub.id);
                      return (
                        <button
                          key={sub.id}
                          onClick={() => setActiveSubId(sub.id)}
                          className={cn(
                            "group w-full text-left p-4 transition-all flex gap-3 relative",
                            isActive 
                              ? "bg-surface-2/80" 
                              : "hover:bg-surface-2/40"
                          )}
                        >
                          {/* Active border indicator */}
                          {isActive && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand rounded-r-full shadow-[0_0_8px_rgba(255,140,0,0.5)]" />
                          )}

                          <div className="mt-1 shrink-0">
                            {sub.read ? (
                              <CheckCircle2 className={cn("h-4 w-4 transition-colors", isActive ? "text-neutral-500" : "text-neutral-600")} />
                            ) : (
                              <div className="relative flex h-4 w-4 items-center justify-center">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-20"></span>
                                <Circle className="relative h-4 w-4 text-brand fill-brand" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <p className={cn("text-sm truncate pr-2 transition-colors", !sub.read ? "font-bold text-white" : "font-semibold text-neutral-300", isActive && "text-brand")}>
                                {sub.data.name || sub.data.email || 'Anonymous Submission'}
                              </p>
                              <span className={cn("text-[10px] shrink-0 whitespace-nowrap", !sub.read ? "text-brand font-medium" : "text-neutral-500")}>
                                {formatDistanceToNow(new Date(sub.createdAt), { addSuffix: true }).replace('about ', '')}
                              </span>
                            </div>
                            <p className={cn("text-[11px] font-mono mb-1 uppercase tracking-wider", isActive ? "text-brand/80" : "text-neutral-500")}>
                              {sub.formName}
                            </p>
                            <p className={cn("text-xs truncate", !sub.read ? "text-neutral-300 font-medium" : "text-neutral-500")}>
                              {sub.data.message || sub.data.subject || Object.values(sub.data)[0]}
                            </p>
                          </div>

                          {/* Quick Actions overlay on hover */}
                          {!isActive && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center bg-surface-2/90 backdrop-blur-sm rounded-full border border-border p-1 shadow-lg">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-full text-neutral-400 hover:text-red-400 hover:bg-red-500/10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteSub.mutate(sub.id);
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reading Pane */}
            <Card className="lg:col-span-8 flex flex-col h-full np-surface border-border overflow-hidden anim-fade-up stagger-2">
              {activeSub ? (
                <>
                  {/* Reading Header */}
                  <CardHeader className="border-b border-border-strong/50 bg-surface-2/30 px-8 py-6 shrink-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="bg-brand/10 text-brand text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border border-brand/20">
                            {activeSub.formName}
                          </span>
                          <span className="flex items-center gap-1.5 text-xs text-neutral-500 font-medium">
                            <Clock className="h-3.5 w-3.5" />
                            {new Date(activeSub.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                          </span>
                        </div>
                        <CardTitle className="text-2xl font-bold tracking-tight text-white mb-2">
                          {activeSub.data.subject || `New submission from ${activeSub.data.name || 'Anonymous'}`}
                        </CardTitle>
                        <CardDescription className="text-base flex items-center gap-2">
                          From: <strong className="text-neutral-200">{activeSub.data.name || 'Anonymous'}</strong> 
                          {activeSub.data.email && <span className="text-neutral-400 font-mono text-sm">&lt;{activeSub.data.email}&gt;</span>}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-full h-10 w-10 shrink-0 transition-colors"
                          onClick={() => deleteSub.mutate(activeSub.id)}
                          disabled={deleteSub.isPending}
                          title="Delete submission"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Reading Content */}
                  <CardContent className="p-0 overflow-y-auto flex-1 bg-surface relative custom-scrollbar">
                    <div className="p-8 space-y-8 max-w-3xl">
                      
                      {/* Message body prominent if exists */}
                      {activeSub.data.message && (
                        <div className="bg-surface-2/50 border border-border-strong rounded-2xl p-6 text-[15px] leading-relaxed text-neutral-200 whitespace-pre-wrap shadow-inner relative">
                          <div className="absolute top-0 left-0 w-1 h-full bg-neutral-700 rounded-l-2xl" />
                          {activeSub.data.message}
                        </div>
                      )}

                      {/* Other fields */}
                      <div>
                        <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-5 flex items-center gap-3">
                          Submission Details
                          <div className="h-px bg-border-strong flex-1" />
                        </h4>
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
                          {Object.entries(activeSub.data).map(([key, val]) => {
                            if (key === 'message') return null; // already shown above
                            return (
                              <div key={key} className="bg-surface-2/30 border border-border rounded-xl p-4 transition-colors hover:border-neutral-700">
                                <dt className="text-[10px] text-brand uppercase tracking-wider mb-2 font-bold">{key}</dt>
                                <dd className="text-sm font-medium text-neutral-200 break-words">
                                  {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                </dd>
                              </div>
                            );
                          })}
                        </dl>
                      </div>

                    </div>
                  </CardContent>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-neutral-500 bg-surface">
                  <div className="h-20 w-20 bg-surface-2 border border-border-strong rounded-3xl flex items-center justify-center mb-6 shadow-sm">
                    <Mail className="h-10 w-10 text-neutral-600" />
                  </div>
                  <p className="font-medium text-neutral-300">No submission selected</p>
                  <p className="text-sm text-neutral-500 mt-1 max-w-xs text-center">Select a message from the sidebar to read it here.</p>
                </div>
              )}
            </Card>

          </div>
        )}
      </div>
    </PlanGate>
  );
}
