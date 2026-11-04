/**
 * @rashica07/novus-pulse — Lightweight TypeScript client for the Novus Pulse API.
 *
 * Works in: Next.js, React, React Native, Node.js 18+, vanilla browser JS.
 * Zero runtime dependencies.
 *
 * @example
 * ```ts
 * import { NovusPulse } from '@rashica07/novus-pulse';
 *
 * const pulse = new NovusPulse({
 *   baseUrl: 'https://api.novuspulse.dev',
 * });
 *
 * await pulse.login({ email: 'owner@cafe.com', password: 'SecurePass123!' });
 * const pages = await pulse.getPages();
 * ```
 *
 * @packageDocumentation
 */

// Main client
export { NovusPulse } from './novus-pulse';

// Module registry keys — value export (used for iterating/validating on the client)
export { MODULE_KEYS } from './types';

// All types — exported for consumers to use in their own code
export type {
  NovusPulseConfig,
  AuthTokens,
  RegisterInput,
  LoginInput,
  RegisterResponse,
  LoginResponse,
  User,
  UpdateUserInput,
  Tenant,
  TenantPlan,
  ModuleKey,
  CreateTenantInput,
  UpdateTenantInput,
  Page,
  CreatePageInput,
  UpdatePageInput,
  Photo,
  CreatePhotoInput,
  UpdatePhotoInput,
  ProposedContentChange,
  ProposeContentResult,
  ApplyContentResult,
  ContentChangeLogEntry,
  NovusPulseErrorData,
} from './types';

// Error class (exported as value, not just type)
export { NovusPulseError } from './types';
