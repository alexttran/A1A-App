/**
 * Session storage for the Supabase auth client.
 *
 * Requirements §2.3 asks for the refresh token to live in the device secure
 * store — Keychain on iOS, Keystore on Android. `expo-secure-store` is that, but
 * it has a constraint the naive adapter gets wrong: values are limited to about
 * 2048 bytes, and a Supabase session (access token + refresh token + the encoded
 * user) routinely exceeds it. Over the limit, SecureStore warns on iOS and can
 * fail outright on Android, which surfaces as a user who is silently signed out
 * on next launch.
 *
 * So values are chunked. The key itself holds the chunk count; the chunks live
 * beside it under `<key>.0`, `<key>.1`, and so on.
 *
 * On web there is no secure store and no Keychain to put anything in. The
 * prototype and any future web target fall back to localStorage through the same
 * shim the UI preferences use. That is strictly less safe, which is acceptable
 * only because web is not a shipping target (§1.3) — it hosts the layout
 * prototype. Revisit this before that ever changes.
 */

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import { clearValue, readValue, writeValue } from './storage';

/**
 * Comfortably under SecureStore's ~2048-byte ceiling. The margin covers
 * multi-byte UTF-8 characters, since the limit is on bytes and this splits on
 * JavaScript string units.
 */
const CHUNK_SIZE = 1024;

const isWeb = Platform.OS === 'web';

const chunkKey = (key: string, index: number) => `${key}.${index}`;

async function readChunkCount(key: string): Promise<number | null> {
  const raw = await SecureStore.getItemAsync(key);
  if (raw === null) return null;

  const count = Number.parseInt(raw, 10);
  return Number.isInteger(count) && count >= 0 ? count : null;
}

async function clearChunks(key: string, count: number): Promise<void> {
  const deletions: Promise<void>[] = [SecureStore.deleteItemAsync(key)];
  for (let i = 0; i < count; i += 1) {
    deletions.push(SecureStore.deleteItemAsync(chunkKey(key, i)));
  }
  await Promise.all(deletions);
}

/**
 * The shape `createClient({ auth: { storage } })` expects. Every method resolves
 * rather than throws: a storage failure should log the user out and let them
 * sign in again, never crash the app on launch.
 */
export const authStorage = {
  async getItem(key: string): Promise<string | null> {
    if (isWeb) return readValue(key);

    try {
      const count = await readChunkCount(key);
      if (count === null) return null;

      const chunks = await Promise.all(
        Array.from({ length: count }, (_, i) => SecureStore.getItemAsync(chunkKey(key, i))),
      );

      // A missing chunk means a partial write — a crash or a force-quit between
      // two SecureStore calls. Half a session is worse than none, because the
      // client would try to refresh with a truncated token and fail opaquely.
      if (chunks.some((chunk) => chunk === null)) {
        await clearChunks(key, count);
        return null;
      }

      return chunks.join('');
    } catch {
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    if (isWeb) {
      writeValue(key, value);
      return;
    }

    try {
      // Drop any longer previous value first, or its trailing chunks survive and
      // corrupt the next read.
      const previous = await readChunkCount(key);
      if (previous !== null) await clearChunks(key, previous);

      const chunks: string[] = [];
      for (let i = 0; i < value.length; i += CHUNK_SIZE) {
        chunks.push(value.slice(i, i + CHUNK_SIZE));
      }

      // Chunks are written before the count, so an interrupted write leaves no
      // count key and therefore reads as "no session" rather than as a corrupt one.
      await Promise.all(
        chunks.map((chunk, i) => SecureStore.setItemAsync(chunkKey(key, i), chunk)),
      );
      await SecureStore.setItemAsync(key, String(chunks.length));
    } catch {
      // Session persistence is a convenience; failing to store it must not break
      // the sign-in that just succeeded.
    }
  },

  async removeItem(key: string): Promise<void> {
    if (isWeb) {
      clearValue(key);
      return;
    }

    try {
      const count = await readChunkCount(key);
      await clearChunks(key, count ?? 0);
    } catch {
      // ignore
    }
  },
};
