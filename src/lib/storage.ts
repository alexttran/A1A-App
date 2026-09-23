/**
 * Tiny persistence shim.
 *
 * On web this is `localStorage`; on iOS and Android it is memory-only for now.
 * The real app stores the refresh token in the device secure store — Keychain or
 * Keystore (requirements §2.3) — and UI preferences in async storage; this
 * interface is what both of those slot into.
 *
 * Every accessor is defensive. Storage throws in private browsing modes and in
 * embedded webviews, and a preference failing to load must never take the app
 * down with it.
 */

const memory = new Map<string, string>();

function backend(): Storage | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage;
  } catch {
    return null;
  }
}

export function readValue(key: string): string | null {
  try {
    const store = backend();
    if (store) return store.getItem(key);
  } catch {
    // fall through to the memory copy
  }
  return memory.get(key) ?? null;
}

export function writeValue(key: string, value: string): void {
  memory.set(key, value);
  try {
    backend()?.setItem(key, value);
  } catch {
    // Memory copy is enough; persistence is a convenience, not a correctness need.
  }
}

export function clearValue(key: string): void {
  memory.delete(key);
  try {
    backend()?.removeItem(key);
  } catch {
    // ignore
  }
}

export function readJson<T>(key: string, fallback: T): T {
  const raw = readValue(key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    writeValue(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export const STORAGE_KEYS = {
  sessionUserId: 'a1a.session.userId',
  calendarView: 'a1a.prefs.calendarView',
  categoryFilter: 'a1a.prefs.categoryFilter',
  cardSort: 'a1a.prefs.cardSort',
  phiNotice: 'a1a.prefs.phiNoticeDismissed',
} as const;
