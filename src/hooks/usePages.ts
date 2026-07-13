import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { createPulseClient } from '@/lib/novus-pulse-client';
import { useUIStore } from '@/store/useStore';

export function usePages() {
  const { data: session } = useSession();
  const { activeTenantId } = useUIStore();
  
  return useQuery({
    queryKey: ['pages', activeTenantId],
    queryFn: async () => {
      const pulse = createPulseClient(session?.accessToken);
      return pulse.getPages();
    },
    enabled: !!session?.accessToken,
  });
}

export function usePage(id: string) {
  const { data: session } = useSession();
  const { activeTenantId } = useUIStore();
  
  return useQuery({
    queryKey: ['pages', activeTenantId, id],
    queryFn: async () => {
      const pulse = createPulseClient(session?.accessToken);
      return pulse.getPage(id);
    },
    enabled: !!session?.accessToken && !!id,
  });
}

export function useCreatePage() {
  const { data: session } = useSession();
  const { activeTenantId } = useUIStore();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { title: string; slug: string; type?: string; content?: any; published?: boolean }) => {
      const pulse = createPulseClient(session?.accessToken);
      return pulse.createPage(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages', activeTenantId] });
    },
  });
}

export function useUpdatePage() {
  const { data: session } = useSession();
  const { activeTenantId } = useUIStore();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const pulse = createPulseClient(session?.accessToken);
      return pulse.updatePage(id, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pages', activeTenantId] });
      queryClient.invalidateQueries({ queryKey: ['pages', activeTenantId, variables.id] });
    },
  });
}

/**
 * Version history for a page — fetched only while the panel is open
 * (pass `enabled`), so closed editors don't pay for it.
 */
export function usePageRevisions(pageId: string, enabled = true) {
  const { data: session } = useSession();
  const { activeTenantId } = useUIStore();

  return useQuery({
    queryKey: ['pages', activeTenantId, pageId, 'revisions'],
    queryFn: async () => {
      const pulse = createPulseClient(session?.accessToken);
      return pulse.getPageRevisions(pageId);
    },
    enabled: !!session?.accessToken && !!pageId && enabled,
  });
}

export function useRestorePageRevision() {
  const { data: session } = useSession();
  const { activeTenantId } = useUIStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ pageId, revisionId }: { pageId: string; revisionId: string }) => {
      const pulse = createPulseClient(session?.accessToken);
      return pulse.restorePageRevision(pageId, revisionId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pages', activeTenantId] });
      queryClient.invalidateQueries({ queryKey: ['pages', activeTenantId, variables.pageId] });
      queryClient.invalidateQueries({
        queryKey: ['pages', activeTenantId, variables.pageId, 'revisions'],
      });
    },
  });
}

export function useDeletePage() {
  const { data: session } = useSession();
  const { activeTenantId } = useUIStore();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const pulse = createPulseClient(session?.accessToken);
      return pulse.deletePage(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages', activeTenantId] });
    },
  });
}
