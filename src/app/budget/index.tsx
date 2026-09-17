import Ionicons from '@expo/vector-icons/Ionicons';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { Link, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BudgetSummaryCard } from '@/components/BudgetSummaryCard';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { BudgetEntry } from '@/domain/types';
import { useActiveProject } from '@/hooks/useActiveProject';
import { useBudgetEntries } from '@/hooks/useBudgetEntries';
import { useBudgetSummary } from '@/hooks/useBudgetSummary';
import { useTheme } from '@/hooks/use-theme';
import { toISODateString } from '@/utils/date';
import { alertUnexpectedError } from '@/utils/errors';
import { buildBudgetEntriesCsv, shareCsv } from '@/utils/export';
import { importBudgetEntriesFromCsv, parseBudgetEntriesCsv } from '@/utils/importCsv';
import { formatAmount } from '@/utils/money';

// Presupuesto total (arriba) + historial completo de movimientos
// (inicial + incrementos, abajo). Cada fila lleva a editarla/eliminarla en
// src/app/budget/increase.tsx.
export default function BudgetScreen() {
  const router = useRouter();
  const theme = useTheme();
  const db = useSQLiteContext();
  const { project } = useActiveProject();
  const { entries, loading, refetch: refetchEntries } = useBudgetEntries(project?.id);
  const { summary, refetch: refetchSummary } = useBudgetSummary(project?.id);

  async function handleExport() {
    if (entries.length === 0) {
      Alert.alert('Nada que exportar', 'Todavía no hay movimientos de presupuesto.');
      return;
    }
    try {
      const csv = buildBudgetEntriesCsv(entries);
      await shareCsv(`presupuesto-${toISODateString(new Date())}.csv`, csv);
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
        copyToCacheDirectory: true,
      });
      if (picked.canceled || !picked.assets?.[0]) {
        return;
      }
      content = await new File(picked.assets[0].uri).text();
    } catch (error) {
      alertUnexpectedError('No se pudo leer el archivo', error);
      return;
    }

    const { rows, headerOk } = parseBudgetEntriesCsv(content);
    if (!headerOk) {
      Alert.alert(
        'Formato no reconocido',
        'El archivo debe tener las columnas Fecha, Tipo, Monto, Nota — el mismo formato que genera "Exportar".',
      );
      return;
    }
    if (rows.length === 0) {
      Alert.alert('Archivo vacío', 'No se encontraron filas para importar.');
      return;
    }

    Alert.alert(
      'Importar presupuesto',
      `Se importarán ${rows.length} movimiento(s). Si ya tienes datos cargados, esto puede crear duplicados. ¿Continuar?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Importar',
          onPress: async () => {
            try {
              const result = await importBudgetEntriesFromCsv(db, project.id, rows);
              refetchEntries();
              refetchSummary();
              const message =
                result.skipped > 0
                  ? `Se importaron ${result.imported} movimiento(s). Se omitieron ${result.skipped} fila(s):\n${result.skipReasons.slice(0, 5).join('\n')}`
                  : `Se importaron ${result.imported} movimiento(s) correctamente.`;
              Alert.alert('Importación completa', message);
            } catch (error) {
              alertUnexpectedError('No se pudo importar', error);
            }
          },
        },
      ],
    );
  }

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
      <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
        <View style={styles.headerRow}>
          <ThemedText type="subtitle">Presupuesto</ThemedText>
          <View style={styles.headerActions}>
            <Pressable onPress={handleImport} hitSlop={8} style={styles.headerIconButton}>
              <Ionicons name="document-attach-outline" size={20} color={theme.text} />
            </Pressable>
            <Pressable onPress={handleExport} hitSlop={8} style={styles.headerIconButton}>
              <Ionicons name="download-outline" size={20} color={theme.text} />
            </Pressable>
            <Link href="/budget/increase" style={styles.headerActionButton}>
              <ThemedText type="linkPrimary">+ Incremento</ThemedText>
            </Link>
          </View>
        </View>

        {summary && summary.hasEntries && (
          <BudgetSummaryCard
            label="Presupuesto total"
            cents={summary.totalBudget}
            currency={project?.currency ?? 'COP'}
          />
        )}

        {!loading && entries.length === 0 && (
          <ThemedView type="backgroundElement" style={styles.emptyState}>
            <ThemedText type="smallBold">Todavía no hay movimientos de presupuesto.</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Toca &quot;+ Incremento&quot; para configurar tu presupuesto inicial.
            </ThemedText>
          </ThemedView>
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
  emptyState: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.half,
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
