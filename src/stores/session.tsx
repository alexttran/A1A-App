/**
 * Auth session.
 *
 * Prototype implementation: no network, any password works, and there is a role
 * switch so a reviewer can see the same screen as an Admin and as a Standard user
 * without two accounts. The public surface — `useSession()` returning a user, a
 * role and `isAdmin` — is what the Supabase-backed version will expose, so the
 * screens that consume it do not change.
 *
 * The session id is persisted, because requirements §2.3 asks for sessions that
 * survive an app launch. Here that means a browser refresh or a cold deep link
 * keeps you signed in; in the real app it is a refresh token in the device secure
 * store, read on launch and silently refreshed.
 *
 * Will become a Zustand store (requirements §6.2) once the real session lands;
 * React context here keeps the prototype dependency-free.
 */

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { USERS } from '@/lib/mock/data';
import { useData } from '@/lib/mock/store';
import type { Role, User } from '@/lib/mock/types';
import { clearValue, readValue, STORAGE_KEYS, writeValue } from '@/lib/storage';

type Session = {
  user: User | null;
  role: Role | null;
  isAdmin: boolean;
  signIn: (email: string) => void;
  signOut: () => void;
  /** Prototype-only: swap between a seeded admin and a seeded standard user. */
  actAs: (role: Role) => void;
};

const SessionContext = createContext<Session | null>(null);

const ADMIN_DEMO_USER = USERS.dana;
const STANDARD_DEMO_USER = USERS.marcus;

export function SessionProvider({ children }: { children: ReactNode }) {
  const db = useData();

  // Read synchronously on mount rather than in an effect, so the first render is
  // already correct and the auth gate never flashes the login screen.
  const [userId, setUserId] = useState<string | null>(() => readValue(STORAGE_KEYS.sessionUserId));

  const user = useMemo(() => db.users.find((u) => u.id === userId) ?? null, [db.users, userId]);

  const persist = useCallback((id: string | null) => {
    if (id === null) clearValue(STORAGE_KEYS.sessionUserId);
    else writeValue(STORAGE_KEYS.sessionUserId, id);
    setUserId(id);
  }, []);

  const signIn = useCallback(
    (email: string) => {
      const match = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
      persist(match?.id ?? ADMIN_DEMO_USER);
    },
    [db.users, persist],
  );

  const signOut = useCallback(() => persist(null), [persist]);

  const actAs = useCallback(
    (role: Role) => persist(role === 'admin' ? ADMIN_DEMO_USER : STANDARD_DEMO_USER),
    [persist],
  );

  const value = useMemo<Session>(
    () => ({
      user,
      role: user?.role ?? null,
      isAdmin: user?.role === 'admin',
      signIn,
      signOut,
      actAs,
    }),
    [user, signIn, signOut, actAs],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): Session {
  const session = useContext(SessionContext);
  if (!session) throw new Error('useSession must be used inside <SessionProvider>');
  return session;
}

/**
 * The signed-in user, for screens that render behind the auth gate.
 *
 * Returns the seeded admin rather than throwing if it is somehow reached without
 * a session. A screen briefly rendering during a sign-out transition should not
 * take the app down — the gate is what decides reachability, and the database is
 * what enforces access (NFR-3).
 */
export function useCurrentUser(): User {
  const { user } = useSession();
  const db = useData();
  const fallback = db.users.find((u) => u.id === ADMIN_DEMO_USER);
  return user ?? fallback ?? db.users[0]!;
}
