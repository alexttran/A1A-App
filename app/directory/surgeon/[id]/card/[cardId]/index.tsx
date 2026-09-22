import { useLocalSearchParams } from 'expo-router';

import { PreferenceCardFormScreen } from '@/features/directory/screens/PreferenceCardFormScreen';

export default function EditCardRoute() {
  const { id, cardId } = useLocalSearchParams<{ id: string; cardId: string }>();
  return <PreferenceCardFormScreen surgeonId={id} cardId={cardId} />;
}
