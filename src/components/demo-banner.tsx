'use client';

import { resetDemoData } from '@/demo/mock-api';

/** Thin strip that makes it obvious this is a sandbox, with a reset button. */
export function DemoBanner() {
  return (
    <div className="flex shrink-0 items-center justify-center gap-3 border-b border-brand/30 bg-brand/10 px-4 py-1.5 text-xs text-brand">
      <span>
        <strong className="font-semibold">Live demo</strong> — sample data, saved only in your browser. Nothing here touches a real backend.
      </span>
      <button
        type="button"
        className="rounded border border-brand/40 px-2 py-0.5 font-medium hover:bg-brand/20"
        onClick={() => {
          resetDemoData();
          window.location.assign('/dashboard');
        }}
      >
        Reset demo data
      </button>
    </div>
  );
}
