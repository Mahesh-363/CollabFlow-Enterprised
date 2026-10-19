import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  savePersistedSession,
  getPersistedSession,
  clearPersistedSession,
  getStoredTokens,
  SESSION_STORAGE_KEY,
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  THIRTY_DAYS_MS,
} from './authSessionStorage.ts';
import type { User } from '../types/collab.ts';

// Mock browser localStorage and sessionStorage in Node test runner
class MockStorage implements Storage {
  private store = new Map<string, string>();
  get length() {
    return this.store.size;
  }
  clear(): void {
    this.store.clear();
  }
  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }
  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

// Polyfill window and storages for node test environment
const mockLocal = new MockStorage();
const mockSession = new MockStorage();

(global as any).window = global;
(global as any).localStorage = mockLocal;
(global as any).sessionStorage = mockSession;

const mockUser: User = {
  id: 'user-test-123',
  name: 'Elena Vance',
  email: 'elena.vance@acme.corp',
  avatar: 'EV',
  title: 'Staff Architect',
  role: 'owner',
  presence: 'online',
};

const mockAuthSession = {
  provider: 'demo' as const,
  accessToken: 'jwt-access-token-xyz',
  refreshToken: 'jwt-refresh-token-xyz',
  expiresAt: Date.now() + 900000,
  accountEmail: 'elena.vance@acme.corp',
  tokenRotationCount: 1,
  methodLabel: 'Demo SSO',
};

test('savePersistedSession with rememberMe=true persists to localStorage with 30-day expiry', () => {
  mockLocal.clear();
  mockSession.clear();

  const beforeTime = Date.now();
  savePersistedSession(
    {
      user: mockUser,
      authSession: mockAuthSession,
      activeWorkspaceId: 'ws-acme',
      activeChannelId: 'ch-announcements',
    },
    true
  );

  const localRaw = mockLocal.getItem(SESSION_STORAGE_KEY);
  assert.ok(localRaw, 'Should be saved in localStorage');
  assert.equal(mockSession.getItem(SESSION_STORAGE_KEY), null, 'sessionStorage should be empty');

  const parsed = JSON.parse(localRaw!);
  assert.equal(parsed.user.email, mockUser.email);
  assert.equal(parsed.rememberMe, true);
  assert.ok(parsed.expiresAt >= beforeTime + THIRTY_DAYS_MS - 1000);
  assert.equal((parsed as any).password, undefined, 'Password must never be saved');

  assert.equal(mockLocal.getItem(ACCESS_TOKEN_KEY), mockAuthSession.accessToken);
  assert.equal(mockLocal.getItem(REFRESH_TOKEN_KEY), mockAuthSession.refreshToken);

  const restored = getPersistedSession();
  assert.ok(restored);
  assert.equal(restored?.user.id, mockUser.id);
  assert.equal(restored?.activeWorkspaceId, 'ws-acme');
});

test('savePersistedSession with rememberMe=false persists to sessionStorage and clears localStorage', () => {
  mockLocal.clear();
  mockSession.clear();

  // Populate localStorage first
  mockLocal.setItem(SESSION_STORAGE_KEY, 'old');

  savePersistedSession(
    {
      user: mockUser,
      authSession: mockAuthSession,
    },
    false
  );

  assert.equal(mockLocal.getItem(SESSION_STORAGE_KEY), null, 'localStorage should be cleared');
  const sessionRaw = mockSession.getItem(SESSION_STORAGE_KEY);
  assert.ok(sessionRaw, 'Should be saved in sessionStorage');

  const parsed = JSON.parse(sessionRaw!);
  assert.equal(parsed.rememberMe, false);

  assert.equal(mockSession.getItem(ACCESS_TOKEN_KEY), mockAuthSession.accessToken);
  assert.equal(mockLocal.getItem(ACCESS_TOKEN_KEY), null);

  const restored = getPersistedSession();
  assert.ok(restored);
  assert.equal(restored?.user.name, mockUser.name);
});

test('getPersistedSession clears and returns null when session has expired', () => {
  mockLocal.clear();
  mockSession.clear();

  const expiredSession = {
    user: mockUser,
    authSession: mockAuthSession,
    rememberMe: true,
    expiresAt: Date.now() - 5000, // 5 seconds in the past
  };

  mockLocal.setItem(SESSION_STORAGE_KEY, JSON.stringify(expiredSession));

  const result = getPersistedSession();
  assert.equal(result, null, 'Expired session must return null');
  assert.equal(mockLocal.getItem(SESSION_STORAGE_KEY), null, 'Expired session must be cleaned up');
});

test('clearPersistedSession removes all session and token data from both storages', () => {
  mockLocal.setItem(SESSION_STORAGE_KEY, 'data');
  mockLocal.setItem(ACCESS_TOKEN_KEY, 'tok');
  mockSession.setItem(SESSION_STORAGE_KEY, 'data');
  mockSession.setItem(ACCESS_TOKEN_KEY, 'tok');

  clearPersistedSession();

  assert.equal(mockLocal.getItem(SESSION_STORAGE_KEY), null);
  assert.equal(mockLocal.getItem(ACCESS_TOKEN_KEY), null);
  assert.equal(mockSession.getItem(SESSION_STORAGE_KEY), null);
  assert.equal(mockSession.getItem(ACCESS_TOKEN_KEY), null);

  const tokens = getStoredTokens();
  assert.equal(tokens.accessToken, null);
  assert.equal(tokens.refreshToken, null);
});
