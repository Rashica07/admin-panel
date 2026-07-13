import { useEffect, useState } from 'react';

/**
 * Polls the Novus Pulse API and reports reachability.
 * `null` = still checking, `true` = online, `false` = offline.
 */
export function useApiStatus(intervalMs = 30000) {
  const [connected, setConnected] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    const check = async () => {
      try {
        // Any HTTP response (even 404) means the API is up
        await fetch(`${base}/api/v1`, { cache: 'no-store' });
        if (active) setConnected(true);
      } catch {
        if (active) setConnected(false);
      }
    };

    check();
    const id = setInterval(check, intervalMs);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [intervalMs]);

  return connected;
}
