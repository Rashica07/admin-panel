'use client';

import { useEffect, useRef, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

/**
 * Demo-mode "login": there is no backend, so clicking Login on the landing
 * page signs straight into a pre-seeded demo workspace.
 */
export function DemoEnter() {
  const router = useRouter();
  const started = useRef(false);
  const [failed, setFailed] = useState(false);

  const enter = async () => {
    setFailed(false);
    try {
      const res = await signIn('credentials', { email: 'demo', password: 'demo', redirect: false });
      if (res?.error) throw new Error(res.error);
      router.replace('/dashboard');
    } catch {
      setFailed(true);
    }
  };

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    enter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="rounded-xl border border-border bg-surface p-8 text-center">
      {failed ? (
        <>
          <p className="text-sm text-neutral-300">Couldn’t open the demo automatically.</p>
          <Button className="mt-4 w-full" onClick={enter}>Enter demo workspace</Button>
        </>
      ) : (
        <>
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          <p className="mt-4 text-sm text-neutral-300">Opening the demo workspace…</p>
        </>
      )}
    </div>
  );
}
