'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Download, ExternalLink } from 'lucide-react';

export default function BillingSettingsPage() {
  return (
    <div className="space-y-6 pb-10 anim-fade-in">
      
      <Card className="bg-surface border-border shadow-sm border-brand/30 shadow-[0_0_20px_rgba(255,140,0,0.05)] relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10">
          <CreditCard className="h-32 w-32 text-brand" />
        </div>
        <CardHeader className="pb-2">
          <p className="text-xs uppercase tracking-wider text-brand/80 font-bold mb-1">Current plan</p>
          <CardTitle className="text-3xl font-bold text-white flex items-center gap-3">
            Shopify Advanced
            <span className="flex items-center gap-1.5 rounded-full bg-green-500/10 border border-green-500/20 px-3 py-1 text-xs font-semibold text-green-400">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" /> Active
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-6 relative z-10">
          <div className="grid sm:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-neutral-400 mb-1">Monthly billing amount</p>
              <p className="text-lg font-semibold text-white">€299.00 / month</p>
            </div>
            <div>
              <p className="text-sm text-neutral-400 mb-1">Next billing date</p>
              <p className="text-lg font-semibold text-white">August 15, 2026</p>
            </div>
            <div>
              <p className="text-sm text-neutral-400 mb-1">Staff accounts</p>
              <p className="text-lg font-semibold text-white">5 of 15 used</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 pt-4 border-t border-border/50">
            <Button className="bg-brand text-black hover:bg-brand-hover">Change plan</Button>
            <Button variant="outline" className="border-border-strong text-neutral-300">Switch to annual billing (Save 20%)</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-surface border-border shadow-sm">
        <CardHeader className="pb-4 border-b border-border/50 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">Payment Methods</CardTitle>
          <Button variant="outline" size="sm" className="border-border-strong">Replace</Button>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 p-4 border border-border-strong rounded-xl bg-surface-2">
            <div className="h-10 w-16 bg-white rounded-md flex items-center justify-center">
              <span className="text-blue-600 font-bold italic text-lg">VISA</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Visa ending in 4242</p>
              <p className="text-xs text-neutral-400">Expires 12/28</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-surface border-border shadow-sm">
        <CardHeader className="pb-4 border-b border-border/50 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">Recent Bills</CardTitle>
          <Button variant="ghost" size="sm" className="text-brand hover:bg-brand/10 hover:text-brand gap-2">
            View all billing history <ExternalLink className="h-3 w-3" />
          </Button>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-neutral-400 bg-surface-2/50 border-b border-border/50">
              <tr>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Description</th>
                <th className="px-6 py-3 font-medium">Amount</th>
                <th className="px-6 py-3 font-medium text-right">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {[
                { date: 'Jul 15, 2026', desc: 'Shopify Advanced Plan (Monthly)', amt: '€299.00' },
                { date: 'Jun 15, 2026', desc: 'Shopify Advanced Plan (Monthly)', amt: '€299.00' },
                { date: 'May 15, 2026', desc: 'Shopify Advanced Plan (Monthly)', amt: '€299.00' },
              ].map((inv, i) => (
                <tr key={i} className="hover:bg-surface-2/30">
                  <td className="px-6 py-4 text-white">{inv.date}</td>
                  <td className="px-6 py-4 text-neutral-300">{inv.desc}</td>
                  <td className="px-6 py-4 font-medium text-white">{inv.amt}</td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="sm" className="text-brand hover:bg-brand/10 h-8 w-8 p-0">
                      <Download className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

    </div>
  );
}
