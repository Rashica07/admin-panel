import { Landing } from '@/components/omni/landing';

export default function LandingPage() {
  return (
    <Landing
      product="Admin"
      eyebrow="Live demo · no sign-up needed"
      headline={<>Run your storefront from one calm control room.</>}
      sub="OMNI Admin keeps products, pages, forms and traffic in one place — so the daily work of running a small online business takes minutes, not an afternoon."
      preview={{ src: '/omni-preview.png', alt: 'OMNI Admin overview showing traffic, unread leads and inventory' }}
      features={[
        { title: 'Products & inventory', body: 'Prices, compare-at prices, stock levels and draft/active status, with low-stock items surfaced on the overview.' },
        { title: 'Pages, posts & media', body: 'Write pages and journal posts, organise categories and keep every image in one media library.' },
        { title: 'Visual editor', body: 'Edit every section of your site with a live preview; each save keeps a revision you can restore.' },
        { title: 'Forms & leads', body: 'Contact, wholesale and newsletter submissions land in one inbox with unread tracking.' },
        { title: 'Themes & menus', body: 'Switch themes, adjust brand colours and build your navigation without touching code.' },
        { title: 'Traffic & SEO', body: 'Daily views, top pages, devices and referrers, plus the metadata search engines read.' },
      ]}
      steps={[
        { title: 'Log in', body: 'The demo opens a sample coffee roaster workspace with real-looking data.' },
        { title: 'Work through the overview', body: 'Unread leads, low stock and unpublished pages are listed with a direct link to fix each one.' },
        { title: 'Change anything', body: 'Edit products, pages and the site itself. Reset the demo whenever you like.' },
      ]}
    />
  );
}
