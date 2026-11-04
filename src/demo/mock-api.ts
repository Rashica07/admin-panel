/* eslint-disable @typescript-eslint/no-explicit-any -- the demo store holds schemaless JSON records that mirror API payloads; typing every shape would duplicate the SDK types without adding safety to a demo-only fake. */
/**
 * In-browser fake of the Novus Pulse REST API.
 *
 * `installDemoApi()` patches `window.fetch` so every request the dashboard
 * makes to `/api/v1/*` (SDK + raw fetches) or to the same-origin proxy routes
 * (`/api/content/*`, `/api/teams/*`, `/api/audit/*`) is answered locally from
 * a localStorage-backed dataset. No server, no database, no network.
 *
 * Mutations persist per visitor (localStorage), so every visitor gets their
 * own sandbox they can freely break — "Reset demo" restores the seed.
 */
import {
  buildSeed,
  DEMO_TENANT_ID,
  DEMO_USER_ID,
  DEMO_VERSION,
  svgImage,
  uid,
  type DemoDb,
} from './seed';

const STORAGE_KEY = 'novus-demo-db';
const LATENCY_MS = 140;

// ─────────────────────────────────────────────────────────────
// Storage
// ─────────────────────────────────────────────────────────────
let db: DemoDb | null = null;

function getDb(): DemoDb {
  if (db) return db;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.version === DEMO_VERSION) db = parsed;
    }
  } catch {
    /* storage unavailable — fall back to in-memory */
  }
  if (!db) db = buildSeed();
  return db;
}

function persist() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    /* quota / private mode — keep working in memory */
  }
}

export function resetDemoData() {
  db = null;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

// ─────────────────────────────────────────────────────────────
// Tiny router
// ─────────────────────────────────────────────────────────────
class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
const NO_CONTENT = Symbol('no-content');

type Req = { method: string; path: string; query: URLSearchParams; body: any; isForm: boolean };
type Handler = (m: RegExpMatchArray, r: Req) => unknown;

const routes: { method: string; re: RegExp; handler: Handler }[] = [];
function route(method: string, pattern: string, handler: Handler) {
  routes.push({ method, re: new RegExp(`^${pattern}/?$`), handler });
}
const notFound = (what = 'Resource') => new ApiError(404, `${what} not found`);
const now = () => new Date().toISOString();
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
const slugify = (s: string) =>
  s.toString().toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

function audit(action: string, resourceType: string, resourceId: string | null, metadata: Record<string, any> = {}) {
  const d = getDb();
  const u = d.users[0];
  d.auditLogs.unshift({
    id: uid('aud'), tenantId: DEMO_TENANT_ID, userId: u.id, action, resourceType, resourceId, metadata,
    createdAt: now(), user: { firstName: u.firstName, lastName: u.lastName, email: u.email },
  });
  d.auditLogs = d.auditLogs.slice(0, 200);
}

/** Generic CRUD for a flat collection. */
function crud(
  base: string,
  key: string,
  opts: {
    create?: (body: any) => any;
    afterWrite?: (action: 'create' | 'update' | 'delete', item: any) => void;
    resource?: string;
    list?: (items: any[], r: Req) => unknown;
  } = {},
) {
  const resourceType = opts.resource ?? key;
  route('GET', base, (_m, r) => {
    const items = getDb()[key] as any[];
    return opts.list ? opts.list(items, r) : items;
  });
  route('GET', `${base}/([^/]+)`, (m) => {
    const item = (getDb()[key] as any[]).find((x) => x.id === m[1]);
    if (!item) throw notFound(resourceType);
    return item;
  });
  route('POST', base, (_m, r) => {
    const item = {
      id: uid(key.slice(0, 4)), tenantId: DEMO_TENANT_ID, createdAt: now(), updatedAt: now(),
      ...(opts.create ? opts.create(r.body) : r.body),
    };
    (getDb()[key] as any[]).unshift(item);
    audit('create', resourceType, item.id);
    opts.afterWrite?.('create', item);
    return item;
  });
  const update: Handler = (m, r) => {
    const item = (getDb()[key] as any[]).find((x) => x.id === m[1]);
    if (!item) throw notFound(resourceType);
    Object.assign(item, r.body, { updatedAt: now() });
    audit('update', resourceType, item.id);
    opts.afterWrite?.('update', item);
    return item;
  };
  route('PUT', `${base}/([^/]+)`, update);
  route('PATCH', `${base}/([^/]+)`, update);
  route('DELETE', `${base}/([^/]+)`, (m) => {
    const d = getDb();
    const idx = (d[key] as any[]).findIndex((x) => x.id === m[1]);
    if (idx < 0) throw notFound(resourceType);
    const [removed] = (d[key] as any[]).splice(idx, 1);
    audit('delete', resourceType, removed.id);
    opts.afterWrite?.('delete', removed);
    return NO_CONTENT;
  });
}

// ─────────────────────────────────────────────────────────────
// Auth / users
// ─────────────────────────────────────────────────────────────
const tokens = () => ({ accessToken: 'demo-access-token', refreshToken: 'demo-refresh-token' });
const publicUser = () => {
  const d = getDb();
  return { ...d.users[0], plan: d.tenant.plan, tenantSlug: d.tenant.slug, status: 'active' };
};

route('POST', '/auth/login', () => ({ ...tokens(), user: publicUser() }));
route('POST', '/auth/register', (_m, r) => ({
  user: { ...getDb().users[0], email: r.body?.email ?? getDb().users[0].email },
  tenant: getDb().tenant,
  verificationRequired: false,
}));
route('POST', '/auth/refresh', () => tokens());
route('POST', '/auth/logout', () => NO_CONTENT);
route('POST', '/auth/forgot-password', () => ({ message: 'If that account exists, a reset link is on its way. (Demo — no email is sent.)' }));
route('POST', '/auth/reset-password', () => ({ message: 'Password updated. (Demo)' }));
route('GET', '/users/me', () => publicUser());
route('GET', '/users', () => getDb().users);
route('GET', '/users/([^/]+)', (m) => getDb().users.find((u: any) => u.id === m[1]) ?? (() => { throw notFound('User'); })());
route('PUT', '/users/([^/]+)', (m, r) => {
  const u = getDb().users.find((x: any) => x.id === m[1]);
  if (!u) throw notFound('User');
  const { password: _pw, ...rest } = r.body ?? {};
  Object.assign(u, rest, { updatedAt: now() });
  return u;
});

// ─────────────────────────────────────────────────────────────
// Tenants
// ─────────────────────────────────────────────────────────────
const tenant = () => getDb().tenant;
route('GET', '/tenants', () => [tenant()]);
route('GET', '/tenants/me', () => tenant());
route('GET', '/tenants/me/site-info', () => ({ siteUrl: tenant().siteUrl, source: tenant().siteUrl ? 'configured' : 'none' }));
route('PUT', '/tenants/me/theme', (_m, r) => { tenant().theme = r.body?.theme ?? null; tenant().updatedAt = now(); return tenant(); });
route('PUT', '/tenants/me/modules', (_m, r) => { tenant().enabledModules = r.body?.enabledModules ?? null; tenant().updatedAt = now(); return tenant(); });
route('PUT', '/tenants/me/settings', (_m, r) => {
  tenant().settings = { ...(tenant().settings ?? {}), ...(r.body?.settings ?? {}) };
  tenant().updatedAt = now();
  return tenant();
});
route('PUT', '/tenants/me/site', (_m, r) => { Object.assign(tenant(), r.body ?? {}, { updatedAt: now() }); return tenant(); });
route('POST', '/tenants/me/site/test', () => ({ ok: true, status: 200, siteUrl: tenant().siteUrl, source: 'configured' }));
route('GET', '/tenants/me/site/secret', () => ({ revalidateSecret: tenant().revalidateSecret }));
route('GET', '/tenants/([^/]+)', () => tenant());
route('POST', '/tenants', (_m, r) => ({ ...tenant(), ...r.body, id: uid('tenant') }));
route('PUT', '/tenants/([^/]+)/theme', (_m, r) => { tenant().theme = r.body?.theme ?? null; return tenant(); });
route('PUT', '/tenants/([^/]+)/transfer-ownership', () => tenant());
route('POST', '/tenants/([^/]+)/impersonate', () => ({ accessToken: 'demo-access-token' }));
route('POST', '/tenants/([^/]+)/approve-cash', () => tenant());
route('PUT', '/tenants/([^/]+)', (_m, r) => { Object.assign(tenant(), r.body ?? {}, { updatedAt: now() }); return tenant(); });
route('DELETE', '/tenants/([^/]+)', () => NO_CONTENT);
route('GET', '/public/([^/]+)/theme', () => ({ theme: tenant().theme }));
route('POST', '/payments/mock-checkout', (_m, r) => {
  if (r.body?.plan) tenant().plan = r.body.plan;
  return { ok: true, status: 'active', plan: tenant().plan };
});
route('POST', '/payments/approve/([^/]+)', () => ({ ok: true }));
route('GET', '/payments/deny/([^/]+)', () => ({ ok: true }));

// ─────────────────────────────────────────────────────────────
// Pages + revisions
// ─────────────────────────────────────────────────────────────
route('GET', '/pages', (_m, r) => {
  const type = r.query.get('type');
  const pages = getDb().pages as any[];
  return type ? pages.filter((p) => p.type === type) : pages;
});
route('GET', '/pages/([^/]+)', (m) => getDb().pages.find((p: any) => p.id === m[1]) ?? (() => { throw notFound('Page'); })());
route('POST', '/pages', (_m, r) => {
  const b = r.body ?? {};
  const page = {
    id: uid('page'), tenantId: DEMO_TENANT_ID, title: b.title ?? 'Untitled', slug: b.slug || slugify(b.title ?? 'untitled'),
    type: b.type ?? 'page', content: b.content ?? {}, published: b.published ?? false, createdAt: now(), updatedAt: now(),
  };
  getDb().pages.unshift(page);
  audit('create', 'page', page.id, { title: page.title });
  return page;
});
route('PUT', '/pages/([^/]+)', (m, r) => {
  const d = getDb();
  const page = d.pages.find((p: any) => p.id === m[1]);
  if (!page) throw notFound('Page');
  d.pageRevisions.unshift({ ...clone(page), id: uid('rev'), pageId: page.id, changedBy: DEMO_USER_ID, createdAt: now() });
  d.pageRevisions = d.pageRevisions.slice(0, 100);
  Object.assign(page, r.body, { updatedAt: now() });
  audit(r.body?.published === true ? 'publish' : 'update', 'page', page.id, { title: page.title });
  return page;
});
route('DELETE', '/pages/([^/]+)', (m) => {
  const d = getDb();
  d.pages = d.pages.filter((p: any) => p.id !== m[1]);
  audit('delete', 'page', m[1]);
  return NO_CONTENT;
});
route('GET', '/pages/([^/]+)/revisions', (m) =>
  getDb().pageRevisions.filter((x: any) => x.pageId === m[1]).map(({ content: _c, ...rest }: any) => rest));
route('GET', '/pages/([^/]+)/revisions/([^/]+)', (m) =>
  getDb().pageRevisions.find((x: any) => x.id === m[2] && x.pageId === m[1]) ?? (() => { throw notFound('Revision'); })());
route('POST', '/pages/([^/]+)/revisions/([^/]+)/restore', (m) => {
  const d = getDb();
  const rev = d.pageRevisions.find((x: any) => x.id === m[2]);
  const page = d.pages.find((p: any) => p.id === m[1]);
  if (!rev || !page) throw notFound('Revision');
  d.pageRevisions.unshift({ ...clone(page), id: uid('rev'), pageId: page.id, changedBy: DEMO_USER_ID, createdAt: now() });
  Object.assign(page, { title: rev.title, slug: rev.slug, type: rev.type, content: clone(rev.content), published: rev.published, updatedAt: now() });
  return page;
});

// ─────────────────────────────────────────────────────────────
// Products / menus / redirects / webhooks / templates (flat CRUD)
// ─────────────────────────────────────────────────────────────
crud('/products', 'products', { create: (b) => ({ slug: slugify(b.title ?? 'product'), status: 'draft', images: [], inventoryQty: 0, compareAtPrice: null, description: null, ...b }) });
crud('/menus', 'menus', { create: (b) => ({ slug: slugify(b.name ?? 'menu'), items: [], ...b }) });
crud('/redirects', 'redirects', { create: (b) => ({ statusCode: 301, active: true, hits: 0, ...b }) });
crud('/webhooks', 'webhooks', {
  create: (b) => ({ active: true, secret: null, lastTriggeredAt: null, lastStatus: null, events: [], ...b }),
});
route('GET', '/webhooks/api-keys/list', () => getDb().apiKeys.filter((k: any) => !k.revokedAt));
route('POST', '/webhooks/api-keys', (_m, r) => {
  const secret = `np_live_${uid('').slice(1)}${uid('').slice(1)}`;
  const key = { id: uid('key'), tenantId: DEMO_TENANT_ID, name: r.body?.name ?? 'New key', keyHash: '•', prefix: secret.slice(0, 12), lastUsedAt: null, revokedAt: null, createdAt: now() };
  getDb().apiKeys.unshift(key);
  audit('create', 'api_key', key.id);
  return { ...key, key: secret, apiKey: secret, secret };
});
route('DELETE', '/webhooks/api-keys/([^/]+)', (m) => {
  const k = getDb().apiKeys.find((x: any) => x.id === m[1]);
  if (k) k.revokedAt = now();
  return NO_CONTENT;
});

// ─────────────────────────────────────────────────────────────
// Media
// ─────────────────────────────────────────────────────────────
const PALETTE: [string, string][] = [['#7c2d12', '#fb923c'], ['#1e3a8a', '#60a5fa'], ['#14532d', '#4ade80'], ['#581c87', '#c084fc'], ['#831843', '#f472b6'], ['#134e4a', '#2dd4bf']];
route('GET', '/media/folders', (_m, r) => {
  const parent = r.query.get('parentId');
  return (getDb().folders as any[]).filter((f) => (parent ? f.parentId === parent : f.parentId === null));
});
route('POST', '/media/folders', (_m, r) => {
  const f = { id: uid('f'), tenantId: DEMO_TENANT_ID, name: r.body?.name ?? 'New folder', parentId: r.body?.parentId ?? null, createdAt: now(), updatedAt: now() };
  getDb().folders.push(f);
  return f;
});
route('DELETE', '/media/folders/([^/]+)', (m) => {
  const d = getDb();
  d.folders = d.folders.filter((f: any) => f.id !== m[1]);
  d.media.forEach((x: any) => { if (x.folderId === m[1]) x.folderId = null; });
  return NO_CONTENT;
});
route('GET', '/media/site-files', () => ({ available: false, siteUrl: tenant().siteUrl, files: [] }));
route('GET', '/media', (_m, r) => {
  const folder = r.query.get('folderId');
  const all = (getDb().media as any[]).filter((x) => (folder ? x.folderId === folder : true));
  const limit = Number(r.query.get('limit') ?? 100);
  const offset = Number(r.query.get('offset') ?? 0);
  return { items: all.slice(offset, offset + limit), total: all.length, limit, offset };
});
route('GET', '/media/([^/]+)', (m) => getDb().media.find((x: any) => x.id === m[1]) ?? (() => { throw notFound('Media'); })());
route('POST', '/media/upload', (_m, r) => {
  const form = r.body as FormData;
  const file = form?.get?.('file') as File | null;
  const filename = file?.name ?? 'upload.jpg';
  const [a, b] = PALETTE[getDb().media.length % PALETTE.length];
  const item = {
    id: uid('m'), tenantId: DEMO_TENANT_ID, folderId: (form?.get?.('folderId') as string) || null,
    url: svgImage(filename.replace(/\.[^.]+$/, '').slice(0, 18), a, b), filename, mimeType: file?.type || 'image/jpeg',
    size: file?.size ?? 240_000, uploadedBy: DEMO_USER_ID, altText: (form?.get?.('altText') as string) || '',
    caption: (form?.get?.('caption') as string) || '', focalX: null, focalY: null, provider: 'local', createdAt: now(),
  };
  getDb().media.unshift(item);
  audit('create', 'media', item.id);
  return item;
});
route('POST', '/media', (_m, r) => {
  const item = { id: uid('m'), tenantId: DEMO_TENANT_ID, folderId: null, mimeType: 'image/jpeg', uploadedBy: DEMO_USER_ID, altText: '', caption: '', focalX: null, focalY: null, provider: 'external', createdAt: now(), ...r.body };
  getDb().media.unshift(item);
  return item;
});
route('PUT', '/media/([^/]+)', (m, r) => {
  const item = getDb().media.find((x: any) => x.id === m[1]);
  if (!item) throw notFound('Media');
  Object.assign(item, r.body);
  return item;
});
route('DELETE', '/media/([^/]+)', (m) => {
  const d = getDb();
  d.media = d.media.filter((x: any) => x.id !== m[1]);
  return NO_CONTENT;
});

// ─────────────────────────────────────────────────────────────
// Forms
// ─────────────────────────────────────────────────────────────
route('GET', '/forms/submissions', (_m, r) => {
  const form = r.query.get('formName');
  const all = (getDb().submissions as any[]).filter((s) => (form ? s.formName === form : true));
  const limit = r.query.get('limit') ? Number(r.query.get('limit')) : all.length;
  const offset = Number(r.query.get('offset') ?? 0);
  return all.slice(offset, offset + limit);
});
route('PUT', '/forms/submissions/([^/]+)/read', (m, r) => {
  const s = getDb().submissions.find((x: any) => x.id === m[1]);
  if (!s) throw notFound('Submission');
  s.read = r.body?.read ?? true;
  return s;
});
route('DELETE', '/forms/submissions/([^/]+)', (m) => {
  const d = getDb();
  d.submissions = d.submissions.filter((x: any) => x.id !== m[1]);
  return NO_CONTENT;
});
route('POST', '/public/([^/]+)/submissions', (_m, r) => {
  const s = { id: uid('sub'), tenantId: DEMO_TENANT_ID, formName: r.body?.formName ?? 'Contact', data: r.body?.data ?? {}, read: false, createdAt: now() };
  getDb().submissions.unshift(s);
  return s;
});

// ─────────────────────────────────────────────────────────────
// Analytics
// ─────────────────────────────────────────────────────────────
function seededRand(seed: number) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
}
route('GET', '/analytics/stats', (_m, r) => {
  const days = Math.min(Math.max(Number(r.query.get('days') ?? 30), 1), 365);
  const rand = seededRand(42);
  const dailyViews: { date: string; views: number }[] = [];
  let total = 0;
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000);
    const weekend = [0, 6].includes(d.getDay());
    const trend = 1 + (days - i) / (days * 3);
    const views = Math.round((90 + rand() * 70) * (weekend ? 0.7 : 1) * trend);
    total += views;
    dailyViews.push({ date: d.toISOString().slice(0, 10), views });
  }
  const weights = getDb().analytics.topPages as { slug: string; weight: number }[];
  const wsum = weights.reduce((a, b) => a + b.weight, 0);
  const share = (n: number, weight: number, sum: number) => Math.round((n * weight) / sum);
  return {
    totalViews: total,
    uniqueVisitors: Math.round(total * 0.58),
    topPages: weights.map((w) => ({ slug: w.slug, views: share(total, w.weight, wsum) })),
    dailyViews,
    devices: [{ device: 'desktop', count: share(total, 52, 100) }, { device: 'mobile', count: share(total, 41, 100) }, { device: 'tablet', count: share(total, 7, 100) }],
    browsers: [{ browser: 'Chrome', count: share(total, 54, 100) }, { browser: 'Safari', count: share(total, 29, 100) }, { browser: 'Firefox', count: share(total, 9, 100) }, { browser: 'Edge', count: share(total, 8, 100) }],
    referrers: [{ referrer: 'direct', count: share(total, 40, 100) }, { referrer: 'google.com', count: share(total, 33, 100) }, { referrer: 'instagram.com', count: share(total, 17, 100) }, { referrer: 'newsletter', count: share(total, 10, 100) }],
  };
});
route('POST', '/public/([^/]+)/analytics', () => NO_CONTENT);
route('POST', '/public/ping', () => ({ ok: true }));
route('GET', '/audit', (_m, r) => {
  const limit = Number(r.query.get('limit') ?? 50);
  const offset = Number(r.query.get('offset') ?? 0);
  return (getDb().auditLogs as any[]).slice(offset, offset + limit);
});

// ─────────────────────────────────────────────────────────────
// Structured content (types, fields, entries, search, stats, permissions)
// ─────────────────────────────────────────────────────────────
const findType = (apiId: string) => {
  const t = (getDb().contentTypes as any[]).find((x) => x.apiId === apiId);
  if (!t) throw notFound('Content type');
  return t;
};
const typeEntries = (typeApiId: string) => (getDb().contentEntries as any[]).filter((e) => e.typeApiId === typeApiId);

route('GET', '/content/types', () => getDb().contentTypes);
route('GET', '/content/types/([^/]+)', (m) => findType(m[1]));
route('POST', '/content/types', (_m, r) => {
  const b = r.body ?? {};
  const apiId = b.apiId || slugify(b.name ?? 'type');
  if ((getDb().contentTypes as any[]).some((t) => t.apiId === apiId)) throw new ApiError(409, `A content type with apiId "${apiId}" already exists`);
  const t = { id: uid('ct'), tenantId: DEMO_TENANT_ID, name: b.name ?? apiId, apiId, description: b.description ?? '', icon: b.icon ?? 'file-text', kind: b.kind ?? 'collection', fields: [], createdAt: now(), updatedAt: now() };
  getDb().contentTypes.push(t);
  audit('create', 'content_type', t.id);
  return t;
});
route('PUT', '/content/types/([^/]+)', (m, r) => { const t = findType(m[1]); Object.assign(t, r.body, { updatedAt: now() }); return t; });
route('DELETE', '/content/types/([^/]+)', (m) => {
  const d = getDb();
  d.contentTypes = d.contentTypes.filter((t: any) => t.apiId !== m[1]);
  d.contentEntries = d.contentEntries.filter((e: any) => e.typeApiId !== m[1]);
  return NO_CONTENT;
});
route('POST', '/content/types/([^/]+)/fields', (m, r) => {
  const t = findType(m[1]);
  const b = r.body ?? {};
  const apiId = b.apiId || slugify(b.label ?? 'field').replace(/-/g, '_');
  if (t.fields.some((f: any) => f.apiId === apiId)) throw new ApiError(409, `Field "${apiId}" already exists`);
  const field = { id: uid('fld'), tenantId: DEMO_TENANT_ID, contentTypeId: t.id, apiId, label: b.label ?? apiId, type: b.type ?? 'text', required: !!b.required, config: b.config ?? {}, position: t.fields.length };
  t.fields.push(field);
  t.updatedAt = now();
  return field;
});
route('PUT', '/content/types/([^/]+)/fields/([^/]+)', (m, r) => {
  const t = findType(m[1]);
  const f = t.fields.find((x: any) => x.apiId === m[2]);
  if (!f) throw notFound('Field');
  Object.assign(f, r.body);
  return f;
});
route('DELETE', '/content/types/([^/]+)/fields/([^/]+)', (m) => {
  const t = findType(m[1]);
  t.fields = t.fields.filter((x: any) => x.apiId !== m[2]);
  return NO_CONTENT;
});

route('GET', '/content/entries/([^/]+)', (m, r) => {
  findType(m[1]);
  const includeTrashed = r.query.get('includeTrashed') === 'true';
  return typeEntries(m[1]).filter((e) => includeTrashed || !e.deletedAt).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
});
route('GET', '/content/entries/([^/]+)/([^/]+)', (m) => {
  const e = typeEntries(m[1]).find((x) => x.id === m[2]);
  if (!e) throw notFound('Entry');
  return e;
});
route('POST', '/content/entries/([^/]+)/bulk', (m, r) => {
  const { ids = [], action } = r.body ?? {};
  let count = 0;
  for (const e of typeEntries(m[1])) {
    if (!ids.includes(e.id)) continue;
    count++;
    if (action === 'publish') { e.status = 'published'; e.publishedAt = now(); e.deletedAt = null; }
    if (action === 'archive') e.status = 'archived';
    if (action === 'trash') e.deletedAt = now();
    if (action === 'restore') e.deletedAt = null;
    e.updatedAt = now();
  }
  audit(action, 'content_entry', null, { type: m[1], count });
  return { affected: count, count };
});
route('POST', '/content/entries/([^/]+)', (m, r) => {
  const t = findType(m[1]);
  const b = r.body ?? {};
  const status = b.status ?? 'draft';
  const e = {
    id: uid('e'), tenantId: DEMO_TENANT_ID, contentTypeId: t.id, typeApiId: m[1], slug: b.slug || slugify(String(b.data?.title ?? b.data?.name ?? 'entry')) || uid('entry'),
    locale: b.locale ?? 'en', status, data: b.data ?? {}, seo: b.seo ?? {}, scheduledAt: b.scheduledAt ?? null,
    publishedAt: status === 'published' ? now() : null, createdBy: DEMO_USER_ID, createdAt: now(), updatedAt: now(), deletedAt: null,
  };
  getDb().contentEntries.unshift(e);
  audit('create', 'content_entry', e.id, { type: m[1] });
  return e;
});
route('PUT', '/content/entries/([^/]+)/([^/]+)', (m, r) => {
  const e = typeEntries(m[1]).find((x) => x.id === m[2]);
  if (!e) throw notFound('Entry');
  const b = r.body ?? {};
  const wasPublished = e.status === 'published';
  Object.assign(e, b, { updatedAt: now() });
  if (e.status === 'published' && !wasPublished) { e.publishedAt = now(); audit('publish', 'content_entry', e.id, { type: m[1] }); }
  else audit('update', 'content_entry', e.id, { type: m[1] });
  return e;
});
route('DELETE', '/content/entries/([^/]+)/([^/]+)', (m) => {
  const e = typeEntries(m[1]).find((x) => x.id === m[2]);
  if (!e) throw notFound('Entry');
  if (e.deletedAt) getDb().contentEntries = getDb().contentEntries.filter((x: any) => x.id !== m[2]); // second delete = purge
  else e.deletedAt = now();
  audit('trash', 'content_entry', m[2], { type: m[1] });
  return NO_CONTENT;
});
route('POST', '/content/entries/([^/]+)/([^/]+)/duplicate', (m) => {
  const e = typeEntries(m[1]).find((x) => x.id === m[2]);
  if (!e) throw notFound('Entry');
  const copy = { ...clone(e), id: uid('e'), slug: `${e.slug}-copy`, status: 'draft', publishedAt: null, createdAt: now(), updatedAt: now(), deletedAt: null };
  getDb().contentEntries.unshift(copy);
  return copy;
});
route('POST', '/content/entries/([^/]+)/([^/]+)/restore', (m) => {
  const e = typeEntries(m[1]).find((x) => x.id === m[2]);
  if (!e) throw notFound('Entry');
  e.deletedAt = null;
  return e;
});

route('GET', '/content/search', (_m, r) => {
  const q = (r.query.get('q') ?? '').toLowerCase().trim();
  const type = r.query.get('type');
  const limit = Number(r.query.get('limit') ?? 20);
  if (!q) return { items: [], total: 0 };
  const hits: any[] = [];
  for (const e of getDb().contentEntries as any[]) {
    if (e.deletedAt || (type && e.typeApiId !== type)) continue;
    const strings = Object.values(e.data ?? {}).filter((v) => typeof v === 'string') as string[];
    const hay = [e.slug, ...strings].join(' \n ');
    const idx = hay.toLowerCase().indexOf(q);
    if (idx < 0) continue;
    const plain = hay.replace(/<[^>]+>/g, ' ');
    const at = Math.max(plain.toLowerCase().indexOf(q) - 30, 0);
    const title = e.data?.title ?? e.data?.name ?? e.data?.question ?? e.slug;
    hits.push({ id: e.id, slug: e.slug, status: e.status, locale: e.locale, typeApiId: e.typeApiId, updatedAt: e.updatedAt, title, snippet: `${title} — …${plain.slice(at, at + 90).trim()}…` });
  }
  return { items: hits.slice(0, limit), total: hits.length };
});
route('GET', '/content/stats', () => {
  const d = getDb();
  const live = (d.contentEntries as any[]).filter((e) => !e.deletedAt);
  const types = (d.contentTypes as any[]).map((t) => {
    const es = live.filter((e) => e.typeApiId === t.apiId);
    return { apiId: t.apiId, name: t.name, icon: t.icon, entryCount: es.length, publishedCount: es.filter((e) => e.status === 'published').length, draftCount: es.filter((e) => e.status === 'draft').length };
  });
  return {
    types,
    totals: {
      entries: live.length, published: live.filter((e) => e.status === 'published').length,
      drafts: live.filter((e) => e.status === 'draft').length, scheduled: live.filter((e) => e.status === 'scheduled').length,
      trashed: (d.contentEntries as any[]).filter((e) => e.deletedAt).length,
    },
    recent: [...live].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 6)
      .map((e) => ({ id: e.id, slug: e.slug, status: e.status, locale: e.locale, typeApiId: e.typeApiId, updatedAt: e.updatedAt })),
  };
});
route('GET', '/content/permissions', (_m, r) => {
  const t = r.query.get('typeApiId');
  const all = getDb().contentPermissions as any[];
  if (!t) return all;
  const type = (getDb().contentTypes as any[]).find((x) => x.apiId === t);
  return all.filter((p) => p.contentTypeId === type?.id);
});
route('PUT', '/content/permissions/([^/]+)', (m, r) => {
  const type = findType(m[1]);
  const d = getDb();
  const { role, action, allowed } = r.body ?? {};
  let p = d.contentPermissions.find((x: any) => x.contentTypeId === type.id && x.role === role && x.action === action);
  if (p) { p.allowed = allowed; p.updatedAt = now(); }
  else { p = { id: uid('perm'), tenantId: DEMO_TENANT_ID, contentTypeId: type.id, role, action, allowed, createdAt: now(), updatedAt: now() }; d.contentPermissions.push(p); }
  return p;
});
route('DELETE', '/content/permissions/([^/]+)', (m) => {
  const d = getDb();
  d.contentPermissions = d.contentPermissions.filter((p: any) => p.id !== m[1]);
  return NO_CONTENT;
});

// ─────────────────────────────────────────────────────────────
// Teams
// ─────────────────────────────────────────────────────────────
route('GET', '/teams/members', () => getDb().users);
route('GET', '/teams/invites', () => (getDb().invites as any[]).map((i) => ({ ...i, token: i.token ?? 'demo-invite-token', inviter: { firstName: getDb().users[0].firstName, lastName: getDb().users[0].lastName } })));
route('POST', '/teams/invites', (_m, r) => {
  const inv = { id: uid('inv'), email: r.body?.email ?? 'new@example.com', role: r.body?.role ?? 'editor', status: 'pending', createdAt: now(), expiresAt: new Date(Date.now() + 7 * 86_400_000).toISOString() };
  getDb().invites.unshift(inv);
  audit('invite_sent', 'user', null, { email: inv.email });
  return inv;
});
route('POST', '/teams/invites/accept', () => ({ ok: true }));

// ─────────────────────────────────────────────────────────────
// Reservations
// ─────────────────────────────────────────────────────────────
crud('/reservations/resources', 'resources', { create: (b) => ({ kind: 'table', capacity: 2, active: true, ...b }) });
crud('/reservations/rules', 'availabilityRules', { resource: 'availability_rule', create: (b) => ({ slotMinutes: 30, durationMinutes: 60, active: true, ...b }) });
const availability: Handler = (_m, r) => {
  const date = r.query.get('date') ?? new Date().toISOString().slice(0, 10);
  const dow = new Date(`${date}T12:00:00`).getDay();
  const rule = (getDb().availabilityRules as any[]).find((x) => x.dayOfWeek === dow && x.active);
  if (!rule) return { date, slots: [] };
  const slots: { time: string; available: boolean }[] = [];
  const [oh, om] = rule.openTime.split(':').map(Number);
  const [ch, cm] = rule.closeTime.split(':').map(Number);
  for (let t = oh * 60 + om; t + rule.durationMinutes <= ch * 60 + cm; t += rule.slotMinutes) {
    const time = `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
    slots.push({ time, available: (t / rule.slotMinutes) % 4 !== 1 });
  }
  return { date, slots };
};
route('GET', '/reservations/availability', availability);
route('GET', '/reservations', (_m, r) => {
  const from = r.query.get('from'); const to = r.query.get('to'); const status = r.query.get('status');
  const resources = getDb().resources as any[];
  return (getDb().reservations as any[])
    .filter((x) => !x.deletedAt && (!from || x.startsAt >= from) && (!to || x.startsAt <= to) && (!status || x.status === status))
    .map((x) => ({ ...x, resource: resources.find((rs) => rs.id === x.resourceId) ?? null }))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
});
const createReservation: Handler = (_m, r) => {
  const b = r.body ?? {};
  const startsAt = b.startsAt ?? now();
  const res = {
    id: uid('rsv'), tenantId: DEMO_TENANT_ID, customerName: b.customerName ?? 'Guest', customerEmail: b.customerEmail ?? null, customerPhone: b.customerPhone ?? null,
    partySize: b.partySize ?? 2, startsAt, endsAt: b.endsAt ?? new Date(new Date(startsAt).getTime() + 3_600_000).toISOString(),
    status: b.status ?? 'confirmed', notes: b.notes ?? null, resourceId: b.resourceId ?? null, source: 'manual', createdBy: DEMO_USER_ID, contactId: null,
    createdAt: now(), updatedAt: now(), deletedAt: null,
  };
  getDb().reservations.push(res);
  audit('create', 'reservation', res.id);
  return res;
};
route('POST', '/reservations', createReservation);
route('PUT', '/reservations/([^/]+)', (m, r) => {
  const x = getDb().reservations.find((y: any) => y.id === m[1]);
  if (!x) throw notFound('Reservation');
  Object.assign(x, r.body, { updatedAt: now() });
  return x;
});
route('DELETE', '/reservations/([^/]+)', (m) => {
  const x = getDb().reservations.find((y: any) => y.id === m[1]);
  if (x) x.deletedAt = now();
  return NO_CONTENT;
});
route('GET', '/public/([^/]+)/availability', availability);
route('POST', '/public/([^/]+)/reservations', createReservation);

// ─────────────────────────────────────────────────────────────
// CRM
// ─────────────────────────────────────────────────────────────
route('GET', '/crm/contacts', (_m, r) => {
  const q = (r.query.get('q') ?? '').toLowerCase(); const stage = r.query.get('stage'); const tag = r.query.get('tag');
  const all = (getDb().contacts as any[]).filter((c) => !c.deletedAt
    && (!q || `${c.name} ${c.email ?? ''} ${c.company ?? ''}`.toLowerCase().includes(q))
    && (!stage || c.lifecycleStage === stage) && (!tag || c.tags.includes(tag)));
  const limit = Number(r.query.get('limit') ?? 50); const offset = Number(r.query.get('offset') ?? 0);
  return { items: all.slice(offset, offset + limit), total: all.length };
});
route('GET', '/crm/contacts/([^/]+)', (m) => {
  const d = getDb();
  const c = d.contacts.find((x: any) => x.id === m[1]);
  if (!c) throw notFound('Contact');
  const reservations = (d.reservations as any[]).filter((x) => x.contactId === c.id || (c.email && x.customerEmail === c.email))
    .map((x) => ({ id: x.id, customerName: x.customerName, startsAt: x.startsAt, status: x.status, partySize: x.partySize }));
  return { ...c, notes: (d.contactNotes as any[]).filter((n) => n.contactId === c.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), reservations };
});
route('POST', '/crm/contacts', (_m, r) => {
  const b = r.body ?? {};
  const c = { id: uid('c'), tenantId: DEMO_TENANT_ID, name: b.name ?? 'New contact', email: null, phone: null, company: null, lifecycleStage: 'lead', source: 'manual', tags: [], customFields: {}, ownerId: DEMO_USER_ID, lastContactedAt: null, unsubscribed: false, createdAt: now(), updatedAt: now(), deletedAt: null, ...b };
  getDb().contacts.unshift(c);
  audit('create', 'contact', c.id);
  return c;
});
route('PUT', '/crm/contacts/([^/]+)', (m, r) => {
  const c = getDb().contacts.find((x: any) => x.id === m[1]);
  if (!c) throw notFound('Contact');
  Object.assign(c, r.body, { updatedAt: now() });
  return c;
});
route('DELETE', '/crm/contacts/([^/]+)', (m) => {
  const c = getDb().contacts.find((x: any) => x.id === m[1]);
  if (c) c.deletedAt = now();
  return NO_CONTENT;
});
route('POST', '/crm/contacts/([^/]+)/notes', (m, r) => {
  const n = { id: uid('cn'), contactId: m[1], body: r.body?.body ?? '', authorId: DEMO_USER_ID, createdAt: now() };
  getDb().contactNotes.unshift(n);
  const c = getDb().contacts.find((x: any) => x.id === m[1]);
  if (c) c.lastContactedAt = now();
  return n;
});

// ─────────────────────────────────────────────────────────────
// Campaigns
// ─────────────────────────────────────────────────────────────
const audienceOf = (a: { stage?: string; tag?: string } = {}) =>
  (getDb().contacts as any[]).filter((c) => !c.deletedAt && !c.unsubscribed && c.email && (!a.stage || c.lifecycleStage === a.stage) && (!a.tag || c.tags.includes(a.tag)));
route('GET', '/campaigns/audience/preview', (_m, r) => {
  const list = audienceOf({ stage: r.query.get('stage') ?? undefined, tag: r.query.get('tag') ?? undefined });
  return { count: list.length, total: list.length, sample: list.slice(0, 5).map((c) => ({ id: c.id, name: c.name, email: c.email })) };
});
crud('/campaigns/templates', 'emailTemplates', { resource: 'email_template', create: (b) => ({ subject: '', html: '', ...b }) });
route('GET', '/campaigns', () => getDb().campaigns);
route('GET', '/campaigns/([^/]+)', (m) => {
  const c = getDb().campaigns.find((x: any) => x.id === m[1]);
  if (!c) throw notFound('Campaign');
  const recipients = c.status === 'sent'
    ? audienceOf(c.audience).slice(0, 8).map((ct: any, i: number) => ({ id: `rcp_${i}`, campaignId: c.id, contactId: ct.id, email: ct.email, status: 'sent', messageId: `msg_${i}`, error: null, sentAt: c.sentAt, createdAt: c.sentAt }))
    : [];
  return { ...c, recipients };
});
route('POST', '/campaigns', (_m, r) => {
  const c = { id: uid('camp'), tenantId: DEMO_TENANT_ID, name: 'Untitled campaign', subject: '', fromName: null, fromEmail: null, html: '', status: 'draft', audience: {}, scheduledAt: null, sentAt: null, stats: {}, lastError: null, createdBy: DEMO_USER_ID, createdAt: now(), updatedAt: now(), ...r.body };
  getDb().campaigns.unshift(c);
  return c;
});
route('PUT', '/campaigns/([^/]+)', (m, r) => {
  const c = getDb().campaigns.find((x: any) => x.id === m[1]);
  if (!c) throw notFound('Campaign');
  Object.assign(c, r.body, { updatedAt: now() });
  return c;
});
route('DELETE', '/campaigns/([^/]+)', (m) => {
  const d = getDb();
  d.campaigns = d.campaigns.filter((x: any) => x.id !== m[1]);
  return NO_CONTENT;
});
route('POST', '/campaigns/([^/]+)/send', (m) => {
  const c = getDb().campaigns.find((x: any) => x.id === m[1]);
  if (!c) throw notFound('Campaign');
  const n = audienceOf(c.audience).length;
  Object.assign(c, { status: 'sent', sentAt: now(), stats: { total: n, sent: n, failed: 0 }, updatedAt: now() });
  audit('update', 'campaign', c.id, { sent: n });
  return c;
});
route('POST', '/campaigns/([^/]+)/schedule', (m, r) => {
  const c = getDb().campaigns.find((x: any) => x.id === m[1]);
  if (!c) throw notFound('Campaign');
  Object.assign(c, { status: 'scheduled', scheduledAt: r.body?.scheduledAt ?? now(), updatedAt: now() });
  return c;
});

// ─────────────────────────────────────────────────────────────
// AI: content assistant, support chat, agent
// ─────────────────────────────────────────────────────────────
function firstHeroPage() {
  const home = (getDb().pages as any[]).find((p) => p.slug === 'home') ?? (getDb().pages as any[])[0];
  const idx = home?.content?.blocks?.findIndex((b: any) => b.type === 'hero');
  return { home, idx };
}
route('POST', '/content-ai/propose', (_m, r) => {
  const message: string = r.body?.message ?? '';
  const { home, idx } = firstHeroPage();
  const quoted = message.match(/["“'‘]([^"”'’]{2,80})["”'’]/)?.[1];
  const toMatch = message.match(/\b(?:to|say|says|into)\s+(.{3,60})$/i)?.[1]?.replace(/[.!]$/, '');
  const next = quoted ?? toMatch;
  if (!home || idx == null || idx < 0 || !next) {
    return { status: 'clarify', changes: [], clarifyingQuestion: 'What should the new text say? Try: “change the hero heading to \"Fresh beans, every week\"”.' };
  }
  return {
    status: 'diff', summary: `Update the hero heading on “${home.title}”.`,
    changes: [{ pageId: home.id, pageSlug: home.slug, pageTitle: home.title, path: ['blocks', String(idx), 'props', 'heading'], label: 'Hero heading', oldValue: home.content.blocks[idx].props?.heading ?? '', newValue: next }],
  };
});
route('POST', '/content-ai/apply', (_m, r) => {
  const d = getDb();
  const changes: any[] = r.body?.changes ?? [];
  for (const ch of changes) {
    const page = d.pages.find((p: any) => p.id === ch.pageId);
    if (!page) continue;
    let cursor: any = page.content;
    ch.path.slice(0, -1).forEach((seg: string) => { cursor = cursor?.[seg]; });
    if (cursor) cursor[ch.path[ch.path.length - 1]] = ch.newValue;
    page.updatedAt = now();
    d.contentChangeLog.unshift({ id: uid('cl'), tenantId: DEMO_TENANT_ID, userId: DEMO_USER_ID, userEmail: d.users[0].email, pageId: ch.pageId, pageTitle: ch.pageTitle, path: ch.path, label: ch.label, oldValue: ch.oldValue, newValue: ch.newValue, source: r.body?.source ?? 'portal', message: r.body?.message ?? null, createdAt: now() });
  }
  return { applied: changes.length, revalidated: true };
});
route('GET', '/content-ai/history', () => getDb().contentChangeLog);
route('POST', '/content-ai/support-chat', (_m, r) => {
  const q = String(r.body?.message ?? '').toLowerCase();
  const reply =
    q.includes('page') ? 'Open **Pages** in the sidebar, pick a page and use the Visual Editor to reorder sections and edit copy. Changes are saved as revisions you can restore.'
    : q.includes('product') ? 'Go to **Products**, hit “New product”, add a title, price and image, then set the status to Active to publish it.'
    : q.includes('media') || q.includes('image') ? 'The **Media** library holds your uploads. Drag files in, add alt text, and organise them into folders.'
    : 'I’m the demo support assistant — in the live product I’m backed by a real model. Try asking how to edit a page, add a product, or manage media.';
  return { reply };
});

// Demo agent: tiny intent matcher that turns plain-English asks into the same
// approve/reject action cards the real agent produces — and really applies them.
type Planned = { summary: string; actions: { toolName: string; summary: string; input: Record<string, any> }[] };

const latestUserText = (m: string) => {
  const i = m.lastIndexOf('Owner:');
  return (i >= 0 ? m.slice(i + 6) : m).trim();
};
const titleCase = (t: string) => t.replace(/\b\w/g, (c) => c.toUpperCase());

function planAgent(text: string): Planned {
  const d = getDb();
  const t = text.toLowerCase();

  if (/\b(list|show|what).*\bpages?\b/.test(t)) {
    const pages = (d.pages as any[]).filter((p) => p.type === 'page');
    return { summary: `You have ${pages.length} pages: ${pages.map((p) => `${p.title} (${p.published ? 'published' : 'draft'})`).join(', ')}.`, actions: [] };
  }
  if (/\b(list|show|what).*\bproducts?\b/.test(t)) {
    const ps = d.products as any[];
    return { summary: `Your catalog has ${ps.length} products: ${ps.map((p) => `${p.title} (€${p.price})`).join(', ')}.`, actions: [] };
  }
  if (/\bpublish\b/.test(t)) {
    const target = (d.pages as any[]).find((p) => t.includes(p.slug) || t.includes(String(p.title).toLowerCase())) ?? (t.includes('home') ? (d.pages as any[]).find((p) => p.slug === 'home') : null);
    if (target) return { summary: `I can publish “${target.title}”.`, actions: [{ toolName: 'publish_page', summary: `Publish page “${target.title}”`, input: { pageId: target.id } }] };
  }
  const create = t.match(/\b(?:create|make|add|write|draft|new)\s+(?:a\s+|an\s+|the\s+)?(?:new\s+)?(page|article|post|blog post|journal post)\b\s*(?:called|named|titled|about|for|:)?\s*(.*)$/i);
  if (create) {
    const kind = create[1].toLowerCase();
    const rawTitle = (create[2] || '').replace(/["“”.!?]+/g, '').trim();
    const title = titleCase(rawTitle || `Untitled ${kind}`);
    const isArticle = kind !== 'page';
    return {
      summary: `I can draft ${isArticle ? 'an article' : 'a page'} titled “${title}”. Approve to create it.`,
      actions: [{ toolName: isArticle ? 'create_content_entry' : 'create_page', summary: `Create ${isArticle ? 'article' : 'page'} “${title}” (draft)`, input: { title, slug: slugify(title) } }],
    };
  }
  return {
    summary: 'In this demo I can list your pages or products, publish a page (“publish my homepage”), or draft content (“create a page called Our Roasters”). The live product connects this to a real model.',
    actions: [],
  };
}

function applyAgentAction(a: any) {
  const d = getDb();
  if (a.toolName === 'create_page') {
    const page = { id: uid('page'), tenantId: DEMO_TENANT_ID, title: a.input.title, slug: a.input.slug, type: 'page', content: { blocks: [] }, published: false, createdAt: now(), updatedAt: now() };
    d.pages.unshift(page);
    audit('create', 'page', page.id, { title: page.title, via: 'agent' });
    return { id: page.id };
  }
  if (a.toolName === 'publish_page') {
    const p = (d.pages as any[]).find((x) => x.id === a.input.pageId);
    if (p) { p.published = true; p.updatedAt = now(); audit('publish', 'page', p.id, { via: 'agent' }); }
    return { id: a.input.pageId };
  }
  if (a.toolName === 'create_content_entry') {
    const type = (d.contentTypes as any[]).find((x) => x.apiId === 'article');
    if (!type) return { skipped: true };
    const e = { id: uid('e'), tenantId: DEMO_TENANT_ID, contentTypeId: type.id, typeApiId: 'article', slug: a.input.slug, locale: 'en', status: 'draft', data: { title: a.input.title, slug: a.input.slug, excerpt: '', body: '<p>Drafted by the agent.</p>' }, seo: {}, scheduledAt: null, publishedAt: null, createdBy: DEMO_USER_ID, createdAt: now(), updatedAt: now(), deletedAt: null };
    d.contentEntries.unshift(e);
    audit('create', 'content_entry', e.id, { type: 'article', via: 'agent' });
    return { id: e.id };
  }
  return { ok: true };
}

function runResult(run: any) {
  return { run, actions: (getDb().agentActions as any[]).filter((a) => a.runId === run.id) };
}
route('POST', '/agent/run', (_m, r) => {
  const d = getDb();
  const message = String(r.body?.message ?? '');
  const mode = r.body?.mode ?? 'copilot';
  const plan = planAgent(latestUserText(message));
  const run = { id: uid('run'), tenantId: DEMO_TENANT_ID, userId: DEMO_USER_ID, userEmail: d.users[0].email, mode, message: latestUserText(message), status: 'completed', summary: plan.summary, error: null, inputTokens: 900, outputTokens: 240, createdAt: now(), updatedAt: now() };
  d.agentRuns.unshift(run);
  for (const pa of plan.actions) {
    const auto = mode === 'autonomous';
    const action: any = { id: uid('act'), runId: run.id, tenantId: DEMO_TENANT_ID, toolName: pa.toolName, summary: pa.summary, input: pa.input, status: auto ? 'applied' : 'pending', result: null, error: null, decidedByUserId: auto ? DEMO_USER_ID : null, createdAt: now(), updatedAt: now() };
    if (auto) action.result = applyAgentAction(action);
    d.agentActions.unshift(action);
  }
  return runResult(run);
});
route('GET', '/agent/runs', () => getDb().agentRuns);
route('GET', '/agent/runs/([^/]+)', (m) => {
  const run = getDb().agentRuns.find((x: any) => x.id === m[1]);
  if (!run) throw notFound('Run');
  return runResult(run);
});
const decide = (status: 'applied' | 'rejected') => (m: RegExpMatchArray) => {
  const a = getDb().agentActions.find((x: any) => x.id === m[1]);
  if (!a) throw notFound('Action');
  Object.assign(a, { status, decidedByUserId: DEMO_USER_ID, updatedAt: now() });
  a.result = status === 'applied' ? applyAgentAction(a) : null;
  return a;
};
route('POST', '/agent/actions/([^/]+)/approve', decide('applied'));
route('POST', '/agent/actions/([^/]+)/reject', decide('rejected'));

// ─────────────────────────────────────────────────────────────
// Public content (headless delivery) — handy if a page previews it
// ─────────────────────────────────────────────────────────────
route('GET', '/public/([^/]+)/pages', (_m, r) => (getDb().pages as any[]).filter((p) => p.published && (!r.query.get('type') || p.type === r.query.get('type'))));
route('GET', '/products/public/([^/]+)', () => (getDb().products as any[]).filter((p) => p.status === 'active'));
route('GET', '/public/([^/]+)/menus/([^/]+)', (m) => (getDb().menus as any[]).find((x) => x.slug === m[2]) ?? (() => { throw notFound('Menu'); })());
route('GET', '/public/([^/]+)/redirects', () => getDb().redirects);

// ─────────────────────────────────────────────────────────────
// Dispatcher + fetch patch
// ─────────────────────────────────────────────────────────────
const json = (status: number, body: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/** Map a request URL onto an API path, or null when it isn't an API call we fake. */
function toApiPath(url: URL): string | null {
  const p = url.pathname;
  if (p.startsWith('/api/auth/') || p === '/api/auth') return null; // next-auth stays real
  if (p === '/api/v1' || p.startsWith('/api/v1/')) return p.slice('/api/v1'.length) || '/';
  const proxied = p.match(/^\/api\/(content|teams|audit)(\/.*)?$/);
  if (proxied) return `/${proxied[1]}${proxied[2] ?? ''}`;
  return null;
}

async function dispatch(method: string, path: string, url: URL, init?: RequestInit): Promise<Response> {
  let body: any;
  let isForm = false;
  if (init?.body instanceof FormData) { body = init.body; isForm = true; }
  else if (typeof init?.body === 'string' && init.body) { try { body = JSON.parse(init.body); } catch { body = undefined; } }

  if (path === '/' || path === '') return json(200, { ok: true, demo: true });

  const req: Req = { method, path, query: url.searchParams, body, isForm };
  for (const r of routes) {
    if (r.method !== method) continue;
    const m = path.match(r.re);
    if (!m) continue;
    try {
      const out = r.handler(m, req);
      persist();
      if (out === NO_CONTENT) return new Response(null, { status: 204 });
      return json(method === 'POST' ? 201 : 200, out);
    } catch (e) {
      if (e instanceof ApiError) return json(e.status, { statusCode: e.status, message: e.message, error: e.status === 404 ? 'Not Found' : 'Error' });
      console.error('[demo-api] handler error', method, path, e);
      return json(500, { statusCode: 500, message: 'Demo API error', error: 'Internal Server Error' });
    }
  }
  console.warn('[demo-api] unhandled', method, path);
  return json(404, { statusCode: 404, message: `Demo API: no handler for ${method} ${path}`, error: 'Not Found' });
}

let installed = false;
export function installDemoApi() {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  const realFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      const req = input instanceof Request ? input : null;
      const url = new URL(req ? req.url : String(input), window.location.origin);
      const path = toApiPath(url);
      if (path === null) return realFetch(input as any, init);
      const method = (init?.method ?? req?.method ?? 'GET').toUpperCase();
      await new Promise((r) => setTimeout(r, LATENCY_MS));
      return await dispatch(method, path, url, init ?? (req ? { body: await req.clone().text() } : undefined));
    } catch (e) {
      console.error('[demo-api] fetch patch error', e);
      return realFetch(input as any, init);
    }
  };
}

export const DEMO_FLAG = process.env.NEXT_PUBLIC_DEMO_MODE !== 'false';
