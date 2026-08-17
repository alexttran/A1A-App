import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Placeholder entry screen. Replaced in Checkpoint 5 by the auth gate, which
 * redirects to either the login screen or the tab shell.
 */
export default function Index() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>A1A Field App</Text>
        <Text style={styles.subtitle}>Phase 0 scaffolding — Checkpoint 1</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  title: { fontSize: 24, fontWeight: '600', color: '#111827' },
  subtitle: { fontSize: 15, color: '#4B5563' },
});
