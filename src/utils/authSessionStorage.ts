/**
 * CollabFlow Enterprise Auth Session Storage
 *
 * Implements session persistence for both Demo mode and Real mode.
 * Honors the "Remember device for 30 days" setting:
 * - Checked (rememberMe=true): uses localStorage with 30-day expiry
 * - Unchecked (rememberMe=false): uses sessionStorage
 * Never stores raw passwords.
 */

import type { User, Channel } from '../types/collab.ts';

export interface PersistedAuthSession {
  provider: 'microsoft' | 'apple' | 'google' | 'email' | 'phone' | 'demo';
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  accountEmail: string;
  tokenRotationCount: number;
  tenantId?: string;
  methodLabel: string;
}

export interface PersistedSessionData {
  user: User;
  authSession: PersistedAuthSession;
  rememberMe: boolean;
  expiresAt: number;
  activeWorkspaceId?: string;
  activeChannelId?: string;
  activeNav?: string;
  channels?: Channel[];
}

export const SESSION_STORAGE_KEY = 'collabflow_auth_session';
export const ACCESS_TOKEN_KEY = 'collabflow_access_token';
export const REFRESH_TOKEN_KEY = 'collabflow_refresh_token';
export const REMEMBER_KEY = 'collabflow_remember_device';

export const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export function savePersistedSession(
  data: {
    user: User;
    authSession: PersistedAuthSession;
    activeWorkspaceId?: string;
    activeChannelId?: string;
    activeNav?: string;
    channels?: Channel[];
  },
  rememberMe: boolean = true
): void {
  if (typeof window === 'undefined') return;

  const now = Date.now();
  const expiresAt = now + THIRTY_DAYS_MS;

  const sessionPayload: PersistedSessionData = {
    user: data.user,
    authSession: data.authSession,
    rememberMe,
    expiresAt,
    activeWorkspaceId: data.activeWorkspaceId,
    activeChannelId: data.activeChannelId,
    activeNav: data.activeNav,
    channels: data.channels,
  };

  try {
    const serialized = JSON.stringify(sessionPayload);
    if (rememberMe) {
      localStorage.setItem(SESSION_STORAGE_KEY, serialized);
      localStorage.setItem(REMEMBER_KEY, 'true');
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      sessionStorage.removeItem(REMEMBER_KEY);

      if (data.authSession.accessToken) {
        localStorage.setItem(ACCESS_TOKEN_KEY, data.authSession.accessToken);
        sessionStorage.removeItem(ACCESS_TOKEN_KEY);
      }
      if (data.authSession.refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, data.authSession.refreshToken);
        sessionStorage.removeItem(REFRESH_TOKEN_KEY);
      }
    } else {
      sessionStorage.setItem(SESSION_STORAGE_KEY, serialized);
      sessionStorage.setItem(REMEMBER_KEY, 'false');
      localStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.removeItem(REMEMBER_KEY);

      if (data.authSession.accessToken) {
        sessionStorage.setItem(ACCESS_TOKEN_KEY, data.authSession.accessToken);
        localStorage.removeItem(ACCESS_TOKEN_KEY);
      }
      if (data.authSession.refreshToken) {
        sessionStorage.setItem(REFRESH_TOKEN_KEY, data.authSession.refreshToken);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
      }
    }
  } catch (err) {
    console.error('Failed to save session to browser storage', err);
  }
}

export function getPersistedSession(): PersistedSessionData | null {
  if (typeof window === 'undefined') return null;

  try {
    // 1. Check localStorage first (remembered device for 30 days)
    const localRaw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (localRaw) {
      const parsed: PersistedSessionData = JSON.parse(localRaw);
      // Check 30-day expiration
      if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
        clearPersistedSession();
        return null;
      }
      return parsed;
    }

    // 2. Check sessionStorage (single session device)
    const sessionRaw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (sessionRaw) {
      const parsed: PersistedSessionData = JSON.parse(sessionRaw);
      if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
        clearPersistedSession();
        return null;
      }
      return parsed;
    }
  } catch (err) {
    console.error('Failed to parse persisted session', err);
    clearPersistedSession();
  }

  return null;
}

export function clearPersistedSession(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(REMEMBER_KEY);

    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(REMEMBER_KEY);
  } catch {
    // Storage access restricted
  }
}

export function getStoredTokens(): { accessToken: string | null; refreshToken: string | null } {
  if (typeof window === 'undefined') return { accessToken: null, refreshToken: null };

  const access = localStorage.getItem(ACCESS_TOKEN_KEY) || sessionStorage.getItem(ACCESS_TOKEN_KEY);
  const refresh = localStorage.getItem(REFRESH_TOKEN_KEY) || sessionStorage.getItem(REFRESH_TOKEN_KEY);

  return { accessToken: access, refreshToken: refresh };
}
