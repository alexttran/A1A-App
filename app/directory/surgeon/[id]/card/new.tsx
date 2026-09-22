import { useLocalSearchParams } from 'expo-router';

import { PreferenceCardFormScreen } from '@/features/directory/screens/PreferenceCardFormScreen';

export default function NewCardRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <PreferenceCardFormScreen surgeonId={id} />;
}
