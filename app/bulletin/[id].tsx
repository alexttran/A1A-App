import { useLocalSearchParams } from 'expo-router';

import { AnnouncementDetailScreen } from '@/features/bulletin/screens/AnnouncementDetailScreen';

export default function AnnouncementRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <AnnouncementDetailScreen id={id} />;
}
