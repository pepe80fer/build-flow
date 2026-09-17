import { Link } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

// Home: resumen de presupuesto (total, gastado, disponible) en tiempo real.
// El contenido real se construye en la Fase 2 del plan; por ahora es un
// esqueleto de navegación hacia gastos y presupuesto.
export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title">build-flow</ThemedText>
        <ThemedText type="small">Resumen de presupuesto (pendiente: Fase 2)</ThemedText>

        <ThemedView type="backgroundElement" style={styles.linkGroup}>
          <Link href="/budget" style={styles.link}>
            <ThemedText type="link">Ver presupuesto</ThemedText>
          </Link>
          <Link href="/expenses" style={styles.link}>
            <ThemedText type="link">Ver gastos</ThemedText>
          </Link>
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  linkGroup: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  link: {
    paddingVertical: Spacing.one,
  },
});
