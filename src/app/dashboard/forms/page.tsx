'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPulseClient } from '@/lib/novus-pulse-client';
import { PlanGate } from '@/components/plan-gate';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Mail, CheckCircle2, Circle, Clock, Trash2 } from 'lucide-react';
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
      toast.success('Submission deleted');
    },
  });

  const activeSub = submissions?.find((s: Submission) => s.id === activeSubId) || submissions?.[0];

  // Auto-mark as read when viewed
  if (activeSub && !activeSub.read && !markRead.isPending) {
    markRead.mutate(activeSub.id);
  }

  return (
    <PlanGate feature="forms">
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Mail className="h-7 w-7 text-brand" /> Forms Inbox
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            View and manage submissions from your storefront's contact and intake forms.
          </p>
        </div>

        {isLoading ? (
          <div className="flex-1 animate-pulse rounded-xl bg-neutral-900" />
        ) : (
          <div className="flex-1 grid lg:grid-cols-12 gap-6 min-h-0">
            
            {/* Sidebar List */}
            <Card className="lg:col-span-4 flex flex-col h-full bg-neutral-900/50 border-neutral-800">
              <CardHeader className="border-b border-neutral-800/50 py-4 px-4 bg-neutral-900/80 rounded-t-xl shrink-0">
                <CardTitle className="text-base flex items-center justify-between">
                  Submissions
                  <span className="text-xs bg-brand/20 text-brand px-2 py-0.5 rounded-full font-mono">
                    {submissions?.filter((s: Submission) => !s.read).length || 0} unread
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-y-auto flex-1">
                {submissions?.length === 0 ? (
                  <div className="p-8 text-center text-sm text-neutral-500">
                    Your inbox is empty. <br/> When users submit forms on your site, they'll appear here.
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-800/50">
                    {submissions?.map((sub: Submission) => (
                      <button
                        key={sub.id}
                        onClick={() => setActiveSubId(sub.id)}
                        className={cn(
                          "w-full text-left p-4 hover:bg-neutral-800/50 transition-colors flex gap-3",
                          (activeSubId === sub.id || (!activeSubId && activeSub?.id === sub.id)) && "bg-neutral-800/50"
                        )}
                      >
                        <div className="mt-1 shrink-0">
                          {sub.read ? (
                            <CheckCircle2 className="h-4 w-4 text-neutral-600" />
                          ) : (
                            <Circle className="h-4 w-4 text-brand fill-brand/20" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <p className={cn("text-sm truncate pr-2", !sub.read ? "font-bold text-white" : "font-medium text-neutral-300")}>
                              {sub.data.name || sub.data.email || 'Anonymous Submission'}
                            </p>
                            <span className="text-[10px] text-neutral-500 shrink-0 whitespace-nowrap">
                              {formatDistanceToNow(new Date(sub.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-xs text-brand font-mono mb-1">{sub.formName}</p>
                          <p className="text-xs text-neutral-500 truncate">
                            {sub.data.message || sub.data.subject || Object.values(sub.data)[0]}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reading Pane */}
            <Card className="lg:col-span-8 flex flex-col h-full bg-neutral-900 border-neutral-800">
              {activeSub ? (
                <>
                  <CardHeader className="border-b border-neutral-800 bg-neutral-900/80 rounded-t-xl shrink-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl mb-1">
                          {activeSub.data.subject || `${activeSub.formName} Submission`}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-4">
                          <span>From: <strong className="text-neutral-300">{activeSub.data.name || 'Anonymous'}</strong> {activeSub.data.email && `<${activeSub.data.email}>`}</span>
                          <span className="flex items-center gap-1 text-neutral-500">
                            <Clock className="h-3 w-3" />
                            {new Date(activeSub.createdAt).toLocaleString()}
                          </span>
                        </CardDescription>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-neutral-500 hover:text-red-400 shrink-0"
                        onClick={() => deleteSub.mutate(activeSub.id)}
                        disabled={deleteSub.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 overflow-y-auto flex-1">
                    <div className="space-y-6">
                      
                      {/* Message body prominent if exists */}
                      {activeSub.data.message && (
                        <div className="bg-neutral-950/50 border border-neutral-800 rounded-xl p-5 text-sm leading-relaxed text-neutral-300 whitespace-pre-wrap">
                          {activeSub.data.message}
                        </div>
                      )}

                      {/* Other fields */}
                      <div>
                        <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-4 border-b border-neutral-800 pb-2">All Form Fields</h4>
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                          {Object.entries(activeSub.data).map(([key, val]) => {
                            if (key === 'message') return null; // already shown above
                            return (
                              <div key={key}>
                                <dt className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1 font-mono">{key}</dt>
                                <dd className="text-sm font-medium text-neutral-200 bg-neutral-800/30 px-3 py-2 rounded-md break-words">
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
                <div className="h-full flex flex-col items-center justify-center text-neutral-500">
                  <Mail className="h-12 w-12 mb-4 opacity-20" />
                  <p>Select a submission to view details</p>
                </div>
              )}
            </Card>

          </div>
        )}
      </div>
    </PlanGate>
  );
}
