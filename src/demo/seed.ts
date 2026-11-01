/**
 * Demo seed data — one fictional business ("Meridian Roasters", a specialty
 * coffee roaster) with enough content in every module that each dashboard
 * screen looks lived-in. Everything lives in the visitor's browser; there is
 * no backend behind it.
 */

export const DEMO_VERSION = 3;

/**
 * Home page shape differs by app: the generic block editor (agentic-cms) stores
 * `content.blocks[]`; the admin-panel Visual Editor edits a structured
 * portfolio document and merges `content` over its built-in defaults.
 */
export const HOME_USES_BLOCKS = false;

export const DEMO_TENANT_ID = 'demo-tenant';
export const DEMO_USER_ID = 'demo-user';

const DAY = 86_400_000;
const HOUR = 3_600_000;

export function uid(prefix = 'id'): string {
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}_${rand}`;
}

/** Inline SVG "photo" so the demo never depends on external image hosts. */
export function svgImage(label: string, a: string, b: string, w = 800, h = 600): string {
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'>` +
    `<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${a}'/><stop offset='1' stop-color='${b}'/></linearGradient></defs>` +
    `<rect width='100%' height='100%' fill='url(#g)'/>` +
    `<circle cx='${w * 0.78}' cy='${h * 0.25}' r='${h * 0.18}' fill='rgba(255,255,255,0.10)'/>` +
    `<circle cx='${w * 0.2}' cy='${h * 0.85}' r='${h * 0.28}' fill='rgba(0,0,0,0.12)'/>` +
    `<text x='50%' y='52%' fill='rgba(255,255,255,0.92)' font-family='Georgia,serif' font-size='${Math.round(w / 13)}' text-anchor='middle' dominant-baseline='middle'>${label}</text>` +
    `</svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

const iso = (offsetMs: number) => new Date(Date.now() + offsetMs).toISOString();

export type DemoDb = Record<string, any>;

export function buildSeed(): DemoDb {
  const now = Date.now();

  // ── Tenant & users ────────────────────────────────────────
  const tenant = {
    id: DEMO_TENANT_ID,
    name: 'Meridian Roasters',
    slug: 'meridian-roasters',
    plan: 'agency',
    status: 'active',
    paymentMethod: 'card',
    ownerId: DEMO_USER_ID,
    siteUrl: 'https://meridian-roasters.example.com',
    devUrl: null,
    whatsappNumber: '+14155550123',
    revalidateSecret: 'demo_revalidate_secret',
    resendApiKey: null,
    geminiApiKey: null,
    enabledModules: null,
    settings: {
      notifications: { newSubmission: true, newReservation: true, weeklyDigest: false },
      privacy: { cookieBanner: true, analyticsAnonymize: true },
      policies: {
        returns: '30-day returns on unopened bags.',
        shipping: 'Roasted to order, ships within 2 business days.',
      },
    },
    theme: {
      colors: { primary: '#ff8c00', background: '#0a0a0a', surface: '#121212', accent: '#ff6b00' },
      fonts: { body: 'Inter', heading: 'Outfit' },
      borderRadius: '12px',
    },
    createdAt: iso(-120 * DAY),
    updatedAt: iso(-2 * DAY),
  };

  const users = [
    { id: DEMO_USER_ID, email: 'demo@novuspulse.dev', firstName: 'Alex', lastName: 'Rivera', role: 'admin', tenantId: DEMO_TENANT_ID, createdAt: iso(-120 * DAY), updatedAt: iso(-1 * DAY) },
    { id: 'u_maya', email: 'maya@meridian.example', firstName: 'Maya', lastName: 'Chen', role: 'editor', tenantId: DEMO_TENANT_ID, createdAt: iso(-90 * DAY), updatedAt: iso(-9 * DAY) },
    { id: 'u_jonas', email: 'jonas@meridian.example', firstName: 'Jonas', lastName: 'Weber', role: 'author', tenantId: DEMO_TENANT_ID, createdAt: iso(-60 * DAY), updatedAt: iso(-12 * DAY) },
    { id: 'u_priya', email: 'priya@meridian.example', firstName: 'Priya', lastName: 'Nair', role: 'viewer', tenantId: DEMO_TENANT_ID, createdAt: iso(-30 * DAY), updatedAt: iso(-3 * DAY) },
  ];

  const invites = [
    { id: 'inv_1', email: 'sam@meridian.example', role: 'editor', status: 'pending', createdAt: iso(-2 * DAY), expiresAt: iso(5 * DAY) },
  ];

  // ── Media ─────────────────────────────────────────────────
  const folders = [
    { id: 'f_products', tenantId: DEMO_TENANT_ID, name: 'Products', parentId: null, createdAt: iso(-100 * DAY), updatedAt: iso(-100 * DAY) },
    { id: 'f_blog', tenantId: DEMO_TENANT_ID, name: 'Blog', parentId: null, createdAt: iso(-90 * DAY), updatedAt: iso(-90 * DAY) },
  ];

  const mediaDefs: [string, string, string, string, string | null][] = [
    ['Ethiopia Guji', '#7b3f00', '#d9a066', 'ethiopia-guji.jpg', 'f_products'],
    ['Colombia Huila', '#5b2a0e', '#c27c3c', 'colombia-huila.jpg', 'f_products'],
    ['Kenya AA', '#3b1d0a', '#a85d2c', 'kenya-aa.jpg', 'f_products'],
    ['House Blend', '#2b1608', '#8a4b1f', 'house-blend.jpg', 'f_products'],
    ['Cold Brew', '#1e293b', '#475569', 'cold-brew.jpg', 'f_products'],
    ['Pour-over Kit', '#334155', '#94a3b8', 'pour-over-kit.jpg', 'f_products'],
    ['The Roastery', '#9a3412', '#fb923c', 'roastery.jpg', null],
    ['Café Counter', '#78350f', '#fbbf24', 'cafe-counter.jpg', null],
    ['Farm Visit', '#14532d', '#4ade80', 'farm-visit.jpg', 'f_blog'],
    ['Latte Art', '#831843', '#f472b6', 'latte-art.jpg', 'f_blog'],
    ['Brew Guide', '#1e3a8a', '#60a5fa', 'brew-guide.jpg', 'f_blog'],
    ['Team Photo', '#581c87', '#c084fc', 'team.jpg', null],
  ];
  const media = mediaDefs.map(([label, a, b, filename, folderId], i) => ({
    id: `m_${i + 1}`,
    tenantId: DEMO_TENANT_ID,
    folderId,
    url: svgImage(label, a, b),
    filename,
    mimeType: 'image/jpeg',
    size: 180_000 + i * 53_000,
    uploadedBy: DEMO_USER_ID,
    altText: label,
    caption: i % 3 === 0 ? `${label} — Meridian Roasters` : '',
    focalX: null,
    focalY: null,
    provider: 'local',
    createdAt: iso(-(60 - i * 4) * DAY),
  }));
  const img = (label: string) => media.find((m) => m.altText === label)?.url ?? '';

  // ── Products ──────────────────────────────────────────────
  const productDefs: [string, string, number, number | null, number, string, string, string][] = [
    ['Ethiopia Guji — Washed', 'ethiopia-guji', 19.5, null, 42, 'active', 'Jasmine, bergamot and ripe peach. A bright, tea-like cup from the Guji highlands.', 'Ethiopia Guji'],
    ['Colombia Huila — Honey', 'colombia-huila', 17.0, 20.0, 64, 'active', 'Caramel sweetness with red apple acidity. Our everyday favourite.', 'Colombia Huila'],
    ['Kenya AA — Kiambu', 'kenya-aa', 21.0, null, 18, 'active', 'Blackcurrant, grapefruit and a syrupy body.', 'Kenya AA'],
    ['House Blend', 'house-blend', 14.0, null, 120, 'active', 'Chocolate, toasted almond and a soft finish. Built for espresso and milk.', 'House Blend'],
    ['Cold Brew Concentrate (1L)', 'cold-brew-concentrate', 12.0, null, 35, 'active', 'Steeped 18 hours. Dilute 1:1 over ice.', 'Cold Brew'],
    ['Pour-over Starter Kit', 'pour-over-kit', 48.0, 58.0, 9, 'draft', 'Dripper, filters, server and a bag of House Blend.', 'Pour-over Kit'],
  ];
  const products = productDefs.map(([title, slug, price, compareAtPrice, inventoryQty, status, description, imgLabel], i) => ({
    id: `prod_${i + 1}`,
    tenantId: DEMO_TENANT_ID,
    title,
    slug,
    description,
    price,
    compareAtPrice,
    inventoryQty,
    status,
    images: [img(imgLabel)],
    createdAt: iso(-(80 - i * 6) * DAY),
    updatedAt: iso(-(5 + i) * DAY),
  }));

  // ── Pages (generic block editor shape: content.blocks[]) ──
  const blk = (type: string, props: Record<string, unknown>, id?: string) => ({ id: id ?? uid('blk'), type, props });
  const header = () => blk('header', { logoText: 'Meridian Roasters', navLinks: 'Home, Shop, Journal, Visit, Contact' });
  const footer = () => blk('footer', { text: '© 2026 Meridian Roasters. Roasted with care.', links: 'Privacy, Terms, Wholesale' });

  const pages: any[] = [
    {
      id: 'p_home', title: 'Home', slug: 'home', type: 'page', published: true,
      content: HOME_USES_BLOCKS
        ? {
            blocks: [
              header(),
              blk('hero', { heading: 'Coffee, roasted slowly.', subheading: 'Small-batch specialty coffee from farms we know by name — roasted to order in Lisbon.', imageUrl: img('The Roastery'), ctaLabel: 'Shop beans', ctaHref: '/shop', align: 'center' }),
              blk('featured-products', { heading: 'Fresh off the roaster', count: 4 }),
              blk('image-with-text', { heading: 'Direct from the source', body: 'We visit every farm we buy from, pay well above Fairtrade, and publish what we pay.', imageUrl: img('Farm Visit'), imagePosition: 'left' }),
              blk('button-cta', { heading: 'Coffee subscription', subheading: 'Fresh beans every two weeks. Pause any time.', buttonLabel: 'Start a subscription', buttonHref: '/shop' }),
              footer(),
            ],
          }
        : {}, // Visual Editor merges this over the built-in default portfolio content
    },
    {
      id: 'p_about', title: 'About', slug: 'about', type: 'page', published: true,
      content: {
        blocks: [
          header(),
          blk('richtext', { heading: 'Our story', body: 'Meridian began in a garage in 2019 with a 1kg roaster and a stubborn opinion about washed Ethiopians. Today we are a team of nine, one roastery and one café.' }),
          blk('image-with-text', { heading: 'The people', body: 'Roasters, baristas and one very patient bookkeeper.', imageUrl: img('Team Photo'), imagePosition: 'right' }),
          footer(),
        ],
      },
    },
    {
      id: 'p_visit', title: 'Visit the Café', slug: 'visit', type: 'page', published: true,
      content: {
        blocks: [
          header(),
          blk('richtext', { heading: 'Find us', body: 'Rua do Norte 42, Lisbon. Open daily 8:00–18:00. Reservations recommended for weekend brunch.' }),
          blk('gallery', { heading: 'Inside', imageUrls: [img('Café Counter'), img('Latte Art'), img('The Roastery')].join(', ') }),
          footer(),
        ],
      },
    },
    {
      id: 'p_wholesale', title: 'Wholesale', slug: 'wholesale', type: 'page', published: false,
      content: { blocks: [header(), blk('richtext', { heading: 'Wholesale partners', body: 'Draft — pricing tiers coming soon.' }), footer()] },
    },
    // Blog posts (admin-panel "Posts" screen uses type === 'post')
    {
      id: 'post_1', title: 'How we choose our farms', slug: 'how-we-choose-our-farms', type: 'post', published: true,
      content: { blocks: [], excerpt: 'Six questions we ask before buying a single bag.', body: 'Every year we taste more than 300 samples. Only about 12 make it onto our menu.', category: 'Sourcing', coverImage: img('Farm Visit') },
    },
    {
      id: 'post_2', title: 'A beginner’s guide to pour-over', slug: 'beginners-guide-to-pour-over', type: 'post', published: true,
      content: { blocks: [], excerpt: 'Three variables, one reliable cup.', body: 'Grind size, water temperature, and pour speed — master those and the rest is detail.', category: 'Brewing', coverImage: img('Brew Guide') },
    },
    {
      id: 'post_3', title: 'Latte art without the frustration', slug: 'latte-art-without-the-frustration', type: 'post', published: false,
      content: { blocks: [], excerpt: 'Draft — steaming technique notes.', body: 'Texture first. Pattern second.', category: 'Brewing', coverImage: img('Latte Art') },
    },
    { id: 'cat_sourcing', title: 'Sourcing', slug: 'sourcing', type: 'category', published: true, content: {} },
    { id: 'cat_brewing', title: 'Brewing', slug: 'brewing', type: 'category', published: true, content: {} },
  ].map((p, i) => ({
    ...p,
    tenantId: DEMO_TENANT_ID,
    createdAt: iso(-(70 - i * 5) * DAY),
    updatedAt: iso(-(i + 1) * DAY),
  }));

  const pageRevisions = [
    { id: 'rev_1', pageId: 'p_home', tenantId: DEMO_TENANT_ID, title: 'Home', slug: 'home', type: 'page', published: true, changedBy: DEMO_USER_ID, createdAt: iso(-6 * DAY), content: { blocks: [header(), blk('hero', { heading: 'Coffee, roasted with care.', subheading: 'Specialty coffee from Lisbon.', imageUrl: '', ctaLabel: 'Shop', ctaHref: '/shop', align: 'center' }), footer()] } },
    { id: 'rev_2', pageId: 'p_home', tenantId: DEMO_TENANT_ID, title: 'Home', slug: 'home', type: 'page', published: true, changedBy: 'u_maya', createdAt: iso(-3 * DAY), content: { blocks: [header(), blk('hero', { heading: 'Coffee, roasted slowly.', subheading: 'Small-batch specialty coffee.', imageUrl: '', ctaLabel: 'Shop beans', ctaHref: '/shop', align: 'center' }), footer()] } },
  ];

  // ── Menus ─────────────────────────────────────────────────
  const mi = (label: string, url: string, order: number, isExternal = false) => ({ id: uid('mi'), label, url, isExternal, order });
  const menus = [
    { id: 'menu_main', tenantId: DEMO_TENANT_ID, name: 'Main navigation', slug: 'main', items: [mi('Home', '/', 0), mi('Shop', '/shop', 1), mi('Journal', '/journal', 2), mi('Visit', '/visit', 3), mi('Contact', '/contact', 4)], createdAt: iso(-90 * DAY), updatedAt: iso(-4 * DAY) },
    { id: 'menu_footer', tenantId: DEMO_TENANT_ID, name: 'Footer', slug: 'footer', items: [mi('Privacy', '/privacy', 0), mi('Terms', '/terms', 1), mi('Instagram', 'https://instagram.com', 2, true)], createdAt: iso(-90 * DAY), updatedAt: iso(-20 * DAY) },
  ];

  // ── Form submissions ──────────────────────────────────────
  const submissions = [
    ['Contact', { name: 'Elena Costa', email: 'elena@example.com', message: 'Do you ship the Ethiopia Guji to Spain? And is it available as whole bean only?' }, false, -2 * HOUR],
    ['Contact', { name: 'Tom Alder', email: 'tom@example.com', message: 'Loved the café! Do you host cupping sessions?' }, false, -9 * HOUR],
    ['Wholesale inquiry', { business: 'Harbour Bakery', email: 'orders@harbourbakery.example', volume: '15kg / month', message: 'We would like to serve your House Blend.' }, false, -1 * DAY],
    ['Newsletter', { email: 'ines@example.com' }, true, -1 * DAY - 3 * HOUR],
    ['Newsletter', { email: 'marco@example.com' }, true, -2 * DAY],
    ['Contact', { name: 'Aisha Khan', email: 'aisha@example.com', message: 'Is the pour-over kit back in stock?' }, true, -3 * DAY],
    ['Wholesale inquiry', { business: 'Nordic Co-working', email: 'hello@nordic.example', volume: '8kg / month', message: 'Looking for a weekly delivery.' }, true, -5 * DAY],
    ['Newsletter', { email: 'leo@example.com' }, true, -6 * DAY],
  ].map(([formName, data, read, off], i) => ({
    id: `sub_${i + 1}`,
    tenantId: DEMO_TENANT_ID,
    formName,
    data,
    read,
    createdAt: iso(off as number),
  }));

  // ── Content types & entries (headless CMS) ────────────────
  const f = (contentTypeId: string, apiId: string, label: string, type: string, position: number, required = false, config: Record<string, any> = {}) => ({
    id: `fld_${contentTypeId}_${apiId}`, tenantId: DEMO_TENANT_ID, contentTypeId, apiId, label, type, required, config, position,
  });
  const ct = (id: string, name: string, apiId: string, description: string, icon: string, kind: 'collection' | 'singleton', fields: any[]) => ({
    id, tenantId: DEMO_TENANT_ID, name, apiId, description, icon, kind, fields, createdAt: iso(-100 * DAY), updatedAt: iso(-10 * DAY),
  });

  const contentTypes = [
    ct('ct_category', 'Category', 'category', 'Built-in taxonomy for grouping content.', 'folder', 'collection', [
      f('ct_category', 'name', 'Name', 'text', 0, true), f('ct_category', 'slug', 'Slug', 'slug', 1, true), f('ct_category', 'description', 'Description', 'text', 2),
    ]),
    ct('ct_tag', 'Tag', 'tag', 'Built-in free-form labels.', 'tag', 'collection', [
      f('ct_tag', 'name', 'Name', 'text', 0, true), f('ct_tag', 'slug', 'Slug', 'slug', 1, true),
    ]),
    ct('ct_article', 'Article', 'article', 'Journal posts and long-form stories.', 'file-text', 'collection', [
      f('ct_article', 'title', 'Title', 'text', 0, true), f('ct_article', 'slug', 'Slug', 'slug', 1, true),
      f('ct_article', 'cover', 'Cover image', 'media', 2), f('ct_article', 'excerpt', 'Excerpt', 'text', 3),
      f('ct_article', 'body', 'Body', 'richtext', 4, true),
      f('ct_article', 'category', 'Category', 'reference', 5, false, { targetApiId: 'category' }),
      f('ct_article', 'featured', 'Featured', 'boolean', 6), f('ct_article', 'publishDate', 'Publish date', 'date', 7),
    ]),
    ct('ct_event', 'Event', 'event', 'Cuppings, workshops and pop-ups.', 'calendar', 'collection', [
      f('ct_event', 'name', 'Name', 'text', 0, true), f('ct_event', 'slug', 'Slug', 'slug', 1, true),
      f('ct_event', 'startsAt', 'Starts at', 'datetime', 2, true), f('ct_event', 'capacity', 'Capacity', 'number', 3),
      f('ct_event', 'format', 'Format', 'select', 4, false, { options: ['In person', 'Online', 'Hybrid'] }),
      f('ct_event', 'details', 'Details', 'richtext', 5),
    ]),
    ct('ct_faq', 'FAQ', 'faq', 'Frequently asked questions.', 'help-circle', 'collection', [
      f('ct_faq', 'question', 'Question', 'text', 0, true), f('ct_faq', 'answer', 'Answer', 'richtext', 1, true), f('ct_faq', 'order', 'Order', 'number', 2),
    ]),
    ct('ct_settings', 'Site settings', 'site-settings', 'Global singleton used across the site.', 'settings', 'singleton', [
      f('ct_settings', 'siteTitle', 'Site title', 'text', 0, true), f('ct_settings', 'tagline', 'Tagline', 'text', 1),
      f('ct_settings', 'announcement', 'Announcement bar', 'text', 2), f('ct_settings', 'contactEmail', 'Contact email', 'text', 3),
    ]),
  ];

  const entry = (id: string, typeApiId: string, ctId: string, slug: string, status: string, data: Record<string, any>, ageDays: number, seo: Record<string, any> = {}) => ({
    id, tenantId: DEMO_TENANT_ID, contentTypeId: ctId, typeApiId, slug, locale: 'en', status, data, seo,
    scheduledAt: status === 'scheduled' ? iso(3 * DAY) : null,
    publishedAt: status === 'published' ? iso(-ageDays * DAY) : null,
    createdBy: DEMO_USER_ID, createdAt: iso(-(ageDays + 2) * DAY), updatedAt: iso(-ageDays * DAY), deletedAt: null,
  });

  const contentEntries = [
    entry('e_cat_1', 'category', 'ct_category', 'sourcing', 'published', { name: 'Sourcing', slug: 'sourcing', description: 'Farms, producers and green coffee.' }, 40),
    entry('e_cat_2', 'category', 'ct_category', 'brewing', 'published', { name: 'Brewing', slug: 'brewing', description: 'Methods, ratios and gear.' }, 40),
    entry('e_cat_3', 'category', 'ct_category', 'news', 'published', { name: 'News', slug: 'news', description: 'Updates from the roastery.' }, 35),
    entry('e_tag_1', 'tag', 'ct_tag', 'ethiopia', 'published', { name: 'Ethiopia', slug: 'ethiopia' }, 30),
    entry('e_tag_2', 'tag', 'ct_tag', 'pour-over', 'published', { name: 'Pour-over', slug: 'pour-over' }, 30),
    entry('e_tag_3', 'tag', 'ct_tag', 'espresso', 'published', { name: 'Espresso', slug: 'espresso' }, 30),
    entry('e_art_1', 'article', 'ct_article', 'how-we-choose-our-farms', 'published', { title: 'How we choose our farms', slug: 'how-we-choose-our-farms', cover: img('Farm Visit'), excerpt: 'Six questions we ask before buying a single bag.', body: '<p>Every year we taste more than 300 samples.</p>', category: 'e_cat_1', featured: true, publishDate: iso(-14 * DAY).slice(0, 10) }, 14, { title: 'How we choose our farms', description: 'Our sourcing philosophy.' }),
    entry('e_art_2', 'article', 'ct_article', 'beginners-guide-to-pour-over', 'published', { title: 'A beginner’s guide to pour-over', slug: 'beginners-guide-to-pour-over', cover: img('Brew Guide'), excerpt: 'Three variables, one reliable cup.', body: '<p>Grind, temperature, pour speed.</p>', category: 'e_cat_2', featured: false, publishDate: iso(-8 * DAY).slice(0, 10) }, 8),
    entry('e_art_3', 'article', 'ct_article', 'latte-art-without-the-frustration', 'draft', { title: 'Latte art without the frustration', slug: 'latte-art-without-the-frustration', cover: img('Latte Art'), excerpt: 'Texture first.', body: '<p>Draft…</p>', category: 'e_cat_2', featured: false }, 2),
    entry('e_art_4', 'article', 'ct_article', 'new-roastery-hours', 'in_review', { title: 'New roastery hours', slug: 'new-roastery-hours', excerpt: 'We are now open Sundays.', body: '<p>Pending review.</p>', category: 'e_cat_3', featured: false }, 1),
    entry('e_art_5', 'article', 'ct_article', 'autumn-harvest-preview', 'scheduled', { title: 'Autumn harvest preview', slug: 'autumn-harvest-preview', excerpt: 'First lots of the season.', body: '<p>Coming soon.</p>', category: 'e_cat_1', featured: true }, 1),
    entry('e_evt_1', 'event', 'ct_event', 'public-cupping', 'published', { name: 'Saturday public cupping', slug: 'public-cupping', startsAt: iso(4 * DAY), capacity: 16, format: 'In person', details: '<p>Taste six coffees blind.</p>' }, 6),
    entry('e_evt_2', 'event', 'ct_event', 'home-espresso-workshop', 'published', { name: 'Home espresso workshop', slug: 'home-espresso-workshop', startsAt: iso(11 * DAY), capacity: 10, format: 'Hybrid', details: '<p>Dial in at home.</p>' }, 5),
    entry('e_faq_1', 'faq', 'ct_faq', 'shipping-times', 'published', { question: 'How fast do you ship?', answer: '<p>Within 2 business days of roasting.</p>', order: 1 }, 20),
    entry('e_faq_2', 'faq', 'ct_faq', 'whole-bean', 'published', { question: 'Do you sell ground coffee?', answer: '<p>On request — tell us your brewer.</p>', order: 2 }, 20),
    entry('e_set_1', 'site-settings', 'ct_settings', 'site-settings', 'published', { siteTitle: 'Meridian Roasters', tagline: 'Coffee, roasted slowly.', announcement: 'Free shipping over €40', contactEmail: 'hello@meridian.example' }, 3),
  ];

  const contentPermissions: any[] = [];

  // ── Webhooks, API keys, redirects ─────────────────────────
  const webhooks = [
    { id: 'wh_1', tenantId: DEMO_TENANT_ID, name: 'Rebuild storefront', url: 'https://api.vercel.example/deploy/abc123', events: ['content.published', 'page.updated'], secret: 'whsec_demo', active: true, lastTriggeredAt: iso(-3 * HOUR), lastStatus: '200', createdAt: iso(-60 * DAY), updatedAt: iso(-3 * HOUR) },
    { id: 'wh_2', tenantId: DEMO_TENANT_ID, name: 'Slack notifications', url: 'https://hooks.slack.example/T000/B000/xyz', events: ['form.submitted'], secret: null, active: false, lastTriggeredAt: iso(-12 * DAY), lastStatus: '404', createdAt: iso(-40 * DAY), updatedAt: iso(-12 * DAY) },
  ];
  const apiKeys = [
    { id: 'key_1', tenantId: DEMO_TENANT_ID, name: 'Storefront (production)', keyHash: '•', prefix: 'np_live_a1b2', lastUsedAt: iso(-20 * 60_000), revokedAt: null, createdAt: iso(-60 * DAY) },
    { id: 'key_2', tenantId: DEMO_TENANT_ID, name: 'Mobile app (staging)', keyHash: '•', prefix: 'np_test_c3d4', lastUsedAt: iso(-4 * DAY), revokedAt: null, createdAt: iso(-25 * DAY) },
  ];
  const redirects = [
    { id: 'rd_1', tenantId: DEMO_TENANT_ID, fromPath: '/blog', toPath: '/journal', statusCode: 301, active: true, hits: 184, createdAt: iso(-50 * DAY), updatedAt: iso(-50 * DAY) },
    { id: 'rd_2', tenantId: DEMO_TENANT_ID, fromPath: '/coffee/ethiopia', toPath: '/shop/ethiopia-guji', statusCode: 301, active: true, hits: 67, createdAt: iso(-30 * DAY), updatedAt: iso(-30 * DAY) },
    { id: 'rd_3', tenantId: DEMO_TENANT_ID, fromPath: '/summer-sale', toPath: '/shop', statusCode: 302, active: false, hits: 12, createdAt: iso(-15 * DAY), updatedAt: iso(-2 * DAY) },
  ];

  // ── Reservations ──────────────────────────────────────────
  const resources = [
    { id: 'res_1', tenantId: DEMO_TENANT_ID, name: 'Window table', kind: 'table', capacity: 2, active: true, createdAt: iso(-90 * DAY), updatedAt: iso(-90 * DAY) },
    { id: 'res_2', tenantId: DEMO_TENANT_ID, name: 'Family table', kind: 'table', capacity: 6, active: true, createdAt: iso(-90 * DAY), updatedAt: iso(-90 * DAY) },
    { id: 'res_3', tenantId: DEMO_TENANT_ID, name: 'Cupping room', kind: 'room', capacity: 12, active: true, createdAt: iso(-90 * DAY), updatedAt: iso(-90 * DAY) },
  ];
  const availabilityRules = [1, 2, 3, 4, 5, 6, 0].map((d) => ({
    id: `rule_${d}`, tenantId: DEMO_TENANT_ID, dayOfWeek: d,
    openTime: d === 0 ? '09:00' : '08:00', closeTime: d === 0 ? '16:00' : '18:00',
    slotMinutes: 30, durationMinutes: 60, active: true, createdAt: iso(-90 * DAY), updatedAt: iso(-90 * DAY),
  }));
  const day0 = new Date(); day0.setHours(0, 0, 0, 0);
  const slot = (dayOff: number, hour: number) => new Date(day0.getTime() + dayOff * DAY + hour * HOUR);
  const resDefs: [string, string | null, number, number, number, string, string | null, string | null][] = [
    ['Elena Costa', 'elena@example.com', 2, 0, 9, 'confirmed', 'res_1', null],
    ['Tom Alder', 'tom@example.com', 4, 0, 11, 'confirmed', 'res_2', 'Birthday brunch'],
    ['Marco Bellini', 'marco@example.com', 2, 0, 15, 'pending', 'res_1', null],
    ['Ines Duarte', 'ines@example.com', 6, 1, 10, 'confirmed', 'res_2', 'High chair needed'],
    ['Aisha Khan', 'aisha@example.com', 2, 1, 14, 'pending', 'res_1', null],
    ['Harbour Bakery team', 'orders@harbourbakery.example', 10, 2, 16, 'confirmed', 'res_3', 'Cupping session'],
    ['Leo Martins', 'leo@example.com', 3, 3, 12, 'confirmed', 'res_2', null],
    ['Nina Petrov', null, 2, -1, 9, 'completed', 'res_1', null],
    ['Omar Haddad', 'omar@example.com', 4, -2, 13, 'cancelled', 'res_2', 'Cancelled by guest'],
  ];
  const reservations = resDefs.map(([customerName, customerEmail, partySize, dayOff, hour, status, resourceId, notes], i) => ({
    id: `rsv_${i + 1}`, tenantId: DEMO_TENANT_ID, customerName, customerEmail, customerPhone: null, partySize,
    startsAt: slot(dayOff, hour).toISOString(), endsAt: slot(dayOff, hour + 1).toISOString(),
    status, notes, resourceId, source: i % 3 === 0 ? 'website' : 'manual', createdBy: DEMO_USER_ID, contactId: null,
    createdAt: iso(-(i + 1) * DAY), updatedAt: iso(-(i + 1) * DAY), deletedAt: null,
  }));

  // ── CRM ───────────────────────────────────────────────────
  const contactDefs: [string, string | null, string | null, string, string, string | null, string[]][] = [
    ['Elena Costa', 'elena@example.com', 'Costa Design', 'lead', 'website', '+34 600 111 222', ['newsletter']],
    ['Tom Alder', 'tom@example.com', null, 'customer', 'in-store', '+44 7700 900123', ['cupping', 'vip']],
    ['Harbour Bakery', 'orders@harbourbakery.example', 'Harbour Bakery', 'prospect', 'wholesale form', '+351 912 000 111', ['wholesale']],
    ['Aisha Khan', 'aisha@example.com', null, 'customer', 'website', '+1 415 555 0111', ['subscriber']],
    ['Marco Bellini', 'marco@example.com', 'Bellini & Co', 'customer', 'referral', '+39 333 444 555', ['wholesale', 'vip']],
    ['Ines Duarte', 'ines@example.com', null, 'lead', 'newsletter', '+351 913 222 333', ['newsletter']],
    ['Nordic Co-working', 'hello@nordic.example', 'Nordic Co-working', 'prospect', 'wholesale form', null, ['wholesale']],
    ['Leo Martins', 'leo@example.com', null, 'customer', 'in-store', null, ['subscriber']],
    ['Nina Petrov', null, null, 'churned', 'in-store', '+359 88 123 4567', []],
    ['Omar Haddad', 'omar@example.com', 'Haddad Hospitality', 'prospect', 'referral', '+971 50 123 4567', ['events']],
  ];
  const contacts = contactDefs.map(([name, email, company, lifecycleStage, source, phone, tags], i) => ({
    id: `c_${i + 1}`, tenantId: DEMO_TENANT_ID, name, email, phone, company, lifecycleStage, source, tags, customFields: {},
    ownerId: DEMO_USER_ID, lastContactedAt: iso(-(i * 3 + 1) * DAY), unsubscribed: false,
    createdAt: iso(-(60 - i * 4) * DAY), updatedAt: iso(-(i + 1) * DAY), deletedAt: null,
  }));
  const contactNotes = [
    { id: 'cn_1', contactId: 'c_3', body: 'Asked for sample bags of House Blend. Sent a 250g trio on Tuesday.', authorId: DEMO_USER_ID, createdAt: iso(-3 * DAY) },
    { id: 'cn_2', contactId: 'c_3', body: 'Follow up next week about pricing tiers.', authorId: DEMO_USER_ID, createdAt: iso(-1 * DAY) },
    { id: 'cn_3', contactId: 'c_2', body: 'Regular at Saturday cuppings — happy to give a testimonial.', authorId: 'u_maya', createdAt: iso(-10 * DAY) },
  ];

  // ── Email campaigns ───────────────────────────────────────
  const campaigns = [
    { id: 'camp_1', tenantId: DEMO_TENANT_ID, name: 'Autumn harvest launch', subject: 'The first lots of the season are here', fromName: 'Meridian Roasters', fromEmail: 'hello@meridian.example', html: '<h1>Autumn harvest</h1><p>Fresh lots just landed.</p>', status: 'sent', audience: { stage: 'customer' }, scheduledAt: null, sentAt: iso(-9 * DAY), stats: { total: 482, sent: 478, failed: 4 }, lastError: null, createdBy: DEMO_USER_ID, createdAt: iso(-12 * DAY), updatedAt: iso(-9 * DAY) },
    { id: 'camp_2', tenantId: DEMO_TENANT_ID, name: 'Wholesale intro', subject: 'Roasted for your café', fromName: 'Alex at Meridian', fromEmail: 'alex@meridian.example', html: '<h1>Wholesale</h1><p>Let’s talk.</p>', status: 'scheduled', audience: { tag: 'wholesale' }, scheduledAt: iso(2 * DAY), sentAt: null, stats: {}, lastError: null, createdBy: DEMO_USER_ID, createdAt: iso(-3 * DAY), updatedAt: iso(-1 * DAY) },
    { id: 'camp_3', tenantId: DEMO_TENANT_ID, name: 'Black Friday teaser', subject: 'Something is brewing…', fromName: null, fromEmail: null, html: '<p>Draft</p>', status: 'draft', audience: {}, scheduledAt: null, sentAt: null, stats: {}, lastError: null, createdBy: DEMO_USER_ID, createdAt: iso(-1 * DAY), updatedAt: iso(-1 * DAY) },
  ];
  const emailTemplates = [
    { id: 'tpl_1', tenantId: DEMO_TENANT_ID, name: 'Monthly newsletter', subject: 'This month at Meridian', html: '<h1>This month</h1><p>News from the roastery.</p>', createdAt: iso(-60 * DAY), updatedAt: iso(-30 * DAY) },
    { id: 'tpl_2', tenantId: DEMO_TENANT_ID, name: 'New arrival', subject: 'New on the roaster', html: '<h1>New arrival</h1><p>Say hello to our latest lot.</p>', createdAt: iso(-50 * DAY), updatedAt: iso(-50 * DAY) },
  ];

  // ── Audit log ─────────────────────────────────────────────
  const auditDefs: [string, string, string | null, string, number, Record<string, any>][] = [
    ['publish', 'page', 'p_home', DEMO_USER_ID, -2 * HOUR, { title: 'Home' }],
    ['update', 'content_entry', 'e_art_2', 'u_maya', -5 * HOUR, { type: 'article' }],
    ['create', 'content_entry', 'e_art_5', 'u_jonas', -1 * DAY, { type: 'article' }],
    ['login', 'user', 'u_maya', 'u_maya', -1 * DAY - HOUR, {}],
    ['invite_sent', 'user', null, DEMO_USER_ID, -2 * DAY, { email: 'sam@meridian.example' }],
    ['update', 'product', 'prod_3', DEMO_USER_ID, -2 * DAY - 4 * HOUR, { field: 'inventoryQty' }],
    ['trash', 'content_entry', 'e_faq_3', 'u_jonas', -3 * DAY, { type: 'faq' }],
    ['restore', 'content_entry', 'e_faq_3', DEMO_USER_ID, -3 * DAY + HOUR, { type: 'faq' }],
    ['publish', 'content_entry', 'e_evt_1', 'u_maya', -4 * DAY, { type: 'event' }],
    ['delete', 'redirect', 'rd_9', DEMO_USER_ID, -5 * DAY, {}],
    ['create', 'webhook', 'wh_1', DEMO_USER_ID, -8 * DAY, {}],
    ['archive', 'content_entry', 'e_art_0', 'u_jonas', -9 * DAY, { type: 'article' }],
  ];
  const auditLogs = auditDefs.map(([action, resourceType, resourceId, userId, off, metadata], i) => {
    const u = users.find((x) => x.id === userId);
    return {
      id: `aud_${i + 1}`, tenantId: DEMO_TENANT_ID, userId, action, resourceType, resourceId, metadata,
      createdAt: iso(off), user: u ? { firstName: u.firstName, lastName: u.lastName, email: u.email } : null,
    };
  });

  // ── AI / agent history ────────────────────────────────────
  const contentChangeLog = [
    { id: 'cl_1', tenantId: DEMO_TENANT_ID, userId: DEMO_USER_ID, userEmail: 'demo@novuspulse.dev', pageId: 'p_home', pageTitle: 'Home', path: ['blocks', '1', 'props', 'heading'], label: 'Hero heading', oldValue: 'Coffee, roasted with care.', newValue: 'Coffee, roasted slowly.', source: 'portal', message: 'make the hero heading say roasted slowly', createdAt: iso(-3 * DAY) },
    { id: 'cl_2', tenantId: DEMO_TENANT_ID, userId: DEMO_USER_ID, userEmail: 'demo@novuspulse.dev', pageId: 'p_visit', pageTitle: 'Visit the Café', path: ['blocks', '1', 'props', 'body'], label: 'Opening hours', oldValue: 'Open daily 9:00–17:00.', newValue: 'Open daily 8:00–18:00.', source: 'whatsapp', message: 'we open at 8 now, close at 6', createdAt: iso(-7 * DAY) },
  ];
  const agentRuns = [
    { id: 'run_1', tenantId: DEMO_TENANT_ID, userId: DEMO_USER_ID, userEmail: 'demo@novuspulse.dev', mode: 'copilot', message: 'Draft a journal post announcing Sunday opening hours', status: 'completed', summary: 'Drafted “New roastery hours” and queued it for review.', error: null, inputTokens: 1240, outputTokens: 380, createdAt: iso(-1 * DAY), updatedAt: iso(-1 * DAY) },
  ];
  const agentActions = [
    { id: 'act_1', runId: 'run_1', tenantId: DEMO_TENANT_ID, toolName: 'create_content_entry', summary: 'Create article “New roastery hours”', input: { type: 'article', title: 'New roastery hours' }, status: 'applied', result: { id: 'e_art_4' }, error: null, decidedByUserId: DEMO_USER_ID, createdAt: iso(-1 * DAY), updatedAt: iso(-1 * DAY) },
  ];

  // ── Analytics base numbers (daily views are generated on request) ──
  const analytics = {
    topPages: [
      { slug: 'home', weight: 38 }, { slug: 'shop', weight: 24 }, { slug: 'shop/ethiopia-guji', weight: 12 },
      { slug: 'journal/beginners-guide-to-pour-over', weight: 9 }, { slug: 'visit', weight: 8 }, { slug: 'about', weight: 5 },
    ],
  };

  return {
    version: DEMO_VERSION,
    tenant, users, invites, folders, media, products, pages, pageRevisions, menus, submissions,
    contentTypes, contentEntries, contentPermissions, webhooks, apiKeys, redirects,
    resources, availabilityRules, reservations, contacts, contactNotes, campaigns, emailTemplates,
    auditLogs, contentChangeLog, agentRuns, agentActions, analytics,
    siteSchema: null,
  };
}
