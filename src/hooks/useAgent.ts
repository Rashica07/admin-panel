import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { agentApi, type AgentMode } from '@/lib/agent-client';
import { useUIStore } from '@/store/useStore';

/**
 * Super-admin sessions have no tenantId of their own — TenantGuard treats
 * them as "all tenants" unless told which one to act as via `x-tenant-id`.
 * Regular tenant users just use their own tenantId regardless of the store.
 */
function useEffectiveTenantId(): string | null {
  const { data: session } = useSession();
  const activeTenantId = useUIStore((s) => s.activeTenantId);
  return activeTenantId ?? session?.user?.tenantId ?? null;
}

/** Recent agent runs for the tenant. */
export function useAgentRuns() {
  const { data: session } = useSession();
  const tenantId = useEffectiveTenantId();
  return useQuery({
    queryKey: ['agent-runs'],
    queryFn: () => agentApi.listRuns(session?.accessToken, tenantId),
    enabled: !!session?.accessToken,
  });
}

/** One run plus its actions (the approval cards). Source of truth for display. */
export function useAgentRun(runId: string | null) {
  const { data: session } = useSession();
  const tenantId = useEffectiveTenantId();
  return useQuery({
    queryKey: ['agent-run', runId],
    queryFn: () => agentApi.getRun(session?.accessToken, runId as string, tenantId),
    enabled: !!session?.accessToken && !!runId,
  });
}

/** Run the agent on a plain-language instruction. */
export function useRunAgent() {
  const { data: session } = useSession();
  const tenantId = useEffectiveTenantId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { message: string; mode?: AgentMode }) =>
      agentApi.run(session?.accessToken, vars.message, vars.mode, tenantId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agent-runs'] });
      qc.invalidateQueries({ queryKey: ['pages'] });
    },
  });
}

/** Apply a queued mutation the agent proposed. */
export function useApproveAction() {
  const { data: session } = useSession();
  const tenantId = useEffectiveTenantId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => agentApi.approveAction(session?.accessToken, id, tenantId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agent-run'] });
      qc.invalidateQueries({ queryKey: ['pages'] });
    },
  });
}

/** Decline a queued mutation. */
export function useRejectAction() {
  const { data: session } = useSession();
  const tenantId = useEffectiveTenantId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => agentApi.rejectAction(session?.accessToken, id, tenantId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agent-run'] });
    },
  });
}
