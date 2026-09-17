import { Link, useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { Expense } from '@/domain/types';
import { useActiveProject } from '@/hooks/useActiveProject';
import { useCategories } from '@/hooks/useCategories';
import { useExpenses } from '@/hooks/useExpenses';
import { useTheme } from '@/hooks/use-theme';
import { formatAmount } from '@/utils/money';

// Lista de gastos (orden por fecha desc). Cada fila lleva a editarla en
// src/app/expenses/[id].tsx.
export default function ExpensesScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { project } = useActiveProject();
  const { expenses, loading } = useExpenses(project?.id);
  const { categories } = useCategories(project?.id);

  function categoryName(categoryId: number): string {
    return categories.find((category) => category.id === categoryId)?.name ?? '—';
  }

  function renderItem({ item }: { item: Expense }) {
    return (
      <Pressable
        onPress={() => router.push(`/expenses/${item.id}`)}
        style={[styles.row, { backgroundColor: theme.backgroundElement }]}
      >
        <View style={styles.rowHeader}>
          <ThemedText type="smallBold">{categoryName(item.categoryId)}</ThemedText>
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
          <ThemedText type="subtitle">Gastos</ThemedText>
          <Link href="/expenses/new">
            <ThemedText type="linkPrimary">+ Nuevo gasto</ThemedText>
          </Link>
        </View>

        {!loading && expenses.length === 0 && (
          <ThemedText type="small">Todavía no hay gastos registrados.</ThemedText>
        )}

        <FlatList
          data={expenses}
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
