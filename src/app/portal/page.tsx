'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { createPulseClient } from '@/lib/novus-pulse-client';
import type { ProposedContentChange, ContentChangeLogEntry } from '@kiq/novus-pulse';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import {
  Send,
  Sparkles,
  LogOut,
  Check,
  X,
  History,
  ChevronDown,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * CLIENT PORTAL — intentionally NOT a CMS.
 * One screen: tell the assistant what to change, see a before → after
 * preview, confirm. Nothing is ever written without the Confirm tap.
 * Mobile-first: owners use this from their phone.
 */

type ChatItem =
  | { kind: 'user'; text: string }
  | { kind: 'bot'; text: string }
  | {
      kind: 'diff';
      changes: ProposedContentChange[];
      message: string;
      state: 'pending' | 'applied' | 'cancelled';
    };

const QUICK_PROMPTS = [
  'Change the coffee price to €3.50',
  'Update our opening hours',
  'Fix a typo on the homepage',
];

export default function PortalPage() {
  const { data: session } = useSession();
  const [items, setItems] = useState<ChatItem[]>([
    {
      kind: 'bot',
      text: "Hi! I'm your website assistant. Tell me what you'd like to change — in your own words — and I'll show you a preview before anything goes live.",
    },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<ContentChangeLogEntry[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const pulse = useCallback(
    () => createPulseClient(session?.accessToken),
    [session?.accessToken],
  );

  const loadHistory = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      setHistory(await pulse().getContentChangeHistory());
    } catch {
      /* history is non-critical */
    }
  }, [session?.accessToken, pulse]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [items, busy]);

  // ── Ask: plain language → diff preview ──
  const ask = async (text: string) => {
    const message = text.trim();
    if (!message || busy) return;
    setItems((prev) => [...prev, { kind: 'user', text: message }]);
    setInput('');
    setBusy(true);
    try {
      const result = await pulse().proposeContentChange(message);
      if (result.status === 'diff' && result.changes.length > 0) {
        setItems((prev) => [
          ...prev,
          { kind: 'bot', text: result.summary ?? "Here's what I'll change:" },
          { kind: 'diff', changes: result.changes, message, state: 'pending' },
        ]);
      } else {
        setItems((prev) => [
          ...prev,
          {
            kind: 'bot',
            text:
              result.clarifyingQuestion ??
              result.summary ??
              "I couldn't find that on your site. Could you rephrase?",
          },
        ]);
      }
    } catch (err) {
      setItems((prev) => [
        ...prev,
        {
          kind: 'bot',
          text: `Sorry, something went wrong: ${err instanceof Error ? err.message : 'unknown error'}. Please try again.`,
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  // ── Confirm: explicit human approval → apply ──
  const confirm = async (index: number) => {
    const item = items[index];
    if (item.kind !== 'diff' || item.state !== 'pending' || busy) return;
    setBusy(true);
    try {
      const result = await pulse().applyContentChanges(item.changes, item.message, 'portal');
      setItems((prev) =>
        prev.map((it, i) => (i === index && it.kind === 'diff' ? { ...it, state: 'applied' } : it)),
      );
      setItems((prev) => [
        ...prev,
        {
          kind: 'bot',
          text: `✅ Done — ${result.applied} change${result.applied === 1 ? '' : 's'} ${result.revalidated ? 'live on your site now.' : 'published. Your site updates within seconds.'}`,
        },
      ]);
      toast.success('Change published');
      loadHistory();
    } catch (err) {
      setItems((prev) => [
        ...prev,
        {
          kind: 'bot',
          text:
            err instanceof Error && err.message.includes('changed since')
              ? `⚠️ ${err.message}`
              : 'Something went wrong applying that change. Nothing was modified — please try again.',
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const cancel = (index: number) => {
    setItems((prev) =>
      prev.map((it, i) => (i === index && it.kind === 'diff' ? { ...it, state: 'cancelled' } : it)),
    );
    setItems((prev) => [...prev, { kind: 'bot', text: 'No problem — nothing was changed.' }]);
  };

  return (
    <div className="flex h-dvh flex-col bg-neutral-950 text-white">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-neutral-800 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/20 text-brand">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">Novus Assistant</p>
            <p className="text-[10px] text-neutral-500 leading-tight">
              {session?.user?.name ?? 'Your website'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="p-2 text-neutral-500 hover:text-white transition-colors"
          aria-label="Log out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </header>

      {/* Chat */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {items.map((item, i) => {
          if (item.kind === 'user') {
            return (
              <div key={i} className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-br-md bg-brand px-4 py-2.5 text-sm text-black">
                  {item.text}
                </div>
              </div>
            );
          }
          if (item.kind === 'bot') {
            return (
              <div key={i} className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-neutral-800/80 px-4 py-2.5 text-sm text-neutral-200">
                  {item.text}
                </div>
              </div>
            );
          }
          // Diff card
          return (
            <div
              key={i}
              className={cn(
                'rounded-2xl border p-4 space-y-3 transition-opacity',
                item.state === 'pending' ? 'border-brand/40 bg-brand/5' : 'border-neutral-800 bg-neutral-900/50 opacity-70',
              )}
            >
              <p className="text-[10px] font-semibold uppercase tracking-widest text-brand">
                Preview — not live yet
              </p>
              {item.changes.map((c, j) => (
                <div key={j} className="space-y-1.5">
                  <p className="text-xs text-neutral-400">
                    {c.label} <span className="text-neutral-600">· {c.pageTitle}</span>
                  </p>
                  <div className="flex flex-col gap-1.5 text-sm">
                    <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-red-300 line-through decoration-red-400/50">
                      {String(c.oldValue)}
                    </div>
                    <div className="flex items-center gap-1.5 text-neutral-600 pl-1">
                      <ArrowRight className="h-3 w-3" />
                    </div>
                    <div className="rounded-lg bg-green-500/10 border border-green-500/20 px-3 py-2 text-green-300">
                      {String(c.newValue)}
                    </div>
                  </div>
                </div>
              ))}
              {item.state === 'pending' ? (
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => confirm(i)}
                    disabled={busy}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand py-2.5 text-sm font-semibold text-black hover:bg-brand/90 transition-colors disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" /> Confirm & publish
                  </button>
                  <button
                    type="button"
                    onClick={() => cancel(i)}
                    disabled={busy}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-neutral-700 px-4 py-2.5 text-sm font-medium text-neutral-300 hover:bg-neutral-800 transition-colors disabled:opacity-50"
                  >
                    <X className="h-4 w-4" /> Cancel
                  </button>
                </div>
              ) : (
                <p className="text-xs font-medium text-neutral-500">
                  {item.state === 'applied' ? '✓ Published' : 'Cancelled'}
                </p>
              )}
            </div>
          );
        })}

        {busy && (
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

        {/* Quick prompts on fresh conversations */}
        {items.length <= 1 && !busy && (
          <div className="flex flex-wrap gap-2 pt-1">
            {QUICK_PROMPTS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => ask(q)}
                className="rounded-full border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-300 hover:border-brand/40 hover:text-brand transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Recent changes */}
      <div className="shrink-0 border-t border-neutral-800">
        <button
          type="button"
          onClick={() => setHistoryOpen(!historyOpen)}
          className="flex w-full items-center justify-between px-4 py-2.5 text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <History className="h-3.5 w-3.5" /> Recent changes ({history.length})
          </span>
          <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', historyOpen && 'rotate-180')} />
        </button>
        {historyOpen && (
          <div className="max-h-40 overflow-y-auto px-4 pb-2 space-y-1.5">
            {history.length === 0 && (
              <p className="text-xs text-neutral-600 pb-2">No changes yet.</p>
            )}
            {history.map((entry) => (
              <div key={entry.id} className="rounded-lg bg-neutral-900/70 px-3 py-2 text-xs">
                <p className="text-neutral-300">
                  {entry.label}: <span className="text-red-400/80 line-through">{String(entry.oldValue)}</span>{' '}
                  → <span className="text-green-400/90">{String(entry.newValue)}</span>
                </p>
                <p className="text-[10px] text-neutral-600 mt-0.5">
                  {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })} · via {entry.source}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="flex shrink-0 items-center gap-2 border-t border-neutral-800 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="What would you like to change on your website?"
          disabled={busy}
          className="flex-1 rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-brand disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!input.trim() || busy}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand text-black hover:bg-brand/90 transition-colors disabled:opacity-40"
          aria-label="Send"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </form>
    </div>
  );
}
