import { useLocalSearchParams } from 'expo-router';

import { SurgeonFormScreen } from '@/features/directory/screens/SurgeonFormScreen';

export default function EditSurgeonRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <SurgeonFormScreen surgeonId={id} />;
}
