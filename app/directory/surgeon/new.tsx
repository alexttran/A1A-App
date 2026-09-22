import { useLocalSearchParams } from 'expo-router';

import { SurgeonFormScreen } from '@/features/directory/screens/SurgeonFormScreen';

export default function NewSurgeonRoute() {
  // Pre-selects the hospital when arriving from a hospital detail screen.
  const { hospitalId } = useLocalSearchParams<{ hospitalId?: string }>();
  return <SurgeonFormScreen defaultHospitalId={hospitalId} />;
}
