import { useLocalSearchParams } from 'expo-router';

import { ComposeAnnouncementScreen } from '@/features/bulletin/screens/ComposeAnnouncementScreen';

export default function ComposeRoute() {
  // `id` present means editing an existing announcement.
  const { id } = useLocalSearchParams<{ id?: string }>();
  return <ComposeAnnouncementScreen editingId={id} />;
}
