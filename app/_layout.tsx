import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DevicePreview } from '@/components/DevicePreview';
import { AppDataProvider } from '@/lib/mock/store';
import { SessionProvider, useSession } from '@/stores/session';
import { UiPrefsProvider } from '@/stores/uiPrefs';

/**
 * Root layout.
 *
 * `AppDataProvider` stands in for the TanStack Query provider and the Supabase
 * client; `SessionProvider` for the real auth session. `DevicePreview` frames the
 * app at phone size on web and is a no-op on iOS and Android.
 */
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppDataProvider>
          <SessionProvider>
            <UiPrefsProvider>
              <StatusBar style="dark" />
              <DevicePreview>
                <RootNavigator />
              </DevicePreview>
            </UiPrefsProvider>
          </SessionProvider>
        </AppDataProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/**
 * The auth gate, at the root rather than on the tab group.
 *
 * Every screen except `login` needs a session — including the ones outside the
 * tabs, which is where deep links land: an invite email, or the hospital and
 * surgeon links on an event (FR-CAL-5). Guarding only the tab group would let a
 * cold deep link render a signed-out detail screen.
 *
 * This is a UX gate. It hides screens; it does not protect data. Row-level
 * security is the actual boundary (requirements NFR-3).
 */
function RootNavigator() {
  const { user } = useSession();

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Protected guard={user !== null}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="bulletin" />
        <Stack.Screen name="directory" />
        <Stack.Screen name="documents" />
        <Stack.Screen name="calendar" />
        <Stack.Screen name="admin" />
      </Stack.Protected>

      <Stack.Protected guard={user === null}>
        <Stack.Screen name="login" />
      </Stack.Protected>
    </Stack>
  );
}
