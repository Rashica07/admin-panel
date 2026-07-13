'use client';

import { usePageRevisions, useRestorePageRevision } from '@/hooks/usePages';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { History, RotateCcw } from 'lucide-react';

/**
 * Version history panel — lists snapshots taken before each edit
 * (including AI-applied changes), with one-click restore. A restore
 * snapshots the current state first, so it can itself be undone.
 */
export function PageRevisionsPanel({ pageId, open }: { pageId: string; open: boolean }) {
  const { data: revisions, isLoading } = usePageRevisions(pageId, open);
  const { mutateAsync: restore, isPending } = useRestorePageRevision();

  if (!open) return null;

  const handleRestore = async (revisionId: string, when: string) => {
    if (!window.confirm(`Restore this page to its state from ${when}? Your current version is saved to history first.`)) {
      return;
    }
    try {
      await restore({ pageId, revisionId });
      toast.success('Page restored — the previous version was saved to history.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to restore revision');
    }
  };

  return (
    <Card className="border-brand/40">
      <CardContent className="p-6">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-brand">
          <History className="h-5 w-5" />
          Version History
        </h3>

        {isLoading && <p className="text-sm text-neutral-400">Loading history…</p>}

        {!isLoading && (!revisions || revisions.length === 0) && (
          <p className="text-sm text-neutral-400">
            No earlier versions yet — a snapshot is saved every time this page changes.
          </p>
        )}

        {!isLoading && revisions && revisions.length > 0 && (
          <ul className="divide-y divide-border">
            {revisions.map((rev) => {
              const when = new Date(rev.createdAt).toLocaleString();
              return (
                <li key={rev.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{rev.title}</p>
                    <p className="text-xs text-neutral-500">
                      {when} · /{rev.slug} · {rev.published ? 'Published' : 'Draft'}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleRestore(rev.id, when)}
                  >
                    <RotateCcw className="mr-2 h-3.5 w-3.5" />
                    Restore
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
