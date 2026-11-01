import { renderPreviewHtml } from '@/demo/site-preview';
import { defaultPortfolioContent } from '@/lib/default-content';

/** Demo-only: a stand-in for the tenant's public website ("Online Store" links point here). */
export function GET() {
  return new Response(renderPreviewHtml(defaultPortfolioContent), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
