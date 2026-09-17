import Ionicons from '@expo/vector-icons/Ionicons';
import * as DocumentPicker from 'expo-document-picker';
import { Image } from 'expo-image';
import { Link, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { Expense } from '@/domain/types';
import { useActiveProject } from '@/hooks/useActiveProject';
import { useCategories } from '@/hooks/useCategories';
import { useExpenses } from '@/hooks/useExpenses';
import { useTheme } from '@/hooks/use-theme';
import { toISODateString } from '@/utils/date';
import { alertUnexpectedError } from '@/utils/errors';
import { buildExpensesCsv, shareCsv } from '@/utils/export';
import { importExpensesFromCsv, parseExpensesCsv } from '@/utils/importCsv';
import { formatAmount } from '@/utils/money';

// Lista de gastos (orden por fecha desc), con buscador por nota y filtro
// por categoría. Cada fila lleva a editarla en src/app/expenses/[id].tsx.
export default function ExpensesScreen() {
  const router = useRouter();
  const theme = useTheme();
  const db = useSQLiteContext();
  const { project } = useActiveProject();
  const { expenses, loading, refetch } = useExpenses(project?.id);
  const { categories } = useCategories(project?.id);

  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null);

  function categoryName(categoryId: number): string {
    return categories.find((category) => category.id === categoryId)?.name ?? '—';
  }

  const filteredExpenses = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();
    return expenses.filter((expense) => {
      if (categoryFilter !== null && expense.categoryId !== categoryFilter) {
        return false;
      }
      if (normalizedSearch && !(expense.note ?? '').toLowerCase().includes(normalizedSearch)) {
        return false;
      }
      return true;
    });
  }, [expenses, searchText, categoryFilter]);

  async function handleExport() {
    if (filteredExpenses.length === 0) {
      Alert.alert('Nada que exportar', 'No hay gastos que coincidan con el filtro actual.');
      return;
    }
    try {
      const csv = buildExpensesCsv(filteredExpenses, categories);
      await shareCsv(`gastos-${toISODateString(new Date())}.csv`, csv);
    } catch (error) {
      alertUnexpectedError('No se pudo exportar', error);
    }
  }

  async function handleImport() {
    if (!project) {
      return;
    }

    let content: string;
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: false,
      });
      if (picked.canceled || !picked.assets?.[0]) {
        return;
      }
      content = await (await fetch(picked.assets[0].uri)).text();
    } catch (error) {
      alertUnexpectedError('No se pudo leer el archivo', error);
      return;
    }

    const { rows, headerOk } = parseExpensesCsv(content);
    if (!headerOk) {
      Alert.alert(
        'Formato no reconocido',
        'El archivo debe tener las columnas Fecha, Monto, Categoría, Nota — el mismo formato que genera "Exportar".',
      );
      return;
    }
    if (rows.length === 0) {
      Alert.alert('Archivo vacío', 'No se encontraron filas para importar.');
      return;
    }

    Alert.alert(
      'Importar gastos',
      `Se importarán ${rows.length} gasto(s). Si ya tienes datos cargados, esto puede crear duplicados. ¿Continuar?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Importar',
          onPress: async () => {
            try {
              const result = await importExpensesFromCsv(db, project.id, categories, rows);
              refetch();
              const summary =
                result.skipped > 0
                  ? `Se importaron ${result.imported} gasto(s). Se omitieron ${result.skipped} fila(s):\n${result.skipReasons.slice(0, 5).join('\n')}`
                  : `Se importaron ${result.imported} gasto(s) correctamente.`;
              Alert.alert('Importación completa', summary);
            } catch (error) {
              alertUnexpectedError('No se pudo importar', error);
            }
          },
        },
      ],
    );
  }

  function renderItem({ item }: { item: Expense }) {
    return (
      <Pressable
        onPress={() => router.push(`/expenses/${item.id}`)}
        style={[styles.row, { backgroundColor: theme.backgroundElement }]}
      >
        {item.photoUri && (
          <Image source={{ uri: item.photoUri }} style={styles.rowThumbnail} contentFit="cover" />
        )}
        <View style={styles.rowContent}>
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
        </View>
      </Pressable>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
        <View style={styles.headerRow}>
          <ThemedText type="subtitle">Gastos</ThemedText>
          <View style={styles.headerActions}>
            <Pressable onPress={handleImport} hitSlop={8} style={styles.headerIconButton}>
              <Ionicons name="document-attach-outline" size={20} color={theme.text} />
            </Pressable>
            <Pressable onPress={handleExport} hitSlop={8} style={styles.headerIconButton}>
              <Ionicons name="download-outline" size={20} color={theme.text} />
            </Pressable>
            <Link href="/expenses/new" style={styles.headerActionButton}>
              <ThemedText type="linkPrimary">+ Nuevo gasto</ThemedText>
            </Link>
          </View>
        </View>

        {expenses.length > 0 && (
          <View style={styles.filters}>
            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Buscar por nota…"
              placeholderTextColor={theme.textSecondary}
              style={[
                styles.searchInput,
                { color: theme.text, backgroundColor: theme.backgroundElement },
              ]}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryFilterRow}
            >
              <Pressable
                onPress={() => setCategoryFilter(null)}
                style={[
                  styles.categoryChip,
                  { backgroundColor: theme.backgroundElement },
                  categoryFilter === null && { backgroundColor: theme.backgroundSelected },
                ]}
              >
                <ThemedText type="small">Todas</ThemedText>
              </Pressable>
              {categories.map((category) => (
                <Pressable
                  key={category.id}
                  onPress={() =>
                    setCategoryFilter((current) => (current === category.id ? null : category.id))
                  }
                  style={[
                    styles.categoryChip,
                    { backgroundColor: theme.backgroundElement },
                    categoryFilter === category.id && { backgroundColor: theme.backgroundSelected },
                  ]}
                >
                  <ThemedText type="small">{category.name}</ThemedText>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {!loading && expenses.length === 0 && (
          <ThemedView type="backgroundElement" style={styles.emptyState}>
            <ThemedText type="smallBold">Todavía no hay gastos registrados.</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Toca &quot;+ Nuevo gasto&quot; para registrar el primero.
            </ThemedText>
          </ThemedView>
        )}

        {!loading && expenses.length > 0 && filteredExpenses.length === 0 && (
          <ThemedView type="backgroundElement" style={styles.emptyState}>
            <ThemedText type="smallBold">Ningún gasto coincide con el filtro.</ThemedText>
          </ThemedView>
        )}

        <FlatList
          data={filteredExpenses}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  headerActionButton: {
    paddingVertical: Spacing.two,
  },
  headerIconButton: {
    padding: Spacing.one,
  },
  filters: {
    gap: Spacing.two,
  },
  searchInput: {
    borderRadius: Spacing.two,
    minHeight: 48,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  categoryFilterRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  categoryChip: {
    borderRadius: Spacing.four,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  emptyState: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.half,
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  rowThumbnail: {
    width: 48,
    height: 48,
    borderRadius: Spacing.two,
  },
  rowContent: {
    flex: 1,
    gap: Spacing.half,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
