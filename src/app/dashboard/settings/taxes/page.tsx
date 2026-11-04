'use client';

import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Percent } from 'lucide-react';

export default function TaxesSettingsPage() {
  return (
    <div className="space-y-6 pb-10 anim-fade-in">
      <Card className="bg-surface border-border shadow-sm">
        <CardHeader className="pb-4 border-b border-border/50 text-center py-10">
          <div className="mx-auto bg-brand/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-4">
            <Percent className="h-8 w-8 text-brand-fg" />
          </div>
          <CardTitle className="text-xl font-bold">Taxes</CardTitle>
          <CardDescription className="text-neutral-400 mt-2 max-w-sm mx-auto">
            Manage how your store charges taxes based on your local jurisdictions.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
