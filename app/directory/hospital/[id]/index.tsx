import { useLocalSearchParams } from 'expo-router';

import { HospitalDetailScreen } from '@/features/directory/screens/HospitalDetailScreen';

export default function HospitalRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <HospitalDetailScreen id={id} />;
}
