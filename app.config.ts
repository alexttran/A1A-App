import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Dynamic Expo config.
 *
 * Environment variables are read here (Expo CLI auto-loads `.env`, `.env.local`,
 * and `.env.<NODE_ENV>` into `process.env` before this file is evaluated) and
 * handed to the app through `extra`, which is read at runtime via
 * `expo-constants`. See `src/lib/env.ts` for the reader.
 *
 * ---------------------------------------------------------------------------
 * SECURITY — READ BEFORE ADDING A VARIABLE HERE
 * ---------------------------------------------------------------------------
 * Everything placed in `extra` is compiled into the app bundle and is readable
 * by anyone who installs the app. Treat this file as public.
 *
 *   SAFE   — SUPABASE_URL and the Supabase **anon** key. The anon key is a
 *            public, RLS-scoped identifier; it is designed to ship in clients
 *            and grants nothing that row-level security does not already allow.
 *            Its safety depends entirely on RLS being enabled on every table.
 *
 *   NEVER  — the Supabase **service role** key. It bypasses row-level security
 *            completely. It must never appear in this file, in `extra`, in any
 *            `EXPO_PUBLIC_*` variable, in `.env` files that are committed, or
 *            anywhere else in this repository. Server-side work that genuinely
 *            needs it belongs in a Supabase Edge Function, where the key is
 *            supplied by the platform as a function secret. The same rule
 *            applies to the Sentry auth token, which lives only in EAS secrets.
 * ---------------------------------------------------------------------------
 */

const IS_DEV = process.env.APP_VARIANT === 'development';
const IS_PREVIEW = process.env.APP_VARIANT === 'preview';

/** Per-variant identity, so dev/preview/prod builds can coexist on one device. */
function variant() {
  if (IS_DEV) {
    return { name: 'A1A Field (Dev)', bundleId: 'com.a1a.fieldapp.dev' };
  }
  if (IS_PREVIEW) {
    return { name: 'A1A Field (Preview)', bundleId: 'com.a1a.fieldapp.preview' };
  }
  return { name: 'A1A Field', bundleId: 'com.a1a.fieldapp' };
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const { name, bundleId } = variant();

  return {
    ...config,
    name,
    slug: 'a1a-field-app',
    version: '0.1.0',
    // requirements §1.3 excludes a web target from v1. 'web' is present only to
    // host the clickable layout prototype (see README "Prototype preview") — the
    // screens are built from React Native primitives so nothing here is
    // web-specific work that has to be redone for the phone build.
    platforms: ['ios', 'android', 'web'],
    orientation: 'portrait', // requirements §3 — portrait only
    icon: './assets/images/icon.png',
    // URL scheme for auth deep links (invite / password-reset emails).
    // Must match the redirect URLs allow-list in the Supabase dashboard.
    scheme: 'a1afield',
    userInterfaceStyle: 'light', // light mode only for now; see src/theme
    // NOTE: there is deliberately no `newArchEnabled` flag. From SDK 55 the New
    // Architecture is unconditional and the config key was removed — setting it
    // is now a type error. This matters for Checkpoint 6: every native module we
    // add must ship Fabric/TurboModule support, with no legacy fallback.
    ios: {
      bundleIdentifier: bundleId,
      supportsTablet: false, // requirements §1.3 — phone only
    },
    web: {
      bundler: 'metro',
      output: 'single', // single-page app; the prototype has no server routes
      favicon: './assets/images/icon.png',
    },
    android: {
      package: bundleId,
      predictiveBackGestureEnabled: false,
      adaptiveIcon: {
        backgroundColor: '#E6F0FA',
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
    },
    plugins: [
      'expo-router',
      // Keychain / Keystore for the auth refresh token (requirements §2.3).
      'expo-secure-store',
      [
        'expo-splash-screen',
        {
          backgroundColor: '#FFFFFF',
          image: './assets/images/splash-icon.png',
          imageWidth: 160,
        },
      ],
      [
        'expo-build-properties',
        {
          // requirements §3 asks for Android 10+ (API 29). Expo's floor is 21,
          // so 29 is ours to set and it holds.
          android: { minSdkVersion: 29 },
          // requirements §3 asks for iOS 15+. NOT ACHIEVABLE on this SDK:
          // Expo SDK 56+ (React Native 0.85+) hard-requires iOS 16.4, and
          // expo-build-properties refuses to build below it. iOS 15.1 is only
          // reachable by pinning back to SDK 55 or earlier. Flagged for the
          // requirements owner — see README "Deviations from requirements".
          ios: { deploymentTarget: '16.4' },
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      ...config.extra,
      // Public, client-safe values only. See the security block above.
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
      sentryDsn: process.env.SENTRY_DSN,
      appVariant: process.env.APP_VARIANT ?? 'development',
    },
  };
};
