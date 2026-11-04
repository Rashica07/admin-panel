import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { OmniWordmark } from '@/components/omni/omni-mark';

export type LandingFeature = { title: string; body: string };

/**
 * OMNI product landing. One message, one primary action (Log in), and a real
 * screenshot of the product — no invented metrics or testimonials.
 */
export function Landing({
  product,
  eyebrow,
  headline,
  sub,
  features,
  steps,
  preview,
}: {
  product: string;
  eyebrow: string;
  headline: React.ReactNode;
  sub: string;
  features: LandingFeature[];
  steps: { title: string; body: string }[];
  preview: { src: string; alt: string };
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-5">
          <OmniWordmark product={product} />
          <nav aria-label="Sections" className="hidden items-center gap-5 text-[13px] text-neutral-400 md:flex">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#how" className="hover:text-foreground">How it works</a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/login" className="flex h-8 items-center rounded-md bg-brand px-3 text-[13px] font-medium text-brand-foreground transition-colors hover:bg-brand-hover">
              Log in
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:pt-20">
          <div>
            <p className="flex items-center gap-2 text-xs text-neutral-400">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400" aria-hidden />
              {eyebrow}
            </p>
            <h1 className="mt-5 text-[40px] font-medium leading-[1.05] tracking-[-0.025em] text-ivory sm:text-[48px]">{headline}</h1>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-neutral-400">{sub}</p>
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <Link href="/login" className="inline-flex h-10 items-center gap-2 rounded-md bg-brand px-4 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand-hover">
                Log in to the demo <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <a href="#features" className="text-sm text-neutral-400 underline-offset-4 hover:text-foreground hover:underline">
                What&apos;s inside
              </a>
            </div>
          </div>
          <div className="overflow-hidden rounded-lg border border-border-strong bg-surface shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)]">
            <div className="flex h-7 items-center gap-1.5 border-b border-border px-3" aria-hidden>
              <span className="h-2 w-2 rounded-full bg-neutral-700" />
              <span className="h-2 w-2 rounded-full bg-neutral-700" />
              <span className="h-2 w-2 rounded-full bg-neutral-700" />
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview.src} alt={preview.alt} width={1440} height={900} className="block h-auto w-full" />
          </div>
        </section>

        <section id="features" className="border-t border-border">
          <div className="mx-auto max-w-6xl px-5 py-14">
            <p className="omni-label">Features</p>
            <h2 className="mt-2 max-w-xl text-2xl font-medium tracking-[-0.015em] text-ivory">Everything in one workspace.</h2>
            <dl className="mt-8 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <div key={f.title} className="bg-background p-5">
                  <dt className="text-[14px] font-medium text-foreground">{f.title}</dt>
                  <dd className="mt-1.5 text-[13px] leading-relaxed text-neutral-400">{f.body}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section id="how" className="border-t border-border">
          <div className="mx-auto max-w-6xl px-5 py-14">
            <p className="omni-label">How it works</p>
            <ol className="mt-6 grid gap-8 md:grid-cols-3">
              {steps.map((s, i) => (
                <li key={s.title} className="border-t border-border-strong pt-4">
                  <span className="font-mono text-xs text-brand-fg">{String(i + 1).padStart(2, '0')}</span>
                  <h3 className="mt-2 text-[15px] font-medium text-foreground">{s.title}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-neutral-400">{s.body}</p>
                </li>
              ))}
            </ol>
            <div className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-surface px-5 py-4">
              <p className="text-[14px] text-neutral-300">The demo opens a sample workspace. Nothing you change leaves your browser.</p>
              <Link href="/login" className="inline-flex h-8 items-center gap-1.5 rounded-md bg-brand px-3 text-[13px] font-medium text-brand-foreground hover:bg-brand-hover">
                Log in <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-xs text-neutral-500">
          <OmniWordmark product={product} />
          <span>Released under the GPL-3.0 license.</span>
        </div>
      </footer>
    </div>
  );
}
