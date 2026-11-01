'use client';

import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Store } from 'lucide-react';

export default function SalesChannelsSettingsPage() {
  return (
    <div className="space-y-6 pb-10 anim-fade-in">
      <Card className="bg-surface border-border shadow-sm">
        <CardHeader className="pb-4 border-b border-border/50 text-center py-10">
          <div className="mx-auto bg-brand/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-4">
            <Store className="h-8 w-8 text-brand-fg" />
          </div>
          <CardTitle className="text-xl font-bold">Sales Channels</CardTitle>
          <CardDescription className="text-neutral-400 mt-2 max-w-sm mx-auto">
            Manage your Online Store, Instagram Shop, and other sales channels.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
