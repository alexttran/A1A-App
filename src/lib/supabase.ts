/**
 * The Supabase client.
 *
 * Importing this module requires a configured `.env` — `src/lib/env.ts` throws
 * on a missing SUPABASE_URL or anon key. That is why nothing imports it yet: the
 * layout prototype (`npm run web`) runs with no backend and must keep doing so
 * until the screens are ported off `src/lib/mock/`. The first feature to adopt
 * real queries is also the first that needs a `.env`. See SETUP.md.
 *
 * The anon key shipped here is public by design — it is RLS-scoped and grants
 * nothing row-level security does not already allow. Its safety depends entirely
 * on RLS being enabled on every table, which is why every migration ends with an
 * `enable row level security` and `docs/rls-tests.sql` exists to prove it.
 */

// React Native's URL implementation is incomplete; supabase-js builds request
// URLs with it. Must be imported before createClient runs.
import 'react-native-url-polyfill/auto';

import { AppState, Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';

import { authStorage } from './authStorage';
import type { Database } from './database.types';
import { env } from './env';

export const supabase = createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    storage: authStorage,
    // §2.3 — sessions survive an app launch. The refresh token is read from the
    // secure store on start and exchanged silently.
    persistSession: true,
    autoRefreshToken: true,
    // Only the web build can receive a session in a URL fragment. On device the
    // invite and password-reset links arrive as `a1afield://` deep links and are
    // handled explicitly by the auth screens.
    detectSessionInUrl: Platform.OS === 'web',
  },
});

/**
 * Refresh only while the app is in front of the user.
 *
 * supabase-js runs a background timer to refresh the access token. On a phone
 * that timer keeps firing while the app is suspended, producing failed requests
 * against a dead network and, on a long-backgrounded app, a burst of retries the
 * moment it resumes. Tying it to foreground state is the documented React Native
 * pattern.
 *
 * Called once from the root layout, not at import time, so the listener's
 * lifetime is the app's and tests can import this module without side effects.
 */
export function startAutoRefresh(): () => void {
  if (Platform.OS === 'web') return () => {};

  const subscription = AppState.addEventListener('change', (state) => {
    if (state === 'active') void supabase.auth.startAutoRefresh();
    else void supabase.auth.stopAutoRefresh();
  });

  if (AppState.currentState === 'active') void supabase.auth.startAutoRefresh();

  return () => {
    subscription.remove();
    void supabase.auth.stopAutoRefresh();
  };
}
