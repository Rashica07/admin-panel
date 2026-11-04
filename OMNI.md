# OMNI design system & transformation notes

This app is one half of the OMNI product family (**OMNI Admin** — storefront
operations, and **OMNI CMS** — structured content & publishing). Both share the
files listed below verbatim; keep them in sync when you change one.

## Identity

| Token | Value | Use |
|---|---|---|
| Charcoal | `#1A1A1D` (`--sidebar`) | navigation surface; canvas is one step darker (`#141416`) |
| Ivory | `#E8DCC8` (`--ivory`, text `#EDE4D3`) | primary text, marketing headlines |
| Crimson | `#C83246` (`--brand`) | the primary action and the current location only |
| Crimson text | `#E86373` (`--brand-fg`) | crimson *text/links* — passes AA (5.6:1) where `#C83246` does not |
| Gold | `#E8B44F` (`amber-400`) | attention: drafts, pending, warnings, the demo banner |

Semantic colours remap Tailwind's own scales in `globals.css`
(`green` = success, `red` = error, `amber/yellow` = attention, `blue` = info,
`neutral` = warm greys), so existing utilities across all pages follow the
system. Radii are capped (`rounded-2xl` = 10px). Root font size is 93.75%
(15px) for operational density. Dark-only: one token set, no light mode.

Type: **Instrument Sans** for UI, **JetBrains Mono** for data (addresses, slugs,
counts, timestamps, section labels via `.omni-label`).

## Shared components (`src/components/omni/`)

- `app-shell.tsx` — sidebar (workspace, ⌘K search slot, grouped nav with plan
  locks and real counts, primary action, account menu) + breadcrumb topbar with
  live API status. Each app passes its own nav definition from `dashboard/layout.tsx`.
- `page-header.tsx` — compact title + muted qualifier + mono `MetaTag`s + actions.
- `panel.tsx` — bordered section with a header row (icon · title · description · action).
- `status.tsx` — dot + label status mapped to semantic tones.
- `traffic-chart.tsx` — single-series line chart and `FigureStrip` (key figures
  in one hairline-divided strip instead of stat cards).
- `omni-mark.tsx`, `landing.tsx`.
- `src/components/ui/{button,input,card}.tsx` — restyled primitives.

## Rules that keep it OMNI

- One crimson button per view. Everything else is `variant="outline"`.
- Only show numbers the API returned. No trend percentages without a comparison period.
- Page titles use `PageHeader` (19px). No icons in titles.
- Plan-gated features stay visible but locked; module-disabled features disappear.
  Server-side guards remain the enforcement — the UI only mirrors them.

## Known gaps (not yet redesigned beyond the token pass)

- Settings sub-pages that were static placeholders before (checkout, shipping,
  taxes, sales channels, notifications in OMNI Admin) still have no backend; they
  now use OMNI styling but remain placeholders.
- OMNI Admin "Connected apps" and "Inbox (WhatsApp)" render hard-coded sample data
  in the frontend (pre-existing); they need real API wiring.
- Inner screens (forms inbox, media, menus, schema builder, CRM, email, reservations)
  received the token/heading/glow sweep, not a bespoke redesign.
