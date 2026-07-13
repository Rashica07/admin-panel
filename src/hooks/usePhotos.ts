import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { createPulseClient } from '@/lib/novus-pulse-client';
import { useUIStore } from '@/store/useStore';

export function usePhotos() {
  const { data: session } = useSession();
  const { activeTenantId } = useUIStore();
  
  return useQuery({
    queryKey: ['photos', activeTenantId],
    queryFn: async () => {
      const pulse = createPulseClient(session?.accessToken);
      return pulse.getPhotos();
    },
    enabled: !!session?.accessToken,
  });
}

export function useUploadPhoto() {
  const { data: session } = useSession();
  const { activeTenantId } = useUIStore();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { url: string; filename: string; size: number }) => {
      const pulse = createPulseClient(session?.accessToken);
      return pulse.createPhoto(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos', activeTenantId] });
    },
  });
}

export function useDeletePhoto() {
  const { data: session } = useSession();
  const { activeTenantId } = useUIStore();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const pulse = createPulseClient(session?.accessToken);
      return pulse.deletePhoto(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos', activeTenantId] });
    },
  });
}
