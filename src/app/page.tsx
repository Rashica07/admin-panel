'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  MessageCircle,
  Zap,
  ShieldCheck,
  History,
  Braces,
  ArrowRight,
  Check,
  Sparkles,
  Smartphone,
  Eye,
} from 'lucide-react';

/**
 * Marketing homepage — chat-first pitch.
 * Core insight: owners don't want to "use a CMS". They want to say what
 * should change and see it happen. The hero demos that exact interaction.
 */

const FEATURES = [
  {
    icon: MessageCircle,
    title: 'Edit by Texting',
    desc: '"Change the coffee price to €3.50." That\'s it. No dashboards, no fields, no tutorials — describe the change like you\'d tell an employee.',
  },
  {
    icon: Eye,
    title: 'Preview Before Live',
    desc: 'Every request becomes a clear before → after card. Nothing touches your website until you tap Confirm. No surprises, ever.',
  },
  {
    icon: Zap,
    title: 'Live in Seconds',
    desc: 'Confirmed changes appear on your site in about a second — no rebuilds, no deploys, no waiting for a developer.',
  },
  {
    icon: Smartphone,
    title: 'Or Just WhatsApp Us',
    desc: 'Don\'t even want to open a browser? Send the change to your dedicated WhatsApp number and reply "yes" to the preview. Done.',
  },
  {
    icon: History,
    title: 'A Full Paper Trail',
    desc: 'Every change is logged: what changed, when, before and after. Roll your eyes at "who changed this?" forever.',
  },
  {
    icon: Braces,
    title: 'Headless API for IT Teams',
    desc: 'Agency tier keeps the full developer surface: REST + realtime API, custom content types, raw data access. Chat for owners, API for engineers.',
  },
];

const PLANS = [
  {
    name: 'Starter',
    price: 'Free',
    period: 'for 3 months',
    tagline: 'Try it with your first project',
    features: ['1 website', 'Chat-based editing', 'Preview before live', 'Change history'],
    cta: 'Start free trial',
    highlight: false,
  },
  {
    name: 'Studio',
    price: '€100',
    period: '/year',
    tagline: 'For growing businesses',
    features: [
      'Everything in Starter',
      'WhatsApp editing channel',
      '3 websites',
      'Staff accounts & roles',
      'Priority support',
    ],
    cta: 'Get Studio',
    highlight: true,
  },
  {
    name: 'Agency',
    price: '€230',
    period: '/month',
    tagline: 'For teams & IT companies',
    features: [
      'Everything in Studio',
      'Unlimited websites',
      'Full headless API access',
      'Custom content types & e-commerce',
      'White-label panel',
    ],
    cta: 'Get Agency',
    highlight: false,
  },
];

export default function LandingPage() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // ── Hero entrance ──
      gsap
        .timeline({ defaults: { ease: 'power3.out' } })
        .fromTo('.hero-badge', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 })
        .fromTo('.hero-line', { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, stagger: 0.12 }, '-=0.3')
        .fromTo('.hero-sub', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, '-=0.5')
        .fromTo('.hero-cta', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.1 }, '-=0.4');

      // ── Looping chat demo ──
      gsap
        .timeline({ repeat: -1, repeatDelay: 2.2, defaults: { ease: 'power2.out' } })
        .set(['.demo-user', '.demo-card', '.demo-live'], { opacity: 0, y: 14 })
        .set('.demo-typing', { opacity: 0 })
        .to('.demo-user', { opacity: 1, y: 0, duration: 0.45 }, 0.6)
        .to('.demo-typing', { opacity: 1, duration: 0.25 }, '+=0.35')
        .to('.demo-typing', { opacity: 0, duration: 0.2 }, '+=0.9')
        .to('.demo-card', { opacity: 1, y: 0, duration: 0.5 }, '<')
        .to('.demo-live', { opacity: 1, y: 0, duration: 0.45 }, '+=1.1');

      // ── Scroll reveals ──
      gsap.utils.toArray<HTMLElement>('.reveal').forEach((el) => {
        gsap.fromTo(
          el,
          { y: 50, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 85%' } },
        );
      });

      // ── Floating orbs ──
      gsap.to('.orb-1', { y: -40, x: 30, duration: 6, repeat: -1, yoyo: true, ease: 'sine.inOut' });
      gsap.to('.orb-2', { y: 50, x: -20, duration: 8, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={root} className="min-h-screen bg-neutral-950 text-white overflow-x-hidden">
      {/* ── Nav ── */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-neutral-950/70 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <span className="text-lg font-bold tracking-tight text-brand">Novus Pulse</span>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-neutral-300 hover:text-white transition-colors px-3 py-2">
              Log in
            </Link>
            <Link
              href="/register"
              className="text-sm font-semibold bg-brand text-black rounded-lg px-4 py-2 hover:bg-brand/90 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <header className="relative pt-36 pb-24 px-6">
        <div className="orb-1 pointer-events-none absolute -top-20 right-[10%] h-96 w-96 rounded-full bg-brand/20 blur-[120px]" />
        <div className="orb-2 pointer-events-none absolute top-40 -left-20 h-80 w-80 rounded-full bg-orange-600/10 blur-[100px]" />

        <div className="relative mx-auto max-w-6xl grid lg:grid-cols-2 gap-14 items-center">
          {/* Left: message */}
          <div className="text-center lg:text-left">
            <span className="hero-badge inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-4 py-1.5 text-xs font-medium text-brand mb-8">
              <Sparkles className="h-3.5 w-3.5" /> Your website, managed by messages
            </span>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]">
              <span className="hero-line block">Just tell us</span>
              <span className="hero-line block bg-gradient-to-r from-brand via-orange-400 to-amber-300 bg-clip-text text-transparent">
                what to change.
              </span>
              <span className="hero-line block">We show you first.</span>
            </h1>

            <p className="hero-sub mt-7 max-w-xl mx-auto lg:mx-0 text-lg text-neutral-400">
              No dashboards. No training. Describe the change like you&apos;d tell an employee, approve
              the preview, and it&apos;s live in seconds — on the web or straight from WhatsApp.
            </p>

            <div className="mt-9 flex flex-col sm:flex-row items-center lg:justify-start justify-center gap-4">
              <Link
                href="/register"
                className="hero-cta group inline-flex items-center gap-2 rounded-xl bg-brand px-7 py-3.5 font-semibold text-black hover:bg-brand/90 transition-all"
              >
                Try it free for 3 months
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/login"
                className="hero-cta inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-7 py-3.5 font-semibold text-white hover:bg-white/10 transition-colors"
              >
                Log in
              </Link>
            </div>
          </div>

          {/* Right: live chat demo */}
          <div className="relative mx-auto w-full max-w-sm">
            <div className="rounded-3xl border border-white/10 bg-neutral-900/80 backdrop-blur p-4 shadow-2xl">
              <div className="flex items-center gap-2 border-b border-white/5 pb-3 mb-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/20 text-brand">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-semibold">Novus Assistant</span>
                <span className="ml-auto flex items-center gap-1 text-[9px] text-green-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> online
                </span>
              </div>

              <div className="space-y-3 min-h-[300px]">
                <div className="demo-user flex justify-end">
                  <div className="rounded-2xl rounded-br-md bg-brand px-3.5 py-2 text-xs text-black max-w-[85%]">
                    Change the coffee price to €3.50
                  </div>
                </div>

                <div className="demo-typing flex justify-start">
                  <div className="rounded-2xl rounded-bl-md bg-neutral-800 px-3.5 py-2.5 flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="h-1 w-1 rounded-full bg-neutral-500 animate-bounce"
                        style={{ animationDelay: `${i * 120}ms` }}
                      />
                    ))}
                  </div>
                </div>

                <div className="demo-card rounded-2xl border border-brand/40 bg-brand/5 p-3.5 space-y-2">
                  <p className="text-[8px] font-semibold uppercase tracking-widest text-brand">
                    Preview — not live yet
                  </p>
                  <p className="text-[10px] text-neutral-400">Cappuccino · Menu page</p>
                  <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-2.5 py-1.5 text-xs text-red-300 line-through">
                    €3.00
                  </div>
                  <div className="rounded-lg bg-green-500/10 border border-green-500/20 px-2.5 py-1.5 text-xs text-green-300">
                    €3.50
                  </div>
                  <div className="flex gap-2 pt-1">
                    <span className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-brand py-1.5 text-[10px] font-bold text-black">
                      <Check className="h-3 w-3" /> Confirm
                    </span>
                    <span className="flex items-center justify-center rounded-lg border border-neutral-700 px-3 py-1.5 text-[10px] text-neutral-400">
                      Cancel
                    </span>
                  </div>
                </div>

                <div className="demo-live flex justify-start">
                  <div className="rounded-2xl rounded-bl-md bg-neutral-800 px-3.5 py-2 text-xs text-neutral-200 flex items-center gap-1.5">
                    <Zap className="h-3 w-3 text-brand" /> Live on your site in 2 seconds ✓
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Features ── */}
      <section className="px-6 py-24 border-t border-white/5">
        <div className="mx-auto max-w-6xl">
          <div className="reveal text-center mb-16">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-brand mb-3">How you&apos;ll use it</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Running a website shouldn&apos;t feel like work.
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="reveal rounded-2xl border border-white/5 bg-white/[0.02] p-6 hover:border-brand/30 hover:bg-brand/[0.03] transition-colors"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/15 text-brand mb-5">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WhatsApp callout ── */}
      <section className="px-6 py-20 border-t border-white/5">
        <div className="reveal mx-auto max-w-4xl rounded-3xl border border-green-500/20 bg-green-500/5 p-10 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-500/15 text-green-400">
            <Smartphone className="h-7 w-7" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            Or skip the website entirely — <span className="text-green-400">text us on WhatsApp</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-neutral-400">
            Send &quot;change our Sunday hours to 10–22&quot; to your dedicated number. You get the same
            before → after preview back as a message. Reply <em>yes</em> and it&apos;s live. That&apos;s the
            entire workflow.
          </p>
          <p className="mt-3 text-xs text-neutral-600">Available on Studio and Agency plans.</p>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="px-6 py-24 border-t border-white/5">
        <div className="mx-auto max-w-4xl">
          <div className="reveal text-center mb-16">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-brand mb-3">How it works</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Three steps. Zero learning curve.</h2>
          </div>
          <div className="space-y-6">
            {[
              ['01', 'Say it', 'Type (or WhatsApp) what you want changed, in plain language. Any language.'],
              ['02', 'See it', 'You get an exact before → after preview. Nothing happens without your explicit confirmation.'],
              ['03', 'It\'s live', 'One tap and the change is on your website in seconds — no rebuild, no deploy, no developer.'],
            ].map(([n, t, d]) => (
              <div key={n} className="reveal flex gap-6 items-start rounded-2xl border border-white/5 bg-white/[0.02] p-6">
                <span className="text-brand font-mono text-sm pt-1">{n}</span>
                <div>
                  <h3 className="font-semibold text-lg">{t}</h3>
                  <p className="text-sm text-neutral-400 mt-1">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="px-6 py-24 border-t border-white/5">
        <div className="mx-auto max-w-5xl">
          <div className="reveal text-center mb-16">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-brand mb-3">Pricing</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Simple, honest plans</h2>
            <p className="text-sm text-neutral-500 mt-3">
              Card payments via Stripe — launching soon. Start with a free 3-month trial today.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {PLANS.map((p) => (
              <div
                key={p.name}
                className={`reveal relative rounded-2xl border p-7 flex flex-col ${
                  p.highlight
                    ? 'border-brand/50 bg-brand/[0.05] shadow-[0_0_40px_rgba(255,140,0,0.08)]'
                    : 'border-white/5 bg-white/[0.02]'
                }`}
              >
                {p.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-black">
                    Most popular
                  </span>
                )}
                <h3 className="font-semibold text-lg">{p.name}</h3>
                <p className="text-xs text-neutral-500 mt-1">{p.tagline}</p>
                <div className="mt-5 mb-6">
                  <span className="text-4xl font-bold">{p.price}</span>
                  <span className="text-sm text-neutral-500 ml-1">{p.period}</span>
                </div>
                <ul className="space-y-2.5 mb-8 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-neutral-300">
                      <Check className="h-4 w-4 text-brand shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`block text-center rounded-xl px-5 py-3 text-sm font-semibold transition-colors ${
                    p.highlight ? 'bg-brand text-black hover:bg-brand/90' : 'border border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="px-6 py-28 border-t border-white/5">
        <div className="reveal mx-auto max-w-3xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight flex items-center justify-center gap-3 flex-wrap">
            <ShieldCheck className="h-10 w-10 text-brand" />
            <span>
              Nothing goes live <span className="text-brand">without your yes.</span>
            </span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-neutral-400">
            Every change is previewed, confirmed by you, and logged. Your website stays exactly as
            safe as it is effortless.
          </p>
          <Link
            href="/register"
            className="group mt-10 inline-flex items-center gap-2 rounded-xl bg-brand px-8 py-4 font-semibold text-black hover:bg-brand/90 transition-all"
          >
            Create your free workspace
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/5 px-6 py-10">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-neutral-500">
          <span className="font-semibold text-neutral-300">Novus Pulse</span>
          <span>© {new Date().getFullYear()} KIQA DEV. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
