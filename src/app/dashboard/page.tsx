'use client';

import { useEffect, useRef, useState } from 'react';
import { Sparkles, Send, Bot, User, Settings, Paperclip, X, CornerUpLeft, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRunAgent, useApproveAction, useRejectAction } from '@/hooks/useAgent';
import type { AgentAction } from '@/lib/agent-client';

const MAX_COMPOSER_HEIGHT = 200;
const HISTORY_TURNS_FOR_CONTEXT = 6;

type Attachment = {
  id: string;
  url: string;
  name: string;
};

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  attachments?: Attachment[];
  replyTo?: { id: string; snippet: string };
  actions?: AgentAction[];
  isError?: boolean;
};

/**
 * /agent/run is stateless (one `message` string, no server-side conversation),
 * so a clarifying question the agent asked in a prior turn would otherwise be
 * forgotten. Fold recent turns into the outgoing message as plain-text context.
 */
function buildContextualMessage(history: Message[], latest: string): string {
  const recent = history.slice(-HISTORY_TURNS_FOR_CONTEXT);
  if (recent.length === 0) return latest;
  const transcript = recent
    .map((m) => `${m.role === 'user' ? 'Owner' : 'Agent'}: ${m.content}`)
    .join('\n');
  return `Conversation so far:\n${transcript}\n\nOwner: ${latest}`;
}

export default function AdminPanelChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your Full-Auto Agent. I can help you build your site, create pages, and publish them. What would you like to do today?",
    }
  ]);
  const [input, setInput] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [actingActionId, setActingActionId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const runAgent = useRunAgent();
  const approveAction = useApproveAction();
  const rejectAction = useRejectAction();

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, MAX_COMPOSER_HEIGHT)}px`;
  }, [input]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const next = files.map(file => ({
      id: crypto.randomUUID(),
      url: URL.createObjectURL(file),
      name: file.name,
    }));
    setPendingAttachments(prev => [...prev, ...next]);
    e.target.value = '';
  };

  const removeAttachment = (id: string) => {
    setPendingAttachments(prev => {
      const target = prev.find(a => a.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter(a => a.id !== id);
    });
  };

  const sendMessage = (overrideText?: string) => {
    const text = overrideText ?? input;
    if (!text.trim() && pendingAttachments.length === 0) return;

    const history = messages;
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      attachments: pendingAttachments.length ? pendingAttachments : undefined,
      replyTo: replyingTo ? { id: replyingTo.id, snippet: replyingTo.content.slice(0, 80) } : undefined,
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setPendingAttachments([]);
    setReplyingTo(null);

    runAgent.mutate(
      { message: buildContextualMessage(history, text) },
      {
        onSuccess: (data) => {
          setMessages(prev => [
            ...prev,
            {
              id: data.run.id,
              role: 'assistant',
              content: data.run.error
                ? `Something went wrong: ${data.run.error}`
                : data.run.summary || 'Done.',
              actions: data.actions,
              isError: !!data.run.error,
            },
          ]);
        },
        onError: (err: Error) => {
          setMessages(prev => [
            ...prev,
            { id: crypto.randomUUID(), role: 'assistant', content: `Couldn't reach the agent: ${err.message}`, isError: true },
          ]);
        },
      },
    );
  };

  const patchAction = (updated: AgentAction) => {
    setMessages(prev =>
      prev.map(m =>
        m.actions ? { ...m, actions: m.actions.map(a => (a.id === updated.id ? updated : a)) } : m,
      ),
    );
  };

  const handleApprove = (id: string) => {
    setActingActionId(id);
    approveAction.mutate(id, {
      onSuccess: patchAction,
      onSettled: () => setActingActionId(null),
    });
  };

  const handleReject = (id: string) => {
    setActingActionId(id);
    rejectAction.mutate(id, {
      onSuccess: patchAction,
      onSettled: () => setActingActionId(null),
    });
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-surface/50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-brand/20 flex items-center justify-center border border-brand/30">
            <Sparkles className="h-5 w-5 text-brand" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Full-Auto Agent</h1>
            <p className="text-xs text-neutral-400">Powered by Novus Pulse</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-white">
          <Settings className="h-5 w-5" />
        </Button>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`group flex gap-4 max-w-3xl mx-auto ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`h-8 w-8 shrink-0 rounded-full flex items-center justify-center ${
              msg.role === 'assistant' ? 'bg-brand/20 border border-brand/30 text-brand' : 'bg-surface-2 border border-border text-neutral-400'
            }`}>
              {msg.role === 'assistant' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
            </div>
            <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[85%]`}>
              <div className={`flex items-center gap-1.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`px-4 py-3 rounded-2xl text-sm ${
                  msg.role === 'user'
                    ? 'bg-brand text-brand-foreground rounded-tr-sm'
                    : msg.isError
                      ? 'bg-red-500/10 border border-red-500/30 text-red-300 rounded-tl-sm'
                      : 'bg-surface-2 border border-border text-neutral-200 rounded-tl-sm'
                }`}>
                  {msg.replyTo && (
                    <div className={`mb-2 rounded-lg border-l-2 px-2 py-1 text-xs opacity-70 ${
                      msg.role === 'user' ? 'border-brand-foreground/50' : 'border-brand/50'
                    }`}>
                      {msg.replyTo.snippet}
                    </div>
                  )}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-2">
                      {msg.attachments.map(att => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={att.id}
                          src={att.url}
                          alt={att.name}
                          className="h-24 w-24 rounded-lg border border-border object-cover"
                        />
                      ))}
                    </div>
                  )}
                  {msg.content}
                </div>
                <button
                  type="button"
                  onClick={() => setReplyingTo(msg)}
                  className="shrink-0 rounded-full p-1.5 text-neutral-500 opacity-0 transition-opacity hover:text-brand group-hover:opacity-100"
                  aria-label="Reply to this message"
                >
                  <CornerUpLeft className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Approval cards for mutating actions this run queued */}
              {msg.actions && msg.actions.length > 0 && (
                <div className="mt-2 space-y-2 w-full">
                  {msg.actions.map(action => (
                    <div key={action.id} className="rounded-xl border border-border-strong bg-surface px-3 py-2.5 text-xs">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-neutral-300">{action.summary}</span>
                        {action.status === 'pending' ? (
                          <div className="flex shrink-0 gap-1.5">
                            <Button
                              type="button"
                              size="sm"
                              disabled={actingActionId === action.id}
                              onClick={() => handleApprove(action.id)}
                              className="h-6 px-2 text-[11px]"
                            >
                              {actingActionId === action.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Approve'}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={actingActionId === action.id}
                              onClick={() => handleReject(action.id)}
                              className="h-6 px-2 text-[11px]"
                            >
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                            action.status === 'applied'
                              ? 'bg-green-500/10 text-green-400'
                              : action.status === 'rejected'
                                ? 'bg-neutral-700 text-neutral-400'
                                : 'bg-red-500/10 text-red-400'
                          }`}>
                            {action.status === 'applied' && <Check className="mr-0.5 inline h-2.5 w-2.5" />}
                            {action.status}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {runAgent.isPending && (
          <div className="flex gap-4 max-w-3xl mx-auto">
            <div className="h-8 w-8 shrink-0 rounded-full flex items-center justify-center bg-brand/20 border border-brand/30 text-brand">
              <Bot className="h-4 w-4" />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-sm text-sm bg-surface-2 border border-border text-neutral-400 flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Working on it…
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="shrink-0 px-4 pb-6 pt-2">
        <div className="max-w-3xl mx-auto">
          {replyingTo && (
            <div className="mb-2 flex items-center justify-between rounded-xl border border-border-strong bg-surface-2 px-3 py-2 text-xs text-neutral-400">
              <div className="flex items-center gap-2 truncate">
                <CornerUpLeft className="h-3.5 w-3.5 shrink-0 text-brand" />
                <span className="truncate">Replying to: {replyingTo.content.slice(0, 80)}</span>
              </div>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="shrink-0 text-neutral-500 hover:text-white"
                aria-label="Cancel reply"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {pendingAttachments.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {pendingAttachments.map(att => (
                <div key={att.id} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={att.url} alt={att.name} className="h-16 w-16 rounded-lg border border-border object-cover" />
                  <button
                    type="button"
                    onClick={() => removeAttachment(att.id)}
                    className="absolute -right-1.5 -top-1.5 rounded-full bg-neutral-900 border border-border p-0.5 text-neutral-300 hover:text-white"
                    aria-label={`Remove ${att.name}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <form
            onSubmit={handleSend}
            className="relative flex items-end gap-1 rounded-3xl border border-border-strong bg-surface-2 p-2 pl-2 shadow-2xl focus-within:border-brand/50 transition-colors"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              className="h-9 w-9 shrink-0 rounded-full text-neutral-400 hover:text-white"
              aria-label="Attach a screenshot or photo"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message your Full-Auto Agent..."
              rows={1}
              className="w-full flex-1 resize-none bg-transparent py-2 text-sm text-white placeholder:text-neutral-500 focus:outline-none custom-scrollbar"
              style={{ maxHeight: MAX_COMPOSER_HEIGHT }}
            />
            <Button
              type="submit"
              size="icon"
              disabled={(!input.trim() && pendingAttachments.length === 0) || runAgent.isPending}
              className="h-9 w-9 shrink-0 rounded-full bg-brand text-brand-foreground hover:bg-brand/90 transition-transform active:scale-95 disabled:opacity-40"
            >
              {runAgent.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
          <div className="text-center mt-2 flex items-center justify-center gap-4 text-xs text-neutral-500">
            <button onClick={() => sendMessage('Create a new page called "About Us"')} className="hover:text-brand transition-colors">"Create a page"</button>
            <button onClick={() => sendMessage('List all my pages')} className="hover:text-brand transition-colors">"List my pages"</button>
            <button onClick={() => sendMessage('Publish my homepage')} className="hover:text-brand transition-colors">"Publish my homepage"</button>
          </div>
        </div>
      </div>
    </div>
  );
}
