import Constants from 'expo-constants';

/**
 * Runtime access to the values `app.config.ts` placed in `extra`.
 *
 * These are all PUBLIC — they ship inside the app bundle. The Supabase anon key
 * belongs here; the service role key never does. See the security block at the
 * top of `app.config.ts`.
 *
 * Validation is deliberately eager and loud: a missing Supabase URL should fail
 * at startup with a message naming the variable, not surface later as an opaque
 * network error.
 */

export type AppVariant = 'development' | 'preview' | 'production';

type RawExtra = {
  supabaseUrl?: unknown;
  supabaseAnonKey?: unknown;
  sentryDsn?: unknown;
  appVariant?: unknown;
};

export type Env = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  /** Undefined disables Sentry rather than crashing — useful for local work. */
  sentryDsn: string | undefined;
  appVariant: AppVariant;
  isDevBuild: boolean;
};

const extra = (Constants.expoConfig?.extra ?? {}) as RawExtra;

function required(key: keyof RawExtra, envVarName: string): string {
  const value = extra[key];
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(
      `Missing required config value "${key}". Set ${envVarName} in your .env file ` +
        `(copy .env.example to .env), then restart the bundler with \`npm start -- --clear\`. ` +
        `Environment variables are read at config-evaluation time, so a running ` +
        `bundler will not pick up a change on its own.`,
    );
  }
  return value;
}

function optional(key: keyof RawExtra): string | undefined {
  const value = extra[key];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function parseVariant(value: unknown): AppVariant {
  return value === 'production' || value === 'preview' ? value : 'development';
}

const appVariant = parseVariant(extra.appVariant);

export const env: Env = {
  supabaseUrl: required('supabaseUrl', 'SUPABASE_URL'),
  supabaseAnonKey: required('supabaseAnonKey', 'SUPABASE_ANON_KEY'),
  sentryDsn: optional('sentryDsn'),
  appVariant,
  isDevBuild: appVariant === 'development',
};
