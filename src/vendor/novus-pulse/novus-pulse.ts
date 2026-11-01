import {
  NovusPulseConfig,
  AuthTokens,
  RegisterInput,
  LoginInput,
  RegisterResponse,
  LoginResponse,
  User,
  UpdateUserInput,
  Tenant,
  CreateTenantInput,
  UpdateTenantInput,
  Page,
  CreatePageInput,
  UpdatePageInput,
  PageRevision,
  Photo,
  CreatePhotoInput,
  UpdatePhotoInput,
  SiteFilesResult,
  ProposedContentChange,
  ProposeContentResult,
  ApplyContentResult,
  ContentChangeLogEntry,
  NovusPulseError,
  NovusPulseErrorData,
} from './types';
import { io, Socket } from 'socket.io-client';

/**
 * NovusPulse — Lightweight TypeScript client for the Novus Pulse API.
 *
 * Works in: Next.js, React, React Native, Node.js 18+, vanilla browser JS.
 * Zero dependencies — uses native `fetch` (available everywhere since Node 18).
 *
 * Usage:
 * ```ts
 * import { NovusPulse } from '@rashica07/novus-pulse';
 *
 * const pulse = new NovusPulse({
 *   baseUrl: 'https://api.novuspulse.dev',
 *   onTokenRefresh: (tokens) => {
 *     localStorage.setItem('accessToken', tokens.accessToken);
 *     localStorage.setItem('refreshToken', tokens.refreshToken);
 *   },
 * });
 *
 * // Login
 * const { user } = await pulse.login({ email: '...', password: '...' });
 *
 * // Fetch pages (automatically scoped to user's tenant)
 * const pages = await pulse.getPages();
 *
 * // Fetch public pages (no auth needed)
 * const publicPages = await pulse.getPublicPages('barcelona-cafe');
 * ```
 */
export class NovusPulse {
  private readonly baseUrl: string;
  private readonly apiPrefix = '/api/v1';
  private accessToken: string | null;
  private refreshToken: string | null;
  private readonly onTokenRefresh?: (tokens: AuthTokens) => void;
  private readonly onAuthError?: (error: NovusPulseError) => void;
  private readonly fetchFn: typeof globalThis.fetch;
  private isRefreshing = false;
  private refreshPromise: Promise<AuthTokens> | null = null;
  private readonly autoConnectSocket: boolean;
  private readonly debug: boolean;
  private tenantId: string | null = null;
  private socket: Socket | null = null;
  /** Tenant slugs this client wants public (unauthenticated) realtime updates for. */
  private readonly publicSubscriptions = new Set<string>();
  /**
   * Registered realtime handlers. Kept here (not only on the socket) so they
   * survive socket re-creation — e.g. handlers added before login(), or when
   * the socket reconnects with a new token.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly eventHandlers = new Map<string, Set<(...args: any[]) => void>>();

  constructor(config: NovusPulseConfig) {
    // Strip trailing slash from baseUrl
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.accessToken = config.accessToken ?? null;
    this.refreshToken = config.refreshToken ?? null;
    this.onTokenRefresh = config.onTokenRefresh;
    this.onAuthError = config.onAuthError;
    this.fetchFn = config.fetch ?? globalThis.fetch.bind(globalThis);
    this.autoConnectSocket = config.autoConnectSocket ?? true;
    this.debug = config.debug ?? false;
    this.tenantId = config.tenantId ?? null;

    if (this.accessToken && this.autoConnectSocket) {
      this.connectSocket();
    }
  }

  // ════════════════════════════════════════════════════════
  // AUTH
  // ════════════════════════════════════════════════════════

  /**
   * Register a new tenant and owner account.
   * Automatically stores tokens after registration.
   */
  async register(input: RegisterInput): Promise<RegisterResponse> {
    // Registration does NOT log you in: the backend withholds session tokens
    // until email verification + workspace approval. Callers should route to a
    // "verify your email" screen and then to /login.
    return this.request<RegisterResponse>('POST', '/auth/register', input, {
      skipAuth: true,
    });
  }

  /**
   * Login with email and password.
   * Automatically stores tokens after login.
   */
  async login(input: LoginInput): Promise<LoginResponse> {
    const data = await this.request<LoginResponse>('POST', '/auth/login', input, {
      skipAuth: true,
    });
    this.setTokens(data);
    return data;
  }

  /**
   * Refresh tokens using the stored refresh token.
   * Called automatically when a request gets a 401 — you rarely need to call this manually.
   */
  async refresh(): Promise<AuthTokens> {
    if (!this.refreshToken) {
      throw new NovusPulseError({
        statusCode: 401,
        message: 'No refresh token available. Please login first.',
        error: 'Unauthorized',
      });
    }

    const data = await this.request<AuthTokens>(
      'POST',
      '/auth/refresh',
      { refreshToken: this.refreshToken },
      { skipAuth: true, skipAutoRefresh: true },
    );
    this.setTokens(data);
    return data;
  }

  /**
   * Request a password-reset email. Always resolves (the API returns the same
   * response whether or not the address matches an account). Pass `appUrl` so
   * the emailed link points back to the calling app.
   */
  async requestPasswordReset(input: {
    email: string;
    appUrl?: string;
  }): Promise<{ message: string }> {
    return this.request('POST', '/auth/forgot-password', input, {
      skipAuth: true,
    });
  }

  /**
   * Complete a password reset with the token from the emailed link. Throws
   * NovusPulseError if the token is invalid/expired or the new password is
   * in a known breach corpus.
   */
  async resetPassword(input: {
    token: string;
    password: string;
  }): Promise<{ message: string }> {
    return this.request('POST', '/auth/reset-password', input, {
      skipAuth: true,
    });
  }

  /**
   * Logout — invalidates the refresh token on the server.
   * Clears stored tokens locally.
   */
  async logout(): Promise<void> {
    try {
      await this.request('POST', '/auth/logout');
    } finally {
      // Clear tokens even if the logout request fails
      this.clearTokens();
    }
  }

  /**
   * Check if the client currently has tokens set.
   * Note: tokens may be expired — this doesn't verify them.
   */
  get isAuthenticated(): boolean {
    return this.accessToken !== null;
  }

  /**
   * Manually set tokens (e.g., restored from localStorage on app init).
   */
  setAuthTokens(tokens: AuthTokens): void {
    this.setTokens(tokens);
  }

  /**
   * Clear all stored tokens.
   * Keeps the realtime socket alive (anonymously) if there are active
   * public subscriptions; otherwise disconnects it.
   */
  clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    if (this.publicSubscriptions.size > 0) {
      this.connectSocket();
    } else {
      this.disconnectSocket();
    }
  }

  // ════════════════════════════════════════════════════════
  // USERS
  // ════════════════════════════════════════════════════════

  /** Get the current authenticated user's profile. */
  async getProfile(): Promise<User> {
    return this.request<User>('GET', '/users/me');
  }

  /** List all users (scoped to your tenant, or all if super_admin). */
  async getUsers(): Promise<User[]> {
    return this.request<User[]>('GET', '/users');
  }

  /** Get a user by ID. */
  async getUser(id: string): Promise<User> {
    return this.request<User>('GET', `/users/${id}`);
  }

  /** Update a user by ID. Requires tenant_owner or super_admin role. */
  async updateUser(id: string, input: UpdateUserInput): Promise<User> {
    return this.request<User>('PUT', `/users/${id}`, input);
  }

  /** Delete a user by ID. Requires tenant_owner or super_admin role. */
  async deleteUser(id: string): Promise<void> {
    await this.request('DELETE', `/users/${id}`);
  }

  // ════════════════════════════════════════════════════════
  // TENANTS (super_admin only)
  // ════════════════════════════════════════════════════════

  /** List all tenants. Requires super_admin role. */
  async getTenants(): Promise<Tenant[]> {
    return this.request<Tenant[]>('GET', '/tenants');
  }

  /** Get a tenant by ID. Requires super_admin role. */
  async getTenant(id: string): Promise<Tenant> {
    return this.request<Tenant>('GET', `/tenants/${id}`);
  }

  /**
   * Get the CALLER's own tenant — any authenticated role, not just
   * super_admin. Use this to pull fresh plan/status entitlements (e.g.
   * right after a plan upgrade or payment) without a full re-login.
   */
  async getMyTenant(): Promise<Tenant> {
    return this.request<Tenant>('GET', '/tenants/me');
  }

  /** Create a new tenant. Requires super_admin role. */
  async createTenant(input: CreateTenantInput): Promise<Tenant> {
    return this.request<Tenant>('POST', '/tenants', input);
  }

  /** Update a tenant. Requires super_admin role. */
  async updateTenant(id: string, input: UpdateTenantInput): Promise<Tenant> {
    return this.request<Tenant>('PUT', `/tenants/${id}`, input);
  }

  /** Delete a tenant. Requires super_admin role. */
  async deleteTenant(id: string): Promise<void> {
    await this.request('DELETE', `/tenants/${id}`);
  }

  /**
   * Transfer a tenant's ownership to another user by email.
   * Requires super_admin role.
   */
  async transferTenantOwnership(id: string, email: string): Promise<Tenant> {
    return this.request<Tenant>('PUT', `/tenants/${id}/transfer-ownership`, {
      email,
    });
  }

  /**
   * Mint a short-lived impersonation access token for a tenant.
   * Requires super_admin role. The returned token is logged server-side.
   */
  async impersonateTenant(id: string): Promise<{ accessToken: string }> {
    return this.request<{ accessToken: string }>(
      'POST',
      `/tenants/${id}/impersonate`,
      {},
    );
  }

  /**
   * Approve a pending cash / bank-transfer payment for a tenant, unlocking
   * its plan. Requires super_admin role.
   */
  async approveTenantCashPayment(id: string): Promise<Tenant> {
    return this.request<Tenant>('POST', `/tenants/${id}/approve-cash`, {});
  }

  // ════════════════════════════════════════════════════════
  // PRODUCTS
  // ════════════════════════════════════════════════════════

  /** Fetch all products for the authenticated tenant. */
  async getProducts<T = Record<string, unknown>>(): Promise<T[]> {
    return this.request<T[]>('GET', '/products');
  }

  /** Create a new product. */
  async createProduct(data: {
    title: string;
    slug: string;
    description?: string;
    price: number;
    compareAtPrice?: number;
    inventoryQty?: number;
    status?: string;
    images?: string[];
  }) {
    return this.request('POST', '/products', data);
  }

  /** Update an existing product. */
  async updateProduct(id: string, data: Record<string, unknown>) {
    return this.request('PATCH', `/products/${id}`, data);
  }

  /** Delete a product. */
  async deleteProduct(id: string) {
    return this.request('DELETE', `/products/${id}`);
  }

  /** PUBLIC: Fetch products for a specific tenant (no auth required). */
  async getPublicProducts(tenantSlug: string) {
    return this.request('GET', `/products/public/${tenantSlug}`, undefined, { skipAuth: true });
  }

  // ════════════════════════════════════════════════════════
  // PAGES
  // ════════════════════════════════════════════════════════

  /**
   * List all pages (scoped to your tenant, or all if super_admin).
   * Pass a content type ('product', 'article', 'event', …) to list only
   * that type — the same data model, filtered.
   */
  async getPages(type?: string): Promise<Page[]> {
    const query = type ? `?type=${encodeURIComponent(type)}` : '';
    return this.request<Page[]>('GET', `/pages${query}`);
  }

  /** Get a single page by ID. */
  async getPage(id: string): Promise<Page> {
    return this.request<Page>('GET', `/pages/${id}`);
  }

  /** Create a new page in your tenant. */
  async createPage(input: CreatePageInput): Promise<Page> {
    return this.request<Page>('POST', '/pages', input);
  }

  /** Update a page by ID. */
  async updatePage(id: string, input: UpdatePageInput): Promise<Page> {
    return this.request<Page>('PUT', `/pages/${id}`, input);
  }

  /** Delete a page by ID. */
  async deletePage(id: string): Promise<void> {
    await this.request('DELETE', `/pages/${id}`);
  }

  // ── Page revisions (version history) ─────────────────────

  /**
   * List a page's revision history, newest first.
   * Each entry is the page's state BEFORE an edit was applied.
   * `content` is omitted here — use getPageRevision() for the full snapshot.
   */
  async getPageRevisions(pageId: string): Promise<PageRevision[]> {
    return this.request<PageRevision[]>('GET', `/pages/${pageId}/revisions`);
  }

  /** Fetch a single revision including its full content snapshot. */
  async getPageRevision(pageId: string, revisionId: string): Promise<PageRevision> {
    return this.request<PageRevision>('GET', `/pages/${pageId}/revisions/${revisionId}`);
  }

  /**
   * Restore a page to an earlier revision. The current state is snapshotted
   * first, so a restore can itself be undone. Fires the same realtime sync
   * events as a normal edit.
   */
  async restorePageRevision(pageId: string, revisionId: string): Promise<Page> {
    return this.request<Page>('POST', `/pages/${pageId}/revisions/${revisionId}/restore`);
  }

  /**
   * PUBLIC: Fetch published pages for a tenant by slug.
   * No authentication required — designed for frontend content display.
   *
   * Usage:
   * ```ts
   * const pages = await pulse.getPublicPages('barcelona-cafe');
   * ```
   */
  async getPublicPages(tenantSlug: string, type?: string): Promise<Page[]> {
    const query = type ? `?type=${encodeURIComponent(type)}` : '';
    return this.request<Page[]>('GET', `/public/${tenantSlug}/pages${query}`, undefined, {
      skipAuth: true,
    });
  }

  // ════════════════════════════════════════════════════════
  // MEDIA
  // ════════════════════════════════════════════════════════

  /**
   * List media (scoped to your tenant, or all if super_admin), newest first.
   * Server-paged: default 100 per call — pass limit/offset to page through.
   *
   * Returns just the array of assets. The API responds with a
   * `{ items, total, limit, offset }` envelope; use {@link getMediaPage}
   * when you need the pagination metadata.
   */
  async getMedia(options?: {
    limit?: number;
    offset?: number;
    folderId?: string;
  }): Promise<Photo[]> {
    return (await this.getMediaPage(options)).items;
  }

  /**
   * Like {@link getMedia} but returns the full paged envelope
   * (`items` + `total` + `limit` + `offset`).
   */
  async getMediaPage(options?: {
    limit?: number;
    offset?: number;
    folderId?: string;
  }): Promise<{
    items: Photo[];
    total: number;
    limit: number;
    offset: number;
  }> {
    const params = new URLSearchParams();
    if (options?.limit !== undefined) params.set('limit', String(options.limit));
    if (options?.offset !== undefined) params.set('offset', String(options.offset));
    if (options?.folderId !== undefined) params.set('folderId', options.folderId);
    const qs = params.toString();
    const query = qs ? `?${qs}` : '';
    const res = await this.request<
      | { items: Photo[]; total: number; limit: number; offset: number }
      | Photo[]
    >('GET', `/media${query}`);
    // Tolerate both the enveloped and (older/raw) array shapes.
    if (Array.isArray(res)) {
      return { items: res, total: res.length, limit: res.length, offset: 0 };
    }
    return res;
  }

  /** Get a single media asset by ID. */
  async getMediaAsset(id: string): Promise<Photo> {
    return this.request<Photo>('GET', `/media/${id}`);
  }

  /** Create media metadata in your tenant. */
  async createMedia(input: CreatePhotoInput): Promise<Photo> {
    return this.request<Photo>('POST', '/media', input);
  }

  /** Update media metadata by ID. */
  async updateMedia(id: string, input: UpdatePhotoInput): Promise<Photo> {
    return this.request<Photo>('PUT', `/media/${id}`, input);
  }

  /** Delete a media asset by ID. */
  async deleteMedia(id: string): Promise<void> {
    await this.request('DELETE', `/media/${id}`);
  }

  /**
   * Images already sitting in YOUR tenant's own site app (its public/
   * folder), discovered through the same workspace auto-discovery as
   * getMySiteInfo() — dev-only scan; in production (no scanner hit) returns
   * `available: false`. Read-only: these files were never uploaded through
   * the CMS and can't be deleted or edited from here.
   */
  async getSiteFiles(): Promise<SiteFilesResult> {
    return this.request<SiteFilesResult>('GET', '/media/site-files');
  }

  // ════════════════════════════════════════════════════════
  // CONTENT AI — natural-language editing
  // ════════════════════════════════════════════════════════

  /**
   * Ask the AI to translate a plain-language request into a structured
   * content diff. READ-ONLY — nothing is written until the user confirms
   * and you call applyContentChanges() with the returned changes.
   *
   * ```ts
   * const result = await pulse.proposeContentChange('change the coffee price to €3.50');
   * if (result.status === 'diff') showDiffCard(result.changes);
   * ```
   */
  async proposeContentChange(message: string): Promise<ProposeContentResult> {
    return this.request<ProposeContentResult>('POST', '/content-ai/propose', { message });
  }

  /**
   * Apply a previously proposed diff after explicit user confirmation.
   * The server re-verifies old values before writing (409 if content
   * changed since the preview), logs the change, and triggers the
   * tenant site's revalidation webhook.
   */
  async applyContentChanges(
    changes: ProposedContentChange[],
    message?: string,
    source: 'portal' | 'whatsapp' | 'admin' = 'portal',
  ): Promise<ApplyContentResult> {
    return this.request<ApplyContentResult>('POST', '/content-ai/apply', {
      changes,
      message,
      source,
    });
  }

  /** Recent AI-assisted changes for this tenant (the "paper trail"). */
  async getContentChangeHistory(): Promise<ContentChangeLogEntry[]> {
    return this.request<ContentChangeLogEntry[]>('GET', '/content-ai/history');
  }

  /**
   * General "how do I use this" support chat — server-side AI (Anthropic
   * or Gemini, configured via AI_PROVIDER/AI_API_KEY), with an automatic
   * scripted fallback if no key is configured. No tenant content involved.
   */
  async askSupportChat(message: string): Promise<string> {
    const { reply } = await this.request<{ reply: string }>('POST', '/content-ai/support-chat', {
      message,
    });
    return reply;
  }

  // ════════════════════════════════════════════════════════
  // ANALYTICS
  // ════════════════════════════════════════════════════════

  /**
   * PUBLIC: Ping the backend to register this app installation.
   */
  async pingApp(appData: { name: string; url: string; type: 'web' | 'mobile' }): Promise<{ ok: boolean }> {
    try {
      return await this.request('POST', '/public/ping', appData, { skipAuth: true });
    } catch {
      return { ok: false };
    }
  }

  /**
   * PUBLIC: Track an analytics event (pageview, click, etc.) for a tenant.
   * Fire-and-forget — no auth required.
   */
  async trackEvent(
    tenantSlug: string,
    event: { eventType: string; pageSlug?: string; visitorId?: string; metadata?: Record<string, unknown> },
  ): Promise<void> {
    await this.request('POST', `/public/${tenantSlug}/analytics`, event, { skipAuth: true });
  }

  /** Get aggregated analytics stats for the active tenant's dashboard. */
  async getAnalyticsStats(days = 30): Promise<any> {
    return this.request('GET', `/analytics/stats?days=${days}`);
  }

  // ════════════════════════════════════════════════════════
  // MENUS
  // ════════════════════════════════════════════════════════

  /** List all menus for the active tenant. */
  async getMenus(): Promise<any[]> {
    return this.request<any[]>('GET', '/menus');
  }

  /** Get a single menu by ID. */
  async getMenu(id: string): Promise<any> {
    return this.request('GET', `/menus/${id}`);
  }

  /** Create a new menu. */
  async createMenu(input: { name: string; slug: string; items?: any[] }): Promise<any> {
    return this.request('POST', '/menus', input);
  }

  /** Update a menu. */
  async updateMenu(id: string, input: { name?: string; items?: any[] }): Promise<any> {
    return this.request('PUT', `/menus/${id}`, input);
  }

  /** Delete a menu. */
  async deleteMenu(id: string): Promise<void> {
    await this.request('DELETE', `/menus/${id}`);
  }

  /** PUBLIC: Get a menu by slug for a tenant's frontend. */
  async getPublicMenu(tenantSlug: string, menuSlug: string): Promise<any> {
    return this.request('GET', `/public/${tenantSlug}/menus/${menuSlug}`, undefined, { skipAuth: true });
  }

  // ════════════════════════════════════════════════════════
  // FORMS & SUBMISSIONS
  // ════════════════════════════════════════════════════════

  /** PUBLIC: Submit a form to a tenant (contact form, quote request, etc.) */
  async submitForm(
    tenantSlug: string,
    formName: string,
    data: Record<string, unknown>,
  ): Promise<any> {
    return this.request('POST', `/public/${tenantSlug}/submissions`, { formName, data }, { skipAuth: true });
  }

  /**
   * Get form submissions for the active tenant, newest first.
   * Server-paged: default 50 per call — pass limit/offset to page through.
   */
  async getSubmissions(
    formName?: string,
    options?: { limit?: number; offset?: number },
  ): Promise<any[]> {
    const params = new URLSearchParams();
    if (formName) params.set('formName', formName);
    if (options?.limit !== undefined) params.set('limit', String(options.limit));
    if (options?.offset !== undefined) params.set('offset', String(options.offset));
    const qs = params.toString();
    const query = qs ? `?${qs}` : '';
    return this.request<any[]>('GET', `/forms/submissions${query}`);
  }

  /** Mark a submission as read/unread. */
  async markSubmissionRead(id: string, read = true): Promise<any> {
    return this.request('PUT', `/forms/submissions/${id}/read`, { read });
  }

  /** Delete a submission. */
  async deleteSubmission(id: string): Promise<void> {
    await this.request('DELETE', `/forms/submissions/${id}`);
  }

  // ════════════════════════════════════════════════════════
  // THEMES
  // ════════════════════════════════════════════════════════

  /** Update a tenant's visual theme by ID (super_admin only). */
  async updateTenantTheme(tenantId: string, theme: Record<string, unknown>): Promise<any> {
    return this.request('PUT', `/tenants/${tenantId}/theme`, { theme });
  }

  /**
   * Update the CALLER's own tenant theme — works for tenant_owner/worker,
   * no super_admin role needed. Scoped server-side from the JWT.
   */
  async updateMyTheme(theme: Record<string, unknown>): Promise<any> {
    return this.request('PUT', '/tenants/me/theme', { theme });
  }

  /**
   * PUBLIC: fetch a tenant's theme by slug — no auth. Live sites call this
   * on load, then listen for 'theme.updated' socket events to restyle live.
   */
  async getPublicTheme(tenantSlug: string): Promise<Record<string, unknown> | null> {
    const data = await this.request<{ theme: Record<string, unknown> | null }>(
      'GET',
      `/public/${tenantSlug}/theme`,
      undefined,
      { skipAuth: true },
    );
    return data.theme;
  }

  // ════════════════════════════════════════════════════════
  // MODULES
  // ════════════════════════════════════════════════════════

  /**
   * Update the CALLER's own tenant module registry — which optional
   * feature modules (pages/content/media/menus/forms/products/analytics/
   * agent) are enabled. Works for admin/super_admin, scoped server-side
   * from the JWT — same self-scoped pattern as updateMyTheme(). Requires
   * admin or super_admin role.
   */
  async updateMyModules(enabledModules: string[]): Promise<Tenant> {
    return this.request<Tenant>('PUT', '/tenants/me/modules', { enabledModules });
  }

  /**
   * Update the CALLER's own tenant settings blob (notification, privacy, and
   * policy preferences). Merges at the top-level namespace server-side, so
   * saving one settings area never clobbers another. Admin/super_admin only,
   * self-scoped from the JWT — same pattern as updateMyModules().
   */
  async updateMySettings(settings: Record<string, unknown>): Promise<Tenant> {
    return this.request<Tenant>('PUT', '/tenants/me/settings', { settings });
  }

  /**
   * Where is my tenant's site running RIGHT NOW?
   * In development the backend scans sibling workspace apps (their
   * package.json `novusPulse` declarations, dev scripts, vite configs) and
   * returns the live localhost URL; in production it returns the configured
   * site URL. `source` is 'scanned' | 'configured' | 'none'.
   */
  async getMySiteInfo(): Promise<{ siteUrl: string | null; source: 'scanned' | 'dev' | 'configured' | 'none' }> {
    return this.request('GET', '/tenants/me/site-info');
  }

  /**
   * Set my tenant's site URLs. `siteUrl` is the production domain (used for
   * sitemaps/canonicals); `devUrl` is where it runs locally — kept apart so a
   * localhost never leaks into public URLs. Only the keys you pass are touched;
   * pass null to clear one. The server stores origins only. Requires admin role.
   */
  async updateMySite(input: { siteUrl?: string | null; devUrl?: string | null }): Promise<Tenant> {
    return this.request('PUT', '/tenants/me/site', input);
  }

  /**
   * Fire a real revalidation ping at the site and report what happened —
   * proves reachability rather than trusting config. Requires admin role.
   */
  async testMySite(): Promise<{
    ok: boolean;
    reason?: 'no-site-url' | 'request-failed';
    status?: number;
    siteUrl?: string | null;
    source?: 'scanned' | 'dev' | 'configured' | 'none';
  }> {
    return this.request('POST', '/tenants/me/site/test');
  }

  /**
   * The shared secret the site's /api/revalidate route must check. Needed when
   * wiring up a site that wasn't scaffolded by create-novus-pulse. Admin only.
   */
  async getMyRevalidateSecret(): Promise<{ revalidateSecret: string | null }> {
    return this.request('GET', '/tenants/me/site/secret');
  }

  // ════════════════════════════════════════════════════════
  // STRUCTURED CONTENT — types, fields, entries
  // ════════════════════════════════════════════════════════

  /** List all content types (with their fields) for the active tenant. */
  async getContentTypes(): Promise<any[]> {
    return this.request<any[]>('GET', '/content/types');
  }

  /** Get a single content type by its apiId. */
  async getContentType(apiId: string): Promise<any> {
    return this.request('GET', `/content/types/${apiId}`);
  }

  /** Create a content type. Requires admin role. */
  async createContentType(input: Record<string, unknown>): Promise<any> {
    return this.request('POST', '/content/types', input);
  }

  /** Update a content type by apiId. Requires admin role. */
  async updateContentType(apiId: string, input: Record<string, unknown>): Promise<any> {
    return this.request('PUT', `/content/types/${apiId}`, input);
  }

  /** Delete a content type by apiId. Requires admin role. */
  async deleteContentType(apiId: string): Promise<void> {
    await this.request('DELETE', `/content/types/${apiId}`);
  }

  /** Add a field to a content type. Requires admin role. */
  async createContentField(typeApiId: string, input: Record<string, unknown>): Promise<any> {
    return this.request('POST', `/content/types/${typeApiId}/fields`, input);
  }

  /** Update a field on a content type. Requires admin role. */
  async updateContentField(
    typeApiId: string,
    fieldApiId: string,
    input: Record<string, unknown>,
  ): Promise<any> {
    return this.request('PUT', `/content/types/${typeApiId}/fields/${fieldApiId}`, input);
  }

  /** Remove a field from a content type. Requires admin role. */
  async deleteContentField(typeApiId: string, fieldApiId: string): Promise<void> {
    await this.request('DELETE', `/content/types/${typeApiId}/fields/${fieldApiId}`);
  }

  // ── Content entries ───────────────────────────────────────

  /**
   * List entries of a content type.
   * - `includeTrashed`: also return soft-deleted (trashed) entries.
   * - `resolve`: expand reference fields into their target entries.
   */
  async getEntries(
    typeApiId: string,
    options?: { includeTrashed?: boolean; resolve?: boolean },
  ): Promise<any[]> {
    const params = new URLSearchParams();
    if (options?.includeTrashed) params.set('includeTrashed', 'true');
    if (options?.resolve) params.set('resolve', 'true');
    const qs = params.toString();
    return this.request<any[]>('GET', `/content/entries/${typeApiId}${qs ? `?${qs}` : ''}`);
  }

  /** Get a single entry. Pass `resolve: true` to expand reference fields. */
  async getEntry(typeApiId: string, id: string, options?: { resolve?: boolean }): Promise<any> {
    const query = options?.resolve ? '?resolve=true' : '';
    return this.request('GET', `/content/entries/${typeApiId}/${id}${query}`);
  }

  /**
   * Create an entry. Payload supports `slug`, `status`, `data`, plus
   * workflow extras: `locale` ("en" / "en-US"), `scheduledAt` (for
   * status 'scheduled'), and `seo` (per-entry SEO overrides).
   */
  async createEntry(
    typeApiId: string,
    payload: {
      slug: string;
      status?: 'draft' | 'in_review' | 'scheduled' | 'published' | 'archived';
      scheduledAt?: string | Date;
      data?: Record<string, any>;
      seo?: Record<string, any>;
      locale?: string;
    },
  ): Promise<any> {
    return this.request('POST', `/content/entries/${typeApiId}`, payload);
  }

  /** Update an entry. Accepts the same payload shape as createEntry (all optional). */
  async updateEntry(
    typeApiId: string,
    id: string,
    payload: {
      slug?: string;
      status?: 'draft' | 'in_review' | 'scheduled' | 'published' | 'archived';
      scheduledAt?: string | Date;
      data?: Record<string, any>;
      seo?: Record<string, any>;
      locale?: string;
    },
  ): Promise<any> {
    return this.request('PUT', `/content/entries/${typeApiId}/${id}`, payload);
  }

  /** Soft-delete (trash) an entry. Restorable via restoreEntry(). */
  async deleteEntry(typeApiId: string, id: string): Promise<void> {
    await this.request('DELETE', `/content/entries/${typeApiId}/${id}`);
  }

  /** Duplicate an entry — returns the new copy (created as a draft). */
  async duplicateEntry(typeApiId: string, id: string): Promise<any> {
    return this.request('POST', `/content/entries/${typeApiId}/${id}/duplicate`);
  }

  /** Restore a trashed entry. */
  async restoreEntry(typeApiId: string, id: string): Promise<any> {
    return this.request('POST', `/content/entries/${typeApiId}/${id}/restore`);
  }

  /** Run a bulk workflow action (publish/archive/trash/restore) over many entries. */
  async bulkEntryAction(
    typeApiId: string,
    ids: string[],
    action: 'publish' | 'archive' | 'trash' | 'restore',
  ): Promise<any> {
    return this.request('POST', `/content/entries/${typeApiId}/bulk`, { ids, action });
  }

  // ── Search + stats ────────────────────────────────────────

  /** Cross-content search for the active tenant. Any authenticated role. */
  async searchContent(q: string, opts?: { type?: string; limit?: number }): Promise<any> {
    const params = new URLSearchParams({ q });
    if (opts?.type) params.set('type', opts.type);
    if (opts?.limit !== undefined) params.set('limit', String(opts.limit));
    return this.request('GET', `/content/search?${params.toString()}`);
  }

  /** Dashboard stats (entry counts by type/status, etc.) for the active tenant. */
  async getContentStats(): Promise<any> {
    return this.request('GET', '/content/stats');
  }

  // ── Content permissions (role × action matrix) ────────────

  /**
   * List the per-role content permission matrix. Optionally filter by a
   * single content type apiId. Requires admin role.
   */
  async getContentPermissions(typeApiId?: string): Promise<any[]> {
    const query = typeApiId ? `?typeApiId=${encodeURIComponent(typeApiId)}` : '';
    return this.request<any[]>('GET', `/content/permissions${query}`);
  }

  /** Set (upsert) one role/action permission for a content type. Requires admin role. */
  async setContentPermission(
    typeApiId: string,
    input: {
      role: string;
      action: 'create' | 'read' | 'update' | 'publish' | 'delete';
      allowed: boolean;
    },
  ): Promise<any> {
    return this.request('PUT', `/content/permissions/${typeApiId}`, input);
  }

  /** Delete a permission rule by its ID (falls back to role defaults). Requires admin role. */
  async deleteContentPermission(id: string): Promise<void> {
    await this.request('DELETE', `/content/permissions/${id}`);
  }

  // ════════════════════════════════════════════════════════
  // WEBHOOKS & API KEYS
  // ════════════════════════════════════════════════════════

  /** List outgoing webhooks for the active tenant. Requires admin role. */
  async getWebhooks(): Promise<any[]> {
    return this.request<any[]>('GET', '/webhooks');
  }

  /** Create an outgoing webhook. Requires admin role. */
  async createWebhook(input: {
    name: string;
    url: string;
    events: string[];
    secret?: string;
  }): Promise<any> {
    return this.request('POST', '/webhooks', input);
  }

  /** Update a webhook (name/url/events/secret/enabled). Requires admin role. */
  async updateWebhook(id: string, input: Record<string, unknown>): Promise<any> {
    return this.request('PUT', `/webhooks/${id}`, input);
  }

  /** Delete a webhook. Requires admin role. */
  async deleteWebhook(id: string): Promise<void> {
    await this.request('DELETE', `/webhooks/${id}`);
  }

  /** List API keys for the active tenant (secrets are masked). Requires admin role. */
  async getApiKeys(): Promise<any[]> {
    return this.request<any[]>('GET', '/webhooks/api-keys/list');
  }

  /**
   * Create an API key. The full key value is only returned ONCE, in this
   * response — store it immediately. Requires admin role.
   */
  async createApiKey(name: string): Promise<any> {
    return this.request('POST', '/webhooks/api-keys', { name });
  }

  /** Revoke (delete) an API key. Requires admin role. */
  async revokeApiKey(id: string): Promise<void> {
    await this.request('DELETE', `/webhooks/api-keys/${id}`);
  }

  // ════════════════════════════════════════════════════════
  // REDIRECTS
  // ════════════════════════════════════════════════════════

  /** List URL redirects for the active tenant. */
  async getRedirects(): Promise<any[]> {
    return this.request<any[]>('GET', '/redirects');
  }

  /** Create a redirect (fromPath → toPath). Requires admin role. */
  async createRedirect(input: Record<string, unknown>): Promise<any> {
    return this.request('POST', '/redirects', input);
  }

  /** Update a redirect. Requires admin role. */
  async updateRedirect(id: string, input: Record<string, unknown>): Promise<any> {
    return this.request('PUT', `/redirects/${id}`, input);
  }

  /** Delete a redirect. Requires admin role. */
  async deleteRedirect(id: string): Promise<void> {
    await this.request('DELETE', `/redirects/${id}`);
  }

  /** PUBLIC: fetch a tenant's active redirects by slug — no auth (for site middleware). */
  async getPublicRedirects(tenantSlug: string): Promise<any[]> {
    return this.request<any[]>('GET', `/public/${tenantSlug}/redirects`, undefined, {
      skipAuth: true,
    });
  }

  // ════════════════════════════════════════════════════════
  // RESERVATIONS
  // ════════════════════════════════════════════════════════

  /** Bookings for the active tenant, optionally filtered by range/status. */
  async getReservations(opts?: { from?: string; to?: string; status?: string }): Promise<any[]> {
    const params = new URLSearchParams();
    if (opts?.from) params.set('from', opts.from);
    if (opts?.to) params.set('to', opts.to);
    if (opts?.status) params.set('status', opts.status);
    const query = params.toString();
    return this.request<any[]>('GET', `/reservations${query ? `?${query}` : ''}`);
  }

  async createReservation(input: Record<string, unknown>): Promise<any> {
    return this.request('POST', '/reservations', input);
  }

  /** Status changes are validated server-side against the allowed transitions. */
  async updateReservation(id: string, input: Record<string, unknown>): Promise<any> {
    return this.request('PUT', `/reservations/${id}`, input);
  }

  async deleteReservation(id: string): Promise<void> {
    await this.request('DELETE', `/reservations/${id}`);
  }

  /** Free slots for a day. `date` is YYYY-MM-DD. */
  async getReservationAvailability(date: string, partySize = 1): Promise<
    Array<{ startsAt: string; endsAt: string; availableResourceIds: string[] }>
  > {
    return this.request('GET', `/reservations/availability?date=${date}&partySize=${partySize}`);
  }

  // ── Bookable resources (tables / rooms / staff) ──────────

  async getResources(): Promise<any[]> {
    return this.request<any[]>('GET', '/reservations/resources');
  }

  async createResource(input: { name: string; kind?: string; capacity?: number; active?: boolean }): Promise<any> {
    return this.request('POST', '/reservations/resources', input);
  }

  async updateResource(id: string, input: Record<string, unknown>): Promise<any> {
    return this.request('PUT', `/reservations/resources/${id}`, input);
  }

  async deleteResource(id: string): Promise<void> {
    await this.request('DELETE', `/reservations/resources/${id}`);
  }

  // ── Opening hours ────────────────────────────────────────

  /** Multiple rules per weekday are allowed — that's how split shifts work. */
  async getAvailabilityRules(): Promise<any[]> {
    return this.request<any[]>('GET', '/reservations/rules');
  }

  async createAvailabilityRule(input: {
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
    slotMinutes?: number;
    durationMinutes?: number;
  }): Promise<any> {
    return this.request('POST', '/reservations/rules', input);
  }

  async updateAvailabilityRule(id: string, input: Record<string, unknown>): Promise<any> {
    return this.request('PUT', `/reservations/rules/${id}`, input);
  }

  async deleteAvailabilityRule(id: string): Promise<void> {
    await this.request('DELETE', `/reservations/rules/${id}`);
  }

  // ── PUBLIC storefront booking (no auth) ──────────────────

  /** Free slots for a public booking form. Returns counts, never resource ids. */
  async getPublicAvailability(
    tenantSlug: string,
    date: string,
    partySize = 1,
  ): Promise<Array<{ startsAt: string; endsAt: string; available: number }>> {
    return this.request('GET', `/public/${tenantSlug}/availability?date=${date}&partySize=${partySize}`, undefined, {
      skipAuth: true,
    });
  }

  /** Request a booking from a storefront. Always lands as `pending`. */
  async createPublicReservation(
    tenantSlug: string,
    input: { customerName: string; customerEmail?: string; customerPhone?: string; partySize?: number; startsAt: string; notes?: string },
  ): Promise<any> {
    return this.request('POST', `/public/${tenantSlug}/reservations`, input, { skipAuth: true });
  }

  // ════════════════════════════════════════════════════════
  // CRM
  // ════════════════════════════════════════════════════════

  /** Contacts for the active tenant, paginated and optionally filtered. */
  async getContacts(opts?: { q?: string; stage?: string; tag?: string; limit?: number; offset?: number }): Promise<
    { items: any[]; total: number }
  > {
    const params = new URLSearchParams();
    if (opts?.q) params.set('q', opts.q);
    if (opts?.stage) params.set('stage', opts.stage);
    if (opts?.tag) params.set('tag', opts.tag);
    if (opts?.limit) params.set('limit', String(opts.limit));
    if (opts?.offset) params.set('offset', String(opts.offset));
    const query = params.toString();
    return this.request('GET', `/crm/contacts${query ? `?${query}` : ''}`);
  }

  /** One contact with its notes timeline. */
  async getContact(id: string): Promise<any> {
    return this.request('GET', `/crm/contacts/${id}`);
  }

  async createContact(input: Record<string, unknown>): Promise<any> {
    return this.request('POST', '/crm/contacts', input);
  }

  async updateContact(id: string, input: Record<string, unknown>): Promise<any> {
    return this.request('PUT', `/crm/contacts/${id}`, input);
  }

  async deleteContact(id: string): Promise<void> {
    await this.request('DELETE', `/crm/contacts/${id}`);
  }

  async addContactNote(id: string, body: string): Promise<any> {
    return this.request('POST', `/crm/contacts/${id}/notes`, { body });
  }

  // ════════════════════════════════════════════════════════
  // EMAIL CAMPAIGNS
  // ════════════════════════════════════════════════════════

  async getCampaigns(): Promise<any[]> {
    return this.request('GET', '/campaigns');
  }

  async getCampaign(id: string): Promise<any> {
    return this.request('GET', `/campaigns/${id}`);
  }

  async createCampaign(input: Record<string, unknown>): Promise<any> {
    return this.request('POST', '/campaigns', input);
  }

  async updateCampaign(id: string, input: Record<string, unknown>): Promise<any> {
    return this.request('PUT', `/campaigns/${id}`, input);
  }

  async deleteCampaign(id: string): Promise<void> {
    await this.request('DELETE', `/campaigns/${id}`);
  }

  async sendCampaign(id: string): Promise<any> {
    return this.request('POST', `/campaigns/${id}/send`);
  }

  async scheduleCampaign(id: string, scheduledAt: string): Promise<any> {
    return this.request('POST', `/campaigns/${id}/schedule`, { scheduledAt });
  }

  async previewAudience(stage?: string, tag?: string): Promise<any> {
    const params = new URLSearchParams();
    if (stage) params.set('stage', stage);
    if (tag) params.set('tag', tag);
    const query = params.toString();
    return this.request('GET', `/campaigns/audience/preview${query ? `?${query}` : ''}`);
  }

  async getEmailTemplates(): Promise<any[]> {
    return this.request('GET', '/campaigns/templates');
  }

  async createEmailTemplate(input: Record<string, unknown>): Promise<any> {
    return this.request('POST', '/campaigns/templates', input);
  }

  async updateEmailTemplate(id: string, input: Record<string, unknown>): Promise<any> {
    return this.request('PUT', `/campaigns/templates/${id}`, input);
  }

  async deleteEmailTemplate(id: string): Promise<void> {
    await this.request('DELETE', `/campaigns/templates/${id}`);
  }

  // ════════════════════════════════════════════════════════
  // AUDIT LOG
  // ════════════════════════════════════════════════════════

  /** Paged audit log for the active tenant, newest first. Requires admin role. */
  async getAuditLogs(limit = 50, offset = 0): Promise<any> {
    return this.request('GET', `/audit?limit=${limit}&offset=${offset}`);
  }

  // ════════════════════════════════════════════════════════
  // BILLING & PAYMENTS
  // ════════════════════════════════════════════════════════

  /** Submit a mock payment for a pending tenant. */
  async mockCheckout(input: { plan: string; amount: number; cardLast4: string }): Promise<any> {
    return this.request('POST', '/payments/mock-checkout', input);
  }

  // ════════════════════════════════════════════════════════
  // INTERNAL: HTTP REQUEST LAYER
  // ════════════════════════════════════════════════════════

  /**
   * Core request method — all API calls go through here.
   *
   * Features:
   * - Automatically adds Authorization header with Bearer token
   * - Automatically retries with a refreshed token on 401
   * - Deduplicates concurrent refresh calls (one refresh at a time)
   * - Parses JSON responses and wraps errors in NovusPulseError
   */
  async request<T = unknown>(
    method: string,
    path: string,
    body?: unknown,
    options?: { skipAuth?: boolean; skipAutoRefresh?: boolean },
  ): Promise<T> {
    const url = `${this.baseUrl}${this.apiPrefix}${path}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add auth header unless this is a public/auth endpoint
    if (!options?.skipAuth && this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
      if (this.tenantId) {
        headers['x-tenant-id'] = this.tenantId;
      }
    }

    const response = await this.fetchFn(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    // Handle 401 — attempt auto-refresh if we have a refresh token
    if (
      response.status === 401 &&
      !options?.skipAuth &&
      !options?.skipAutoRefresh &&
      this.refreshToken
    ) {
      try {
        await this.autoRefresh();
        // Retry the original request with the new token
        return this.request<T>(method, path, body, {
          ...options,
          skipAutoRefresh: true, // Don't infinitely loop
        });
      } catch (refreshError) {
        // Refresh failed — notify the consumer and throw
        if (this.onAuthError && refreshError instanceof NovusPulseError) {
          this.onAuthError(refreshError);
        }
        throw refreshError;
      }
    }

    // Handle non-2xx responses
    if (!response.ok) {
      let errorData: NovusPulseErrorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = {
          statusCode: response.status,
          message: response.statusText || 'Unknown error',
          error: 'UnknownError',
        };
      }
      const error = new NovusPulseError(errorData);
      // A 401 here means either there was no refresh token to try (this
      // client was built with an access token only), or refresh isn't
      // applicable — either way, the caller needs to know auth is dead
      // rather than silently failing every request forever.
      if (response.status === 401 && !options?.skipAuth && this.onAuthError) {
        this.onAuthError(error);
      }
      throw error;
    }

    // Handle 204 No Content (e.g., DELETE responses)
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  /**
   * Auto-refresh with deduplication.
   * If multiple requests hit 401 simultaneously, only ONE refresh call is made.
   * All waiting requests share the same refresh promise.
   */
  private async autoRefresh(): Promise<AuthTokens> {
    // If a refresh is already in flight, wait for it
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.refresh().finally(() => {
      this.isRefreshing = false;
      this.refreshPromise = null;
    });

    return this.refreshPromise;
  }

  /**
   * Store tokens internally and notify the consumer.
   */
  private setTokens(data: AuthTokens): void {
    this.accessToken = data.accessToken;
    this.refreshToken = data.refreshToken;

    if (this.autoConnectSocket) {
      this.connectSocket();
    }

    // Notify consumer so they can persist tokens
    if (this.onTokenRefresh) {
      this.onTokenRefresh({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
    }
  }

  // ════════════════════════════════════════════════════════
  // REAL-TIME WEBSOCKETS
  // ════════════════════════════════════════════════════════

  private connectSocket(): void {
    if (typeof window === 'undefined') return; // Never connect sockets during SSR

    if (this.socket) {
      this.socket.disconnect();
    }

    // Anonymous connections are allowed when there are public subscriptions —
    // the server only lets them join public_* rooms (published content only).
    if (!this.accessToken && this.publicSubscriptions.size === 0) return;

    this.socket = io(this.baseUrl, {
      path: '/socket.io', // default
      auth: this.accessToken ? { token: this.accessToken } : {},
      // Start on polling and upgrade to WebSocket when the environment
      // allows it. Forcing websocket-only means any proxy/network that
      // blocks the WS upgrade kills realtime with no fallback.
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
    });

    this.socket.on('connect', () => {
      if (this.debug) console.log('[Novus Pulse] Real-time socket connected');
      // (Re)join public rooms after every connect/reconnect
      for (const slug of this.publicSubscriptions) {
        this.socket?.emit('subscribe_public', { tenantSlug: slug });
      }
    });

    this.socket.on('disconnect', () => {
      if (this.debug) console.log('[Novus Pulse] Real-time socket disconnected');
    });

    // A single failed transport probe (e.g. a proxy blocking the WebSocket
    // upgrade while polling still works) is normal and self-healing — don't
    // spam console.error for it. Only surface it once reconnection has
    // genuinely given up, or when debug logging is on.
    this.socket.io.on('reconnect_failed', () => {
      console.warn(
        '[Novus Pulse] Real-time connection unavailable — retrying in the background.',
      );
    });
    this.socket.on('connect_error', (err) => {
      if (this.debug) {
        console.warn('[Novus Pulse] Socket connect_error:', err.message);
      }
    });

    // Re-attach every handler registered via .on() — they must survive
    // socket re-creation (login, logout, token refresh, public subscribe).
    for (const [event, callbacks] of this.eventHandlers) {
      for (const callback of callbacks) {
        this.socket.on(event, callback);
      }
    }
  }

  private disconnectSocket(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Subscribe to PUBLIC realtime updates for a tenant's published content.
   * No authentication required — pairs with `getPublicPages(tenantSlug)`.
   *
   * Events received: `page.created`, `page.updated`, `page.deleted`
   * (only for pages with `published: true`).
   *
   * ```ts
   * const pulse = new NovusPulse({ baseUrl: 'http://localhost:3000' });
   * const pages = await pulse.getPublicPages('barcelona-cafe');
   * pulse.subscribePublic('barcelona-cafe');
   * pulse.on('page.updated', (page) => render(page));
   * ```
   */
  subscribePublic(tenantSlug: string): void {
    this.publicSubscriptions.add(tenantSlug);
    if (!this.socket) {
      this.connectSocket();
    } else if (this.socket.connected) {
      this.socket.emit('subscribe_public', { tenantSlug });
    }
    // If the socket exists but is still connecting, the 'connect'
    // handler joins all public rooms automatically.
  }

  /** Stop receiving public realtime updates for a tenant slug. */
  unsubscribePublic(tenantSlug: string): void {
    this.publicSubscriptions.delete(tenantSlug);
    if (this.publicSubscriptions.size === 0 && !this.accessToken) {
      this.disconnectSocket();
    }
  }

  /** Whether the realtime socket is currently connected. */
  get realtimeConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Subscribe to a real-time event.
   * Safe to call at any time — handlers registered before the socket exists
   * are attached automatically as soon as it connects.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(event: string, callback: (...args: any[]) => void): void {
    let callbacks = this.eventHandlers.get(event);
    if (!callbacks) {
      callbacks = new Set();
      this.eventHandlers.set(event, callbacks);
    }
    const alreadyRegistered = callbacks.has(callback);
    callbacks.add(callback);

    if (
      !this.socket &&
      this.autoConnectSocket &&
      (this.accessToken || this.publicSubscriptions.size > 0)
    ) {
      // connectSocket() attaches all registered handlers itself
      this.connectSocket();
      return;
    }
    if (!alreadyRegistered) {
      this.socket?.on(event, callback);
    }
  }

  /** Unsubscribe from a real-time event. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  off(event: string, callback?: (...args: any[]) => void): void {
    if (callback) {
      this.eventHandlers.get(event)?.delete(callback);
      this.socket?.off(event, callback);
    } else {
      this.eventHandlers.delete(event);
      this.socket?.off(event);
    }
  }
}
