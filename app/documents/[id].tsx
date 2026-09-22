import { useLocalSearchParams } from 'expo-router';

import { DocumentViewerScreen } from '@/features/documents/screens/DocumentViewerScreen';

export default function DocumentRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <DocumentViewerScreen id={id} />;
}
