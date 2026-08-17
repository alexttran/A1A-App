import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

/**
 * Root layout.
 *
 * Intentionally thin for now. Checkpoint 3 adds the TanStack Query provider and
 * Sentry, and Checkpoint 5 adds the auth session gate and the tab shell.
 */
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </GestureHandlerRootView>
  );
}
