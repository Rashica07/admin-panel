'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { createPulseClient } from '@/lib/novus-pulse-client';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Lock, CreditCard, ShieldCheck, CheckCircle2, Loader2 } from 'lucide-react';

const PLANS: Record<string, { price: number; name: string }> = {
  starter: { price: 49, name: 'Starter Plan' },
  studio: { price: 99, name: 'Studio Plan' },
  agency: { price: 299, name: 'Agency Plan' },
};

export default function MockStripePage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: '',
  });

  const tenantPlan = session?.user?.plan || 'studio';
  const planDetails = PLANS[tenantPlan] || PLANS.studio;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const pulse = createPulseClient(session?.accessToken);
      
      const last4 = cardDetails.number.replace(/\D/g, '').slice(-4) || '4242';

      await pulse.mockCheckout({
        plan: tenantPlan,
        amount: planDetails.price,
        cardLast4: last4,
      });

      // Actually refresh the session so plan/status reflect the backend
      // immediately — without this, the JWT keeps its stale pre-payment
      // values until a full re-login, and every plan-gated page keeps
      // showing "Payment Required" even though the payment succeeded.
      await update();
      setSuccess(true);
      toast.success('Payment submitted successfully!');

      // Wait a bit, then take them to a pending state page or dashboard
      setTimeout(() => {
        router.push('/dashboard');
      }, 3000);

    } catch (err: any) {
      toast.error(err.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4 animate-in fade-in zoom-in duration-500">
          <div className="mx-auto w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Payment Received!</h1>
          <p className="text-neutral-400 max-w-md mx-auto">
            Your payment is currently pending admin approval. You will receive an email once your workspace is fully activated.
          </p>
          <div className="mt-8 flex justify-center">
            <Loader2 className="h-5 w-5 text-neutral-500 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center pt-20 p-4">
      {/* Stripe-like Header */}
      <div className="w-full max-w-3xl flex justify-between items-center mb-8">
        <div className="flex items-center gap-2 text-white">
          <div className="h-8 w-8 bg-brand rounded-lg flex items-center justify-center shadow-lg shadow-brand/20">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight">Novus Pulse</span>
        </div>
        <div className="text-right">
          <p className="text-sm text-neutral-400">Total Due</p>
          <p className="text-2xl font-bold text-white">${planDetails.price}.00</p>
        </div>
      </div>

      <div className="w-full max-w-3xl grid md:grid-cols-5 gap-8">
        
        {/* Left Col: Order Summary */}
        <div className="md:col-span-2 space-y-6">
          <div>
            <h2 className="text-neutral-400 text-sm font-semibold uppercase tracking-wider mb-4">Order Summary</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-white font-medium">{planDetails.name}</p>
                  <p className="text-sm text-neutral-500">Billed monthly</p>
                </div>
                <p className="text-white font-medium">${planDetails.price}.00</p>
              </div>
              <div className="h-px bg-neutral-800 w-full" />
              <div className="flex justify-between items-start font-bold">
                <p className="text-white">Total</p>
                <p className="text-white">${planDetails.price}.00</p>
              </div>
            </div>
          </div>
          
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 flex items-start gap-3">
            <Lock className="h-5 w-5 text-neutral-500 shrink-0 mt-0.5" />
            <p className="text-xs text-neutral-400 leading-relaxed">
              This is a secure 256-bit SSL encrypted payment. 
              <br/><br/>
              <em>Note: This is a mockup payment page for the Novus Pulse platform. Your card will not be charged. Admin approval is required to activate the account.</em>
            </p>
          </div>
        </div>

        {/* Right Col: Payment Form */}
        <div className="md:col-span-3">
          <Card className="bg-neutral-900 border-neutral-800 shadow-2xl">
            <CardHeader className="border-b border-neutral-800/50 pb-6">
              <CardTitle className="text-xl">Payment Details</CardTitle>
              <CardDescription>Enter your card information below.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form id="payment-form" onSubmit={handleSubmit} className="space-y-5">
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-neutral-400">Email Address</Label>
                  <Input 
                    id="email"
                    type="email" 
                    value={session?.user?.email || ''} 
                    disabled 
                    className="bg-neutral-950 border-neutral-800 text-neutral-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name" className="text-neutral-400">Name on Card</Label>
                  <Input 
                    id="name"
                    required
                    placeholder="Jane Doe"
                    value={cardDetails.name}
                    onChange={(e) => setCardDetails({...cardDetails, name: e.target.value})}
                    className="bg-neutral-950 border-neutral-800 focus:ring-brand focus:border-brand"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="card" className="text-neutral-400">Card Information</Label>
                  <div className="relative">
                    <Input 
                      id="card"
                      required
                      placeholder="0000 0000 0000 0000"
                      className="bg-neutral-950 border-neutral-800 focus:ring-brand focus:border-brand pl-10"
                      value={cardDetails.number}
                      onChange={(e) => setCardDetails({...cardDetails, number: e.target.value})}
                    />
                    <CreditCard className="absolute left-3 top-2.5 h-5 w-5 text-neutral-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <Input 
                      required
                      placeholder="MM/YY"
                      className="bg-neutral-950 border-neutral-800 focus:ring-brand focus:border-brand"
                      value={cardDetails.expiry}
                      onChange={(e) => setCardDetails({...cardDetails, expiry: e.target.value})}
                    />
                    <Input 
                      required
                      placeholder="CVC"
                      className="bg-neutral-950 border-neutral-800 focus:ring-brand focus:border-brand"
                      value={cardDetails.cvc}
                      onChange={(e) => setCardDetails({...cardDetails, cvc: e.target.value})}
                    />
                  </div>
                </div>
              </form>
            </CardContent>
            <CardFooter className="bg-neutral-950/50 border-t border-neutral-800/50 p-6 rounded-b-xl">
              <Button 
                type="submit" 
                form="payment-form" 
                className="w-full h-12 text-base font-bold bg-brand hover:bg-brand/90"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /> Processing...</span>
                ) : (
                  `Pay $${planDetails.price}.00`
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
