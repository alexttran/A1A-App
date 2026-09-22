import { useLocalSearchParams } from 'expo-router';

import { EventFormScreen } from '@/features/calendar/screens/EventFormScreen';

export default function EditEventRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <EventFormScreen eventId={id} />;
}
