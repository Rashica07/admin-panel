'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { toast } from 'sonner';

export default function GeneralSettingsPage() {
  const [values, setValues] = useState({
    storeName: 'Novus Store',
    description: '',
    email: 'hello@example.com',
    timezone: 'UTC',
    currency: 'USD',
    phone: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
  });
  
  const [savedValues, setSavedValues] = useState(values);
  const [saving, setSaving] = useState(false);

  const hasUnsavedChanges = JSON.stringify(values) !== JSON.stringify(savedValues);

  const handleSave = () => {
    setSaving(true);
    // Simulate API call
    setTimeout(() => {
      setSavedValues(values);
      setSaving(false);
      toast.success('Settings saved successfully');
    }, 500);
  };

  const handleDiscard = () => {
    setValues(savedValues);
  };

  const updateValue = (key: string, val: string) => {
    setValues(prev => ({ ...prev, [key]: val }));
  };

  return (
    <div className="space-y-6 relative pb-10 anim-fade-in">
      
      {/* ─── STORE INFORMATION ────────────────────────────────────────────── */}
      <Card className="bg-surface border-border shadow-sm">
        <CardHeader className="pb-4 border-b border-border/50">
          <CardTitle className="text-lg font-semibold">Store Information</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-neutral-300">Store name</Label>
            <Input 
              value={values.storeName}
              onChange={(e) => updateValue('storeName', e.target.value)}
              className="max-w-md bg-surface-2 border-border-strong text-white focus-visible:ring-brand" 
            />
          </div>
          
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-neutral-300">Store contact email</Label>
              <Input 
                value={values.email}
                onChange={(e) => updateValue('email', e.target.value)}
                className="bg-surface-2 border-border-strong text-white focus-visible:ring-brand" 
              />
              <p className="text-xs text-neutral-500">We'll use this address if we need to contact you about your account.</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-neutral-300">Store industry</Label>
              <select className="flex h-10 w-full items-center rounded-md border border-border-strong bg-surface-2 px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand appearance-none">
                <option>Fashion & Apparel</option>
                <option>Electronics</option>
                <option>Home & Garden</option>
                <option>Other</option>
              </select>
            </div>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-neutral-300">Store currency</Label>
              <select 
                value={values.currency}
                onChange={(e) => updateValue('currency', e.target.value)}
                className="flex h-10 w-full items-center rounded-md border border-border-strong bg-surface-2 px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand appearance-none"
              >
                <option value="USD">US Dollar (USD)</option>
                <option value="EUR">Euro (EUR)</option>
                <option value="GBP">British Pound (GBP)</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-neutral-300">Store timezone</Label>
              <select 
                value={values.timezone}
                onChange={(e) => updateValue('timezone', e.target.value)}
                className="flex h-10 w-full items-center rounded-md border border-border-strong bg-surface-2 px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand appearance-none"
              >
                <option value="UTC">UTC</option>
                <option value="EST">Eastern Time (US & Canada)</option>
                <option value="CET">Central European Time</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── STORE ADDRESS ────────────────────────────────────────────────── */}
      <Card className="bg-surface border-border shadow-sm">
        <CardHeader className="pb-4 border-b border-border/50">
          <CardTitle className="text-lg font-semibold">Store Address</CardTitle>
          <p className="text-sm text-neutral-400 mt-1">This address will appear on your invoices.</p>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-neutral-300">Country/Region</Label>
              <select 
                value={values.country}
                onChange={(e) => updateValue('country', e.target.value)}
                className="flex h-10 w-full items-center rounded-md border border-border-strong bg-surface-2 px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand appearance-none"
              >
                <option value="US">United States</option>
                <option value="GB">United Kingdom</option>
                <option value="AL">Albania</option>
                <option value="IT">Italy</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-neutral-300">Phone</Label>
              <Input 
                value={values.phone}
                onChange={(e) => updateValue('phone', e.target.value)}
                className="bg-surface-2 border-border-strong text-white focus-visible:ring-brand" 
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium text-neutral-300">Address</Label>
            <Input 
              value={values.street}
              onChange={(e) => updateValue('street', e.target.value)}
              className="bg-surface-2 border-border-strong text-white focus-visible:ring-brand" 
            />
          </div>
          
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-neutral-300">City</Label>
              <Input 
                value={values.city}
                onChange={(e) => updateValue('city', e.target.value)}
                className="bg-surface-2 border-border-strong text-white focus-visible:ring-brand" 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-neutral-300">State/Province</Label>
              <Input 
                value={values.state}
                onChange={(e) => updateValue('state', e.target.value)}
                className="bg-surface-2 border-border-strong text-white focus-visible:ring-brand" 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-neutral-300">ZIP/Postal Code</Label>
              <Input 
                value={values.zip}
                onChange={(e) => updateValue('zip', e.target.value)}
                className="bg-surface-2 border-border-strong text-white focus-visible:ring-brand" 
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── DANGER ZONE ──────────────────────────────────────────────────── */}
      <Card className="bg-surface border-border shadow-sm">
        <CardHeader className="pb-4 border-b border-border/50">
          <CardTitle className="text-lg font-semibold text-red-400">Store Status</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-medium text-white mb-1">Deactivate store</h4>
            <p className="text-xs text-neutral-400 max-w-sm">If you no longer want to operate this store, you can pause or deactivate it.</p>
          </div>
          <Button variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300">
            Deactivate
          </Button>
        </CardContent>
      </Card>

      {/* ─── FLOATING SAVE BAR ────────────────────────────────────────────── */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-6 left-1/2 md:left-[calc(50%+110px)] -translate-x-1/2 z-50 w-full max-w-2xl px-4 anim-fade-up">
          <div className="bg-neutral-900 flex items-center justify-between rounded-xl p-3 pl-6 pr-3 shadow-2xl border border-neutral-700">
            <span className="text-sm font-medium text-white flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-brand animate-pulse" /> Unsaved changes
            </span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="hover:bg-neutral-800 text-neutral-300" onClick={handleDiscard}>
                Discard
              </Button>
              <Button size="sm" className="gap-2 bg-brand text-black hover:bg-brand-hover" onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4" /> Save
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
