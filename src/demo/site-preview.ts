/* eslint-disable @typescript-eslint/no-explicit-any -- renders the editor's free-form content JSON; shape varies by site. */
/**
 * Demo-only live preview for the Visual Editor. In the real product the
 * preview is an iframe of the tenant's own website; in demo mode there is no
 * such site, so this renders the page content (same JSON the editor edits)
 * into a self-contained HTML document passed to the iframe via `srcDoc`.
 */
const esc = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const list = (v: unknown): any[] => (Array.isArray(v) ? v : []);

export function renderPreviewHtml(c: any): string {
  const nav = c?.nav ?? {};
  const hero = c?.hero ?? {};
  const services = c?.services ?? {};
  const work = c?.work ?? {};
  const process = c?.process ?? {};
  const about = c?.about ?? {};
  const contact = c?.contact ?? {};
  const footer = c?.footer ?? {};

  const section = (label: unknown, title: unknown, sub: unknown, body: string) =>
    `<section><p class="label">${esc(label)}</p><h2>${esc(title)}</h2>${sub ? `<p class="sub">${esc(sub)}</p>` : ''}${body}</section>`;

  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{box-sizing:border-box}body{margin:0;background:#0a0a0a;color:#e5e5e5;font:15px/1.6 Inter,system-ui,sans-serif}
header{display:flex;gap:22px;align-items:center;padding:18px 32px;border-bottom:1px solid #1f1f1f;position:sticky;top:0;background:#0a0a0aee}
header b{color:#ff8c00;margin-right:auto;font-size:17px}header a{color:#a3a3a3;font-size:13px;text-decoration:none}
header .quote{background:#ff8c00;color:#000;padding:7px 14px;border-radius:8px;font-weight:600}
.hero{padding:72px 32px 56px;max-width:880px}.badge{display:inline-block;border:1px solid #ff8c0055;color:#ff8c00;padding:4px 12px;border-radius:99px;font-size:12px}
h1{font-size:44px;line-height:1.08;margin:18px 0;letter-spacing:-.02em}h1 span{color:#ff8c00}
.sub{color:#a3a3a3;max-width:640px}.btns{display:flex;gap:12px;margin-top:24px}
.btn{padding:10px 18px;border-radius:10px;font-weight:600;font-size:14px;background:#ff8c00;color:#000}.btn.o{background:none;border:1px solid #333;color:#e5e5e5}
.avail{margin-top:18px;color:#737373;font-size:12px}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px;padding:0 32px 40px;max-width:980px}
.stat{border:1px solid #1f1f1f;border-radius:12px;padding:16px}.stat b{display:block;font-size:26px;color:#ff8c00}.stat small{color:#737373}
section{padding:40px 32px;max-width:980px;border-top:1px solid #151515}.label{color:#ff8c00;text-transform:uppercase;letter-spacing:.12em;font-size:11px;margin:0}
h2{font-size:28px;margin:6px 0 8px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;margin-top:20px}
.card{border:1px solid #1f1f1f;background:#101010;border-radius:14px;padding:18px}.card h3{margin:0 0 4px;font-size:16px}
.card .m{color:#ff8c00;font-size:12px;font-weight:600}.card p{color:#a3a3a3;font-size:13px;margin:8px 0 0}
footer{padding:32px;border-top:1px solid #1f1f1f;color:#737373;font-size:12px;display:flex;justify-content:space-between}
</style></head><body>
<header><b>${esc(about.title || 'Your Brand')}</b>${['home', 'services', 'portfolio', 'blog', 'about', 'contact'].map((k) => (nav[k] ? `<a>${esc(nav[k])}</a>` : '')).join('')}${nav.quote ? `<a class="quote">${esc(nav.quote)}</a>` : ''}</header>
<div class="hero">${hero.badge ? `<span class="badge">${esc(hero.badge)}</span>` : ''}
<h1>${esc(hero.h1Line1)} <span>${esc(hero.h1Line2)}</span> ${esc(hero.h1Line3)} ${esc(hero.h1Line4)}</h1>
<p class="sub">${esc(hero.sub)}</p><div class="btns">${hero.cta1 ? `<span class="btn">${esc(hero.cta1)}</span>` : ''}${hero.cta2 ? `<span class="btn o">${esc(hero.cta2)}</span>` : ''}</div>
${hero.available ? `<p class="avail">● ${esc(hero.available)}</p>` : ''}</div>
${list(c?.stats).length ? `<div class="stats">${list(c.stats).map((s) => `<div class="stat"><b>${esc(s.value)}</b><small>${esc(s.label)}</small></div>`).join('')}</div>` : ''}
${list(services.items).length ? section(services.label, services.title, services.sub, `<div class="grid">${list(services.items).map((i) => `<div class="card"><h3>${esc(i.name)}</h3><span class="m">${esc(i.price)} · ${esc(i.timeline)}</span><p>${esc(i.tagline)}</p></div>`).join('')}</div>`) : ''}
${list(work.projects).length ? section(work.label, work.title, '', `<div class="grid">${list(work.projects).map((p) => `<div class="card"><h3>${esc(p.name)}</h3><span class="m">${esc(p.type)} · ${esc(p.year)}</span><p>${esc(p.desc)}</p></div>`).join('')}</div>`) : ''}
${list(process.steps).length ? section(process.label, process.title, '', `<div class="grid">${list(process.steps).map((s) => `<div class="card"><span class="m">${esc(s.n)}</span><h3>${esc(s.title)}</h3><p>${esc(s.desc)}</p></div>`).join('')}</div>`) : ''}
${list(c?.testimonials).length ? section('Testimonials', 'What clients say', '', `<div class="grid">${list(c.testimonials).map((t) => `<div class="card"><p>“${esc(t.quote)}”</p><span class="m">${esc(t.name)} — ${esc(t.role)}</span></div>`).join('')}</div>`) : ''}
${about.title ? section(about.label, about.title, about.sub, list(about.bio).map((b) => `<p class="sub">${esc(b)}</p>`).join('')) : ''}
${contact.title ? section(contact.label, contact.title, contact.sub, '') : ''}
<footer><span>${esc(footer.tagline)}</span><span>${esc(footer.legal)}</span></footer>
</body></html>`;
  return html;
}
