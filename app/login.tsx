import { LoginScreen } from '@/features/auth/screens/LoginScreen';

/**
 * Login route.
 *
 * Deliberately not at `/`: the tab group adds no URL segment, so
 * `app/(tabs)/index.tsx` already owns `/`. A second `app/index.tsx` would collide
 * with it. The root layout's `Stack.Protected` decides which of the two is
 * reachable.
 */
export default function LoginRoute() {
  return <LoginScreen />;
}
