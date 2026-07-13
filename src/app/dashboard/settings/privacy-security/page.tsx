'use client';

import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldCheck } from 'lucide-react';

export default function SecuritySettingsPage() {
  return (
    <div className="space-y-6 pb-10 anim-fade-in">
      <Card className="bg-surface border-border shadow-sm">
        <CardHeader className="pb-4 border-b border-border/50 text-center py-10">
          <div className="mx-auto bg-brand/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-4">
            <ShieldCheck className="h-8 w-8 text-brand" />
          </div>
          <CardTitle className="text-xl font-bold">Privacy & Security</CardTitle>
          <CardDescription className="text-neutral-400 mt-2 max-w-sm mx-auto">
            Manage your password, 2FA, API keys, and data privacy settings.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
