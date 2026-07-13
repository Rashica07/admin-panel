import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Plan } from '@/lib/plan';

/**
 * UI state store for the CMS panel.
 *
 * `previewPlan` — lets the platform owner (super_admin) preview the panel
 * as if they were on a different billing plan. This is a UI-only overlay,
 * clearly labeled as a preview — it never changes any real entitlements.
 * Replaces the old "Dev Tools" toggle, which was a fake plan-picker.
 */
interface UIState {
  // Mobile drawer
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  // Desktop icon rail (collapsed keeps every button visible as an icon)
  sidebarCollapsed: boolean;
  toggleCollapsed: () => void;
  // Owner-only plan preview
  previewPlan: Plan | null;
  setPreviewPlan: (plan: Plan | null) => void;
  // Active tenant selection
  activeTenantId: string | null;
  activeTenantSlug: string | null;
  activeTenantName: string | null;
  setActiveTenant: (tenant: { id: string; name: string; slug: string } | null) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      isSidebarOpen: false,
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      closeSidebar: () => set({ isSidebarOpen: false }),
      sidebarCollapsed: false,
      toggleCollapsed: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      previewPlan: null,
      setPreviewPlan: (previewPlan) => set({ previewPlan }),
      activeTenantId: null,
      activeTenantSlug: null,
      activeTenantName: null,
      setActiveTenant: (tenant) =>
        set({
          activeTenantId: tenant?.id ?? null,
          activeTenantSlug: tenant?.slug ?? null,
          activeTenantName: tenant?.name ?? null,
        }),
    }),
    {
      name: 'np-ui',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        previewPlan: state.previewPlan,
        activeTenantId: state.activeTenantId,
        activeTenantSlug: state.activeTenantSlug,
        activeTenantName: state.activeTenantName,
      }),
    }
  )
);
