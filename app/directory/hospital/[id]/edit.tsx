import { useLocalSearchParams } from 'expo-router';

import { HospitalFormScreen } from '@/features/directory/screens/HospitalFormScreen';

export default function EditHospitalRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <HospitalFormScreen hospitalId={id} />;
}
