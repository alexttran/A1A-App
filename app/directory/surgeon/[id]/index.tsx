import { useLocalSearchParams } from 'expo-router';

import { SurgeonDetailScreen } from '@/features/directory/screens/SurgeonDetailScreen';

export default function SurgeonRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <SurgeonDetailScreen id={id} />;
}
