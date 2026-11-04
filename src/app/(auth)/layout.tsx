import { OmniWordmark } from '@/components/omni/omni-mark';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <OmniWordmark product="Admin" />
          <p className="text-[13px] text-neutral-500">Run your storefront</p>
        </div>
        {children}
      </div>
    </div>
  );
}
