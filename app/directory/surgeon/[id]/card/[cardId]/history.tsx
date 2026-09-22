import { useLocalSearchParams } from 'expo-router';

import { PreferenceHistoryScreen } from '@/features/directory/screens/PreferenceHistoryScreen';

export default function CardHistoryRoute() {
  const { cardId } = useLocalSearchParams<{ cardId: string }>();
  return <PreferenceHistoryScreen cardId={cardId} />;
}
