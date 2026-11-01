'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { MessageCircle, X, Send, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createPulseClient } from '@/lib/novus-pulse-client';

/**
 * Support chat — answers come from the backend's SupportAiService
 * (Anthropic or Gemini, configured server-side via AI_PROVIDER/AI_API_KEY
 * so the key never reaches the browser). If no key is configured there,
 * the backend itself degrades to a scripted keyword matcher — same
 * contract either way, so this component doesn't need to know which mode
 * is active.
 */
const QUICK_TOPICS = ['How do I edit my site?', 'Upload photos', 'Billing & plans', 'Add staff'];

interface Msg {
  from: 'user' | 'bot';
  text: string;
}

export function SupportWidget() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { from: 'bot', text: "Hey! I'm your OMNI assistant. How can I help?" },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, typing, open]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((m) => [...m, { from: 'user', text: trimmed }]);
    setInput('');
    setTyping(true);
    try {
      const pulse = createPulseClient(session?.accessToken);
      const reply = await pulse.askSupportChat(trimmed);
      setMessages((m) => [...m, { from: 'bot', text: reply }]);
    } catch (err) {
      console.error('Support chat failed', err);
      setMessages((m) => [
        ...m,
        { from: 'bot', text: "Sorry, I couldn't reach support right now. Try again in a moment." },
      ]);
    } finally {
      setTyping(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'fixed bottom-4 right-4 z-[60] flex h-9 items-center justify-center gap-1.5 rounded-md border border-border-strong px-3 text-[13px] shadow-[0_6px_20px_-8px_rgba(0,0,0,0.7)] transition-colors',
          open ? 'bg-surface-3 text-foreground' : 'bg-surface-2 text-neutral-300 hover:bg-surface-3 hover:text-foreground'
        )}
        aria-label={open ? 'Close help' : 'Open help'}
        aria-expanded={open}
      >
        {open ? <X className="h-3.5 w-3.5" /> : <MessageCircle className="h-3.5 w-3.5" />}
        <span className="hidden sm:inline">{open ? 'Close' : 'Help'}</span>
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-16 right-4 z-[60] flex h-[460px] w-[360px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-lg border border-border-strong bg-surface shadow-[0_16px_40px_-12px_rgba(0,0,0,0.8)]">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-border bg-neutral-900/70 px-4 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/20 text-brand-fg">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">OMNI Assistant</p>
              <p className="text-[10px] text-neutral-500 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block" />
                Online
              </p>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((m, i) => (
              <div key={i} className={cn('flex', m.from === 'user' ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                    m.from === 'user'
                      ? 'bg-brand text-brand-foreground rounded-br-md'
                      : 'bg-neutral-800/80 text-neutral-200 rounded-bl-md'
                  )}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md bg-neutral-800/80 px-4 py-3 flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-neutral-500 animate-bounce"
                      style={{ animationDelay: `${i * 120}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Quick topics — only while conversation is fresh */}
            {messages.length <= 1 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {QUICK_TOPICS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => send(t)}
                    className="rounded-full border border-border bg-neutral-900 px-3 py-1.5 text-xs text-neutral-300 hover:border-brand/40 hover:text-brand-fg transition-colors"
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-border p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything…"
              className="flex-1 rounded-lg border border-border bg-neutral-900 px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-brand"
            />
            <button
              type="submit"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand text-brand-foreground hover:bg-brand/90 transition-colors disabled:opacity-50"
              disabled={!input.trim()}
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
