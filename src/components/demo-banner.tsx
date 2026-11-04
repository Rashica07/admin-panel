'use client';

import { FlaskConical } from 'lucide-react';
import { resetDemoData } from '@/demo/mock-api';

/** Gold attention strip: makes it obvious this is a sandbox, with a reset. */
export function DemoBanner() {
  return (
    <div data-demo-banner className="flex shrink-0 items-center gap-2.5 border-b border-amber-500/20 bg-[#272114] px-4 py-1.5 text-xs text-neutral-200 lg:px-6">
      <FlaskConical className="h-3.5 w-3.5 shrink-0 text-amber-400" aria-hidden />
      <p className="min-w-0 flex-1 truncate">
        <span className="font-medium text-amber-300">Demo workspace.</span>{' '}
        <span className="text-neutral-300">Sample data stored only in this browser — no backend is connected.</span>
      </p>
      <button
        type="button"
        className="shrink-0 rounded-sm bg-amber-400/15 px-2 py-0.5 font-medium text-amber-300 transition-colors hover:bg-amber-400/25"
        onClick={() => {
          resetDemoData();
          window.location.assign('/dashboard');
        }}
      >
        Reset data
      </button>
    </div>
  );
}
