'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Store, MapPin, Globe, Palette, CheckCircle2, ArrowRight, ArrowLeft, Upload, FileText, Package, Plus } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

const STEPS = [
  { id: 'store', title: 'Store details', icon: Store },
  { id: 'location', title: 'Location & Currency', icon: MapPin },
  { id: 'products', title: 'First Product', icon: FileText },
  { id: 'theme', title: 'Choose Theme', icon: Palette },
];

export default function SetupWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    router.push('/dashboard');
  };

  // If completed all steps
  if (currentStep === STEPS.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] anim-fade-in">
        <div className="h-24 w-24 rounded-full bg-green-500/20 flex items-center justify-center mb-8">
          <CheckCircle2 className="h-12 w-12 text-green-500" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-4">Your store is ready!</h1>
        <p className="text-neutral-400 max-w-md text-center mb-10">
          We've set up your workspace. You can always change these settings later in your dashboard.
        </p>
        
        <div className="grid sm:grid-cols-2 gap-4 w-full max-w-xl mb-10">
          <Link href="/dashboard/pages/new" className="block p-4 rounded-xl border border-border bg-surface hover:bg-surface-2 transition-colors">
            <h3 className="font-semibold text-white mb-1">Add more products</h3>
            <p className="text-xs text-neutral-400">Expand your catalog</p>
          </Link>
          <Link href="/dashboard/themes" className="block p-4 rounded-xl border border-border bg-surface hover:bg-surface-2 transition-colors">
            <h3 className="font-semibold text-white mb-1">Customize your theme</h3>
            <p className="text-xs text-neutral-400">Make it your own</p>
          </Link>
          <Link href="/dashboard/settings" className="block p-4 rounded-xl border border-border bg-surface hover:bg-surface-2 transition-colors">
            <h3 className="font-semibold text-white mb-1">Set up payments</h3>
            <p className="text-xs text-neutral-400">Configure your gateway</p>
          </Link>
          <Link href="/dashboard/builder" className="block p-4 rounded-xl border border-border bg-surface hover:bg-surface-2 transition-colors">
            <h3 className="font-semibold text-white mb-1">Visual Editor</h3>
            <p className="text-xs text-neutral-400">Design your storefront</p>
          </Link>
        </div>

        <Button size="lg" onClick={handleComplete} className="bg-brand text-black hover:bg-brand-hover px-12">
          Go to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex flex-col md:flex-row gap-12 max-w-5xl mx-auto pt-10">
      
      {/* ─── LEFT SIDEBAR (Progress) ────────────────────────────────────────── */}
      <div className="md:w-64 shrink-0 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white">Setup Guide</h2>
          <p className="text-sm text-neutral-400 mt-1">~5 minutes remaining</p>
        </div>
        
        <div className="space-y-4">
          {STEPS.map((step, idx) => {
            const isActive = idx === currentStep;
            const isCompleted = idx < currentStep;
            
            return (
              <div key={step.id} className={cn("flex items-center gap-3 transition-colors", isActive ? "text-white" : isCompleted ? "text-neutral-500" : "text-neutral-600")}>
                <div className={cn("flex items-center justify-center h-6 w-6 rounded-full border text-xs font-bold", 
                  isCompleted ? "bg-brand border-brand text-black" : isActive ? "border-brand text-brand" : "border-neutral-700 text-neutral-600"
                )}>
                  {isCompleted ? <CheckCircle2 className="h-3 w-3" /> : idx + 1}
                </div>
                <span className={cn("text-sm font-medium", isActive && "font-semibold")}>{step.title}</span>
              </div>
            );
          })}
        </div>
        
        <div className="pt-8">
          <Button variant="ghost" className="text-neutral-500 hover:text-white px-0" onClick={handleComplete}>
            Skip onboarding
          </Button>
        </div>
      </div>

      {/* ─── MAIN CONTENT WIZARD ────────────────────────────────────────────── */}
      <div className="flex-1">
        <Card className="bg-surface border-border-strong shadow-xl overflow-hidden anim-fade-in relative min-h-[500px] flex flex-col">
          
          {/* Progress Bar */}
          <div className="h-1 w-full bg-neutral-900 absolute top-0 left-0">
            <div className="h-full bg-brand transition-all duration-500" style={{ width: `${((currentStep) / STEPS.length) * 100}%` }} />
          </div>

          <CardContent className="p-8 sm:p-12 flex-1 flex flex-col">
            
            {/* Step 1: Store Details */}
            {currentStep === 0 && (
              <div className="space-y-8 anim-fade-up flex-1">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-white">Let's set up your store</h2>
                  <p className="text-neutral-400">Tell us a bit about your business so we can configure your workspace.</p>
                </div>
                
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-neutral-300">Store name</Label>
                    <Input placeholder="e.g. My Awesome Brand" className="h-11 bg-surface-2 border-border-strong text-white focus-visible:ring-brand" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-neutral-300">Industry / Niche</Label>
                    <select className="flex h-11 w-full items-center rounded-md border border-border-strong bg-surface-2 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand appearance-none">
                      <option>Fashion & Apparel</option>
                      <option>Electronics</option>
                      <option>Health & Beauty</option>
                      <option>Home & Garden</option>
                      <option>Digital Products</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Location & Currency */}
            {currentStep === 1 && (
              <div className="space-y-8 anim-fade-up flex-1">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-white">Where are you located?</h2>
                  <p className="text-neutral-400">This helps us set your default currency, shipping rates, and tax calculations.</p>
                </div>
                
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-neutral-300">Country / Region</Label>
                    <select className="flex h-11 w-full items-center rounded-md border border-border-strong bg-surface-2 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand appearance-none">
                      <option>United States</option>
                      <option>United Kingdom</option>
                      <option>Albania</option>
                      <option>Italy</option>
                      <option>Germany</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-neutral-300">Currency</Label>
                      <select className="flex h-11 w-full items-center rounded-md border border-border-strong bg-surface-2 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand appearance-none">
                        <option>USD ($)</option>
                        <option>EUR (€)</option>
                        <option>GBP (£)</option>
                        <option>ALL (L)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-neutral-300">Timezone</Label>
                      <select className="flex h-11 w-full items-center rounded-md border border-border-strong bg-surface-2 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand appearance-none">
                        <option>UTC-5 (EST)</option>
                        <option>UTC+0 (GMT)</option>
                        <option>UTC+1 (CET)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: First Product */}
            {currentStep === 2 && (
              <div className="space-y-8 anim-fade-up flex-1">
                <div className="space-y-2 text-center">
                  <div className="h-16 w-16 bg-surface-2 rounded-2xl border border-border-strong flex items-center justify-center mx-auto mb-6 shadow-xl">
                    <Package className="h-8 w-8 text-brand" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Add your first product</h2>
                  <p className="text-neutral-400 max-w-sm mx-auto">Get your store started by adding a product to sell, or import your existing catalog.</p>
                </div>
                
                <div className="grid sm:grid-cols-2 gap-4 mt-8">
                  <div className="rounded-xl border border-border-strong bg-surface-2 p-6 flex flex-col items-center text-center gap-4 hover:border-brand/50 transition-colors cursor-pointer group">
                    <div className="h-12 w-12 rounded-full bg-brand/10 text-brand flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Plus className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">Enter manually</h3>
                      <p className="text-xs text-neutral-400">Create a product from scratch</p>
                    </div>
                  </div>
                  
                  <div className="rounded-xl border border-border-strong bg-surface-2 p-6 flex flex-col items-center text-center gap-4 hover:border-brand/50 transition-colors cursor-pointer group">
                    <div className="h-12 w-12 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Upload className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">Import from CSV</h3>
                      <p className="text-xs text-neutral-400">Migrating from another platform?</p>
                    </div>
                  </div>
                </div>
                
                <div className="text-center pt-4">
                  <button onClick={handleNext} className="text-sm text-neutral-500 hover:text-white transition-colors">
                    Skip this step for now
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Choose Theme */}
            {currentStep === 3 && (
              <div className="space-y-6 anim-fade-up flex-1">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-white">Choose a starting theme</h2>
                  <p className="text-neutral-400">You can always customize it later in the Visual Editor.</p>
                </div>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Theme 1 */}
                  <div className="rounded-xl border-2 border-brand overflow-hidden relative cursor-pointer">
                    <div className="absolute top-2 right-2 bg-brand text-black text-[10px] font-bold px-2 py-0.5 rounded-full z-10">Selected</div>
                    <div className="h-32 bg-neutral-800 w-full relative">
                      {/* Abstract theme representation */}
                      <div className="absolute inset-0 p-4 flex flex-col gap-2">
                        <div className="h-4 w-1/3 bg-neutral-700 rounded" />
                        <div className="h-12 w-full bg-neutral-700 rounded mt-auto" />
                      </div>
                    </div>
                    <div className="p-3 bg-surface-2">
                      <h3 className="font-semibold text-white text-sm">Dawn</h3>
                      <p className="text-xs text-neutral-400">Clean, minimalist design</p>
                    </div>
                  </div>
                  
                  {/* Theme 2 */}
                  <div className="rounded-xl border-2 border-transparent hover:border-neutral-600 overflow-hidden cursor-pointer transition-colors">
                    <div className="h-32 bg-neutral-900 w-full relative">
                      <div className="absolute inset-0 p-4 flex flex-col items-center gap-2">
                        <div className="h-4 w-1/2 bg-neutral-800 rounded" />
                        <div className="flex gap-2 w-full mt-auto">
                          <div className="h-10 flex-1 bg-neutral-800 rounded" />
                          <div className="h-10 flex-1 bg-neutral-800 rounded" />
                        </div>
                      </div>
                    </div>
                    <div className="p-3 bg-surface-2">
                      <h3 className="font-semibold text-white text-sm">Impact</h3>
                      <p className="text-xs text-neutral-400">Bold typography, big imagery</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="pt-8 mt-auto flex items-center justify-between border-t border-border/50">
              <Button variant="ghost" className="text-neutral-400 hover:text-white" onClick={handleBack} disabled={currentStep === 0}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
              </Button>
              <Button className="bg-brand text-black hover:bg-brand-hover px-8" onClick={handleNext}>
                {currentStep === STEPS.length - 1 ? 'Finish Setup' : 'Next'} <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
            
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
