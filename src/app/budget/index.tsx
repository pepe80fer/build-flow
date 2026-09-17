import { Link, useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { BudgetEntry } from '@/domain/types';
import { useActiveProject } from '@/hooks/useActiveProject';
import { useBudgetEntries } from '@/hooks/useBudgetEntries';
import { useTheme } from '@/hooks/use-theme';
import { formatAmount } from '@/utils/money';

// Historial completo de movimientos de presupuesto (inicial + incrementos).
// Cada fila lleva a editarla/eliminarla en src/app/budget/increase.tsx.
export default function BudgetScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { project } = useActiveProject();
  const { entries, loading } = useBudgetEntries(project?.id);

  function renderItem({ item }: { item: BudgetEntry }) {
    return (
      <Pressable
        onPress={() => router.push(`/budget/increase?id=${item.id}`)}
        style={[styles.row, { backgroundColor: theme.backgroundElement }]}
      >
        <View style={styles.rowHeader}>
          <ThemedText type="smallBold">
            {item.type === 'initial' ? 'Presupuesto inicial' : 'Incremento'}
          </ThemedText>
          <ThemedText type="smallBold">
            {formatAmount(item.amount, project?.currency ?? 'COP')}
          </ThemedText>
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          {item.date}
        </ThemedText>
        {item.note ? <ThemedText type="small">{item.note}</ThemedText> : null}
      </Pressable>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerRow}>
          <ThemedText type="subtitle">Presupuesto</ThemedText>
          <Link href="/budget/increase">
            <ThemedText type="linkPrimary">+ Incremento</ThemedText>
          </Link>
        </View>

        {!loading && entries.length === 0 && (
          <ThemedText type="small">Todavía no hay movimientos de presupuesto.</ThemedText>
        )}

        <FlatList
          data={entries}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  list: {
    gap: Spacing.two,
  },
  row: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.half,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
